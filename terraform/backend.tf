/**
 * Remote State Configuration
 *
 * Stores Terraform state in S3 with DynamoDB locking.
 * This prevents concurrent applies from corrupting state.
 *
 * IMPORTANT: The S3 bucket and DynamoDB table must be created
 * manually (or via bootstrap script) before running terraform init.
 * See terraform/bootstrap/README.md for instructions.
 *
 * Interview talking point:
 *   Remote state with locking is the standard for any team environment.
 *   S3 versioning means you can roll back to any previous state.
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
    key            = "exam-practice-platform/terraform.tfstate"
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
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "exam-practice-platform"
    }
  }
}

# ACM certificates for CloudFront MUST be in us-east-1
# regardless of where the rest of the infrastructure lives
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "exam-practice-platform"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
