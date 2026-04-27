/**
 * Frontend Hosting Module
 *
 * Provisions:
 *   - S3 bucket for React SPA (private — CloudFront OAC only)
 *   - CloudFront distribution (HTTPS, SPA routing, OAC)
 *   - ACM certificate in us-east-1 (CloudFront requirement)
 *   - Route 53 hosted zone for subdomain (when domain_name is set)
 *   - Route 53 alias record → CloudFront
 *   - ACM DNS validation records in Route 53 (fully automated)
 *
 * When domain_name = "" (default):
 *   - CloudFront URL only, no custom domain, no Route 53, no ACM
 *
 * When domain_name = "aws.aneesahamed.co.uk":
 *   - Route 53 hosted zone created for aws.aneesahamed.co.uk
 *   - ACM certificate issued and auto-validated via Route 53
 *   - CloudFront alias record created
 *   - You add the NS records from Route 53 to GoDaddy once (manual, 5 min)
 *
 * Interview talking point:
 *   "I delegated the subdomain from GoDaddy to Route 53 by adding NS records.
 *    Route 53 manages all DNS for the subdomain — alias record to CloudFront,
 *    ACM certificate validation. Everything is in Terraform, fully reproducible."
 */

data "aws_caller_identity" "current" {}

# ── S3: Frontend Static Assets ───────────────────────────────────────────────

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-${var.environment}-frontend-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── CloudFront Origin Access Control ────────────────────────────────────────

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-${var.environment}-oac"
  description                       = "OAC for ${var.project_name} frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── S3 Bucket Policy: Allow CloudFront OAC only ──────────────────────────────

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_bucket_policy.json
}

data "aws_iam_policy_document" "frontend_bucket_policy" {
  statement {
    sid    = "AllowCloudFrontOAC"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

# ── Route 53: Hosted Zone for subdomain ──────────────────────────────────────
# Created only when domain_name is provided.
# After apply, copy the NS records shown in outputs to GoDaddy DNS.

# ── Route 53: Hosted Zone ────────────────────────────────────────────────────
# MIGRATED: The hosted zone is now managed by infra/layers/01-dns-foundation.
# We read it here via data source so ACM validation records can reference it.

data "aws_route53_zone" "frontend" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

# ── ACM Certificate (must be in us-east-1 for CloudFront) ───────────────────

resource "aws_acm_certificate" "frontend" {
  count    = var.domain_name != "" ? 1 : 0
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# ── ACM DNS Validation records in Route 53 (fully automated) ─────────────────

resource "aws_route53_record" "acm_validation" {
  for_each = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.frontend[0].domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  } : {}

  zone_id = data.aws_route53_zone.frontend[0].zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "frontend" {
  count           = var.domain_name != "" ? 1 : 0
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.frontend[0].arn

  validation_record_fqdns = [
    for record in aws_route53_record.acm_validation : record.fqdn
  ]
}

# ── CloudFront Distribution ──────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"
  comment             = "${var.project_name}-${var.environment}"

  aliases = var.domain_name != "" ? [var.domain_name, "www.${var.domain_name}"] : []

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend.bucket}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.bucket}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == "" ? true : false
    acm_certificate_arn            = var.domain_name != "" ? aws_acm_certificate_validation.frontend[0].certificate_arn : null
    ssl_support_method             = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  depends_on = [aws_acm_certificate_validation.frontend]
}

# ── Route 53: Alias record → CloudFront ──────────────────────────────────────

resource "aws_route53_record" "frontend" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.frontend[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_www" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.frontend[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
