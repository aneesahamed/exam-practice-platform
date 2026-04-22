/**
 * Input Variables
 *
 * Values are provided per environment via:
 *   terraform/environments/dev/terraform.tfvars
 *   terraform/environments/prod/terraform.tfvars
 *
 * terraform.tfvars files are gitignored — values are injected
 * via GitHub Actions secrets in CI/CD.
 */

variable "aws_region" {
  description = "AWS region for all resources (except ACM — always us-east-1)"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Deployment environment: dev or prod"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be 'dev' or 'prod'."
  }
}

variable "project_name" {
  description = "Project name used as a prefix for all resource names"
  type        = string
  default     = "exam-practice-platform"
}

variable "domain_name" {
  description = "Custom domain for the frontend (e.g. examprep.dev). Leave empty to use CloudFront URL only."
  type        = string
  default     = ""
}

variable "cognito_user_pool_name" {
  description = "Name for the Cognito User Pool"
  type        = string
  default     = "exam-practice-users"
}

variable "questions_s3_key" {
  description = "S3 object key for the questions dataset JSON file"
  type        = string
  default     = "AWS-SAA-C03-2025.01-all-questions.json"
}
