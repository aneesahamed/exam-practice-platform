/**
 * Frontend Hosting Module (old monolithic stack)
 *
 * MIGRATION COMPLETE for Phase 4B:
 *   S3 frontend bucket  → migrated to infra/layers/02-platform
 *   CloudFront          → migrated to infra/layers/02-platform
 *   Route 53 records    → migrated to infra/layers/02-platform
 *   ACM certificate     → migrated to infra/layers/02-platform (Phase 4A)
 *
 * This module now only contains data sources to read existing resources
 * so the old stack outputs remain functional during the transition.
 * All resource management has moved to Layer 02.
 */

data "aws_caller_identity" "current" {}

# ── Read existing resources (managed by Layer 02) ────────────────────────────

data "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-${var.environment}-frontend-${data.aws_caller_identity.current.account_id}"
}

data "aws_cloudfront_distribution" "frontend" {
  id = var.cloudfront_distribution_id
}

data "aws_acm_certificate" "frontend" {
  provider = aws.us_east_1
  domain   = var.domain_name
  statuses = ["ISSUED"]
}

data "aws_route53_zone" "frontend" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}
