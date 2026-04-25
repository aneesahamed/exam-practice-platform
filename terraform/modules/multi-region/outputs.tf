output "health_check_id" {
  description = "Route 53 health check ID for the primary API"
  value       = var.enabled ? aws_route53_health_check.primary_api[0].id : null
}

output "failover_api_url" {
  description = "Failover API URL (api.<domain_name>) — active when multi-region is enabled"
  value       = var.enabled && var.domain_name != "" ? "https://api.${var.domain_name}" : null
}
