/**
 * Layer 02 — Platform Infrastructure
 *
 * Phase 4A: ACM certificate + validation records ✅
 * Phase 4B: CloudFront + frontend S3 + Route 53 alias records
 *
 * CloudFront alias attachment requires two applies:
 *   Step 1: Attach ACM certificate (no aliases) — fixes CNAMEAlreadyExists error
 *   Step 2: Add aliases after cert is confirmed attached
 *
 * State: s3://exam-practice-platform-tfstate/layers/02-platform/terraform.tfstate
 */

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "exam-practice-platform-tfstate"
    key            = "layers/02-platform/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "exam-practice-platform-tfstate-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "exam-practice-platform"
      Layer       = "02-platform"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "exam-practice-platform"
      Layer       = "02-platform"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_route53_zone" "main" {
  # The hosted zone is aws.aneesahamed.co.uk — already delegated from GoDaddy.
  # awsprep.aneesahamed.co.uk is a record within this zone, not a separate zone.
  name = "aws.aneesahamed.co.uk"
}

data "aws_caller_identity" "current" {}

# ════════════════════════════════════════════════════════════════════════════
# PHASE 4A — ACM ✅
# ════════════════════════════════════════════════════════════════════════════

resource "aws_acm_certificate" "frontend" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = data.aws_route53_zone.main.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "frontend" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.frontend.arn

  validation_record_fqdns = [
    for record in aws_route53_record.acm_validation : record.fqdn
  ]

  timeouts {
    create = "10m"
  }
}

# ════════════════════════════════════════════════════════════════════════════
# PHASE 4B — Frontend S3 + CloudFront + Route 53 alias records
# ════════════════════════════════════════════════════════════════════════════

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

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-${var.environment}-oac"
  description                       = "OAC for ${var.project_name} frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

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

# ── CloudFront Distribution ───────────────────────────────────────────────────
# Imported from: E11JHAQVQWECRV
#
# IMPORTANT: CloudFront requires the ACM certificate to be attached BEFORE
# aliases can be added. We use a two-step apply:
#   Step 1 (this apply): cert attached, aliases = [] (empty)
#   Step 2 (next apply): aliases added after cert is confirmed attached
#
# This avoids the CNAMEAlreadyExists error from CloudFront.

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"
  comment             = "${var.project_name}-${var.environment}"

  # Aliases now added — ACM cert is confirmed attached
  aliases = [var.domain_name, "www.${var.domain_name}"]

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
    acm_certificate_arn      = aws_acm_certificate_validation.frontend.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  depends_on = [aws_acm_certificate_validation.frontend]
}

# ── Route 53: Alias records → CloudFront ─────────────────────────────────────

resource "aws_route53_record" "frontend" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
