output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "Route 53 hosted zone name"
  value       = aws_route53_zone.main.name
}

output "route53_name_servers" {
  description = "Four Route 53 nameservers — add these as NS records in GoDaddy for host 'aws'"
  value       = aws_route53_zone.main.name_servers
}
