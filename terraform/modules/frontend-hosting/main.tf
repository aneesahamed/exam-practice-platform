/**
 * Frontend Hosting Module
 *
 * Provisions:
 *   - S3 bucket for React SPA (private — CloudFront only access)
 *   - CloudFront distribution (HTTPS, HTTP→HTTPS redirect, SPA routing)
 *   - ACM certificate (us-east-1 — CloudFront requirement)
 *   - Route 53 record (optional — only if domain_name is provided)
 *
 * Design decisions:
 *   - Origin Access Control (OAC): replaces legacy OAI, more secure
 *   - S3 bucket is fully private: no direct public access possible
 *   - SPA routing: 403/404 → index.html (React Router handles the rest)
 *   - HTTPS only: HTTP redirected to HTTPS at CloudFront edge
 *   - Price class ALL: global edge locations for best performance
 *
 * Interview talking point:
 *   "CloudFront sits in front of S3 — users never hit S3 directly.
 *    OAC signs requests with SigV4, so even if someone finds the bucket
 *    name they can't access it without going through CloudFront."
 */

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

  # SPA routing: return index.html for 403/404 so React Router handles the path
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

    dynamic "acm_certificate_arn" {
      for_each = var.domain_name != "" ? [1] : []
      content {
        # This block is intentionally left as a placeholder
        # Terraform handles this via the viewer_certificate block below
      }
    }

    acm_certificate_arn      = var.domain_name != "" ? aws_acm_certificate.frontend[0].arn : null
    ssl_support_method        = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version  = var.domain_name != "" ? "TLSv1.2_2021" : null
  }
}

data "aws_caller_identity" "current" {}
