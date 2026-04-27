/**
 * Layer 02 — Platform Infrastructure
 *
 * Manages all long-lived AWS infrastructure:
 *   - ACM certificate (us-east-1, DNS validated via Route 53)
 *   - CloudFront distribution + OAC
 *   - S3 buckets (frontend, questions, SAM deploy)
 *   - Cognito User Pool + App Client
 *   - DynamoDB tables (progress, flags)
 *   - SSM Parameter Store (contract with Layer 03)
 *
 * Lifecycle: Manual apply, PR plan only.
 * PREREQUISITE: Layer 01 must be applied AND GoDaddy NS delegation
 * must be confirmed before applying this layer.
 *
 * Pre-flight check: This layer verifies DNS delegation before applying.
 * See .github/workflows/02-platform.yml for the dig check.
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

# ── Resources will be migrated here in Phase 4 ───────────────────────────────
