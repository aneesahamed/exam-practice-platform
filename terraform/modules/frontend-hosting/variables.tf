variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment: dev or prod"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name (e.g. examprep.dev). Leave empty to use CloudFront URL."
  type        = string
  default     = ""
}
