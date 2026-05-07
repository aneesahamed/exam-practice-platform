variable "environment" {
  description = "Deployment environment: dev or prod"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be 'dev' or 'prod'."
  }
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
  default     = "exam-practice-platform"
}

variable "domain_name" {
  description = "Custom domain for the frontend"
  type        = string
  default     = "aws.aneesahamed.co.uk"
}
