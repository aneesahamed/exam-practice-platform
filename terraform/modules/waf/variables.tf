variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment: dev or prod"
  type        = string
}

variable "enabled" {
  description = "Whether to create the WAF Web ACL. Disabled by default to avoid $5/month cost."
  type        = bool
  default     = false
}
