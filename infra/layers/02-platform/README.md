# Layer 02 — Platform Infrastructure

**Trigger:** Manual apply, PR plan only  
**State:** `s3://exam-practice-platform-tfstate/layers/02-platform/terraform.tfstate`  
**Region:** eu-west-1 (ACM in us-east-1 via provider alias)

## Prerequisites

- Layer 01 applied ✅
- GoDaddy NS delegation confirmed ✅
- `dig NS aws.aneesahamed.co.uk` returns Route 53 nameservers ✅

## What this layer manages

- ACM certificate for `aws.aneesahamed.co.uk` (us-east-1)
- ACM DNS validation records
- CloudFront distribution + Origin Access Control
- S3 frontend bucket
- S3 questions dataset bucket
- S3 SAM deployment bucket
- Cognito User Pool + App Client
- DynamoDB progress table
- DynamoDB flags table
- SSM Parameter Store (contract with Layer 03)

## SSM Parameters written by this layer

| Parameter | Description |
|---|---|
| `/app/{env}/cloudfront/distribution_id` | CloudFront distribution ID |
| `/app/{env}/s3/frontend_bucket` | Frontend S3 bucket name |
| `/app/{env}/s3/questions_bucket` | Questions S3 bucket name |
| `/app/{env}/s3/sam_deployment_bucket` | SAM deploy S3 bucket name |
| `/app/{env}/cognito/user_pool_id` | Cognito User Pool ID |
| `/app/{env}/cognito/client_id` | Cognito App Client ID |
| `/app/{env}/cognito/user_pool_arn` | Cognito User Pool ARN |
| `/app/{env}/cloudfront/domain_name` | CloudFront domain name |

## Why separate from DNS foundation

ACM certificate validation depends on DNS delegation being complete.
By separating this layer, we can safely apply it only after delegation
is confirmed, without risking a pipeline hang.
