# GitHub Actions — Required Secrets

Configure these in: **GitHub → Repository → Settings → Secrets and variables → Actions**

## AWS Credentials (both environments)

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key (CI/CD deploy user) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `SAM_DEPLOY_BUCKET` | S3 bucket for SAM deployment artefacts |

## Dev Environment

| Secret | Where to get it |
|---|---|
| `DEV_API_BASE_URL` | SAM deploy output: `ApiUrl` |
| `DEV_COGNITO_USER_POOL_ID` | Terraform output: `cognito_user_pool_id` |
| `DEV_COGNITO_CLIENT_ID` | Terraform output: `cognito_user_pool_client_id` |
| `DEV_FRONTEND_BUCKET` | Terraform output: `frontend_bucket_name` |
| `DEV_CLOUDFRONT_DISTRIBUTION_ID` | Terraform output: `cloudfront_distribution_id` |

## Prod Environment

| Secret | Where to get it |
|---|---|
| `PROD_API_BASE_URL` | SAM deploy output: `ApiUrl` |
| `PROD_COGNITO_USER_POOL_ID` | Terraform output: `cognito_user_pool_id` |
| `PROD_COGNITO_CLIENT_ID` | Terraform output: `cognito_user_pool_client_id` |
| `PROD_FRONTEND_BUCKET` | Terraform output: `frontend_bucket_name` |
| `PROD_CLOUDFRONT_DISTRIBUTION_ID` | Terraform output: `cloudfront_distribution_id` |

## IAM Policy for CI/CD User

The `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` should belong to a dedicated
IAM user (not your root account) with only the permissions needed for deployment.

Minimum permissions needed:
- `s3:*` on the frontend bucket and SAM deploy bucket
- `cloudfront:CreateInvalidation` on the distribution
- `lambda:*`, `apigateway:*`, `cloudformation:*` for SAM deploys
- `dynamodb:*` on the platform tables
- `cognito-idp:*` on the user pool

Create a dedicated `github-actions-deploy` IAM user and attach a custom policy.
Never use root account credentials in CI/CD.
