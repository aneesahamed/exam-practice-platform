output "questions_bucket_name" {
  description = "S3 bucket name for the questions dataset"
  value       = aws_s3_bucket.questions.bucket
}

output "questions_bucket_arn" {
  description = "S3 bucket ARN — used in Lambda IAM policies"
  value       = aws_s3_bucket.questions.arn
}

output "progress_table_name" {
  description = "DynamoDB progress table name"
  value       = aws_dynamodb_table.progress.name
}

output "progress_table_arn" {
  description = "DynamoDB progress table ARN — used in Lambda IAM policies"
  value       = aws_dynamodb_table.progress.arn
}

output "flags_table_name" {
  description = "DynamoDB flags table name"
  value       = aws_dynamodb_table.flags.name
}

output "flags_table_arn" {
  description = "DynamoDB flags table ARN — used in Lambda IAM policies"
  value       = aws_dynamodb_table.flags.arn
}
