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

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — managed by Layer 02, passed in for data source lookup"
  type        = string
  default     = "E11JHAQVQWECRV"
}
