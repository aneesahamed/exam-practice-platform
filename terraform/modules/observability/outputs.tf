output "alarm_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  value       = aws_sns_topic.alarms.arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

data "aws_region" "current" {}
