variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment: dev or prod"
  type        = string
}

variable "alarm_email" {
  description = "Email address to receive CloudWatch alarm notifications. Leave empty to skip."
  type        = string
  default     = ""
}

variable "lambda_function_names" {
  description = "List of Lambda function names to monitor"
  type        = list(string)
}

variable "dynamodb_table_names" {
  description = "List of DynamoDB table names to monitor"
  type        = list(string)
}
