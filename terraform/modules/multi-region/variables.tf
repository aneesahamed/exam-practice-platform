variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "enabled" {
  description = "Enable multi-region failover. Costs ~$2-3/month when enabled."
  type        = bool
  default     = false
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for failover"
  type        = string
  default     = "eu-central-1"
}

variable "progress_table_arn" {
  description = "ARN of the DynamoDB progress table to replicate"
  type        = string
}

variable "flags_table_arn" {
  description = "ARN of the DynamoDB flags table to replicate"
  type        = string
}

variable "primary_api_fqdn" {
  description = "FQDN of the primary API Gateway endpoint (without https://)"
  type        = string
}

variable "secondary_api_fqdn" {
  description = "FQDN of the secondary region API Gateway endpoint (without https://)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Custom domain name (e.g. aws.aneesahamed.co.uk)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID for DNS failover records"
  type        = string
  default     = ""
}
