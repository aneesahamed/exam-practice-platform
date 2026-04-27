/**
 * Layer 02 — Platform Infrastructure
 *
 * Phase 4A: ACM certificate + validation records only.
 * CloudFront, S3, Cognito, DynamoDB added in subsequent sub-phases.
 *
 * PREREQUISITE: Layer 01 applied AND GoDaddy NS delegation confirmed.
 * Pre-flight dig check in 02-platform.yml verifies this before apply.
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

# ACM certificates for CloudFront MUST be in us-east-1
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

# ── Read Route 53 hosted zone from DNS foundation layer ──────────────────────
# We do not manage the hosted zone here — it belongs to Layer 01.
# We only read it to create validation records inside it.

data "aws_route53_zone" "main" {
  name = var.domain_name
}

# ── ACM Certificate ──────────────────────────────────────────────────────────
# Must be in us-east-1 — CloudFront requirement.
# create_before_destroy ensures zero-downtime certificate rotation.
#
# Imported from: arn:aws:acm:us-east-1:393286881899:certificate/f2b8aede-38c1-4b71-b6c4-c50341d8a10f
# Import command:
#   terraform import -provider=aws.us_east_1 \
#     aws_acm_certificate.frontend \
#     arn:aws:acm:us-east-1:393286881899:certificate/f2b8aede-38c1-4b71-b6c4-c50341d8a10f

resource "aws_acm_certificate" "frontend" {
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# ── ACM DNS Validation Records ───────────────────────────────────────────────
# CNAME records placed in the Route 53 hosted zone (owned by Layer 01).
# ACM polls these to confirm domain ownership before issuing the certificate.
#
# Imported from existing records:
#   aws.aneesahamed.co.uk:
#     Z0241761292H9T8SZMYBD__ee45e5948deda1aedadf968450831ab8.aws.aneesahamed.co.uk._CNAME
#   www.aws.aneesahamed.co.uk:
#     Z0241761292H9T8SZMYBD__eb1b762d1a6dbb8631ae60b4de0e7ca9.www.aws.aneesahamed.co.uk._CNAME

resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60

  allow_overwrite = true
}

# ── ACM Certificate Validation ───────────────────────────────────────────────
# Waits for ACM to confirm the DNS validation records exist.
# 10-minute timeout — fails fast if DNS delegation is not working.
#
# Note: Certificate is already ISSUED (status confirmed before migration).
# This resource will complete immediately on first apply.

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
