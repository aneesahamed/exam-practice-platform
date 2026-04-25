output "web_acl_arn" {
  description = "WAF Web ACL ARN — attach to CloudFront distribution when enabled"
  value       = var.enabled ? aws_wafv2_web_acl.main[0].arn : null
}
