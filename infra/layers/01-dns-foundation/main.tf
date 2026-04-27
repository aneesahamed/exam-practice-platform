/**
 * Layer 01 — DNS Foundation
 *
 * Manages the Route 53 hosted zone for aws.aneesahamed.co.uk.
 *
 * Lifecycle: MANUAL ONLY — triggered via workflow_dispatch.
 * This layer runs once (or rarely) and is completely isolated
 * from platform and application deployments.
 *
 * After applying this layer:
 *   1. Run: terraform output route53_name_servers
 *   2. Add the 4 NS records to GoDaddy for host "aws"
 *   3. Verify delegation: dig NS aws.aneesahamed.co.uk
 *   4. Only then proceed to Layer 02 (platform)
 *
 * State: s3://exam-practice-platform-tfstate/layers/01-dns-foundation/terraform.tfstate
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
    key            = "layers/01-dns-foundation/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "exam-practice-platform-tfstate-lock"
  }
}

provider "aws" {
  region = "eu-west-1"

  default_tags {
    tags = {
      Project   = "exam-practice-platform"
      Layer     = "01-dns-foundation"
      ManagedBy = "terraform"
    }
  }
}

# ── Route 53 Hosted Zone ─────────────────────────────────────────────────────
# Placeholder — resource will be added in Phase 2
