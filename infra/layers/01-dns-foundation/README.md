# Layer 01 — DNS Foundation

**Trigger:** Manual only (`workflow_dispatch`)  
**State:** `s3://exam-practice-platform-tfstate/layers/01-dns-foundation/terraform.tfstate`  
**Region:** eu-west-1

## What this layer manages

- Route 53 hosted zone for `aws.aneesahamed.co.uk`

## What this layer does NOT manage

Everything else — ACM, CloudFront, S3, Cognito, DynamoDB, Lambda.

## Deployment sequence

1. Run this layer via GitHub Actions → `01-dns-foundation.yml` → **Run workflow**
2. After apply, note the 4 Route 53 nameservers from the output
3. Add NS records in GoDaddy (see instructions below)
4. Verify delegation before proceeding to Layer 02

## GoDaddy NS delegation (manual step)

1. Log in to GoDaddy → DNS → `aneesahamed.co.uk`
2. Add 4 x NS records:
   - **Host:** `aws`
   - **Value:** each of the 4 nameservers from Terraform output
   - **TTL:** 600
3. Verify delegation has propagated:
   ```bash
   dig NS aws.aneesahamed.co.uk
   dig SOA aws.aneesahamed.co.uk
   ```
   You should see the Route 53 nameservers in the response.
4. Only proceed to Layer 02 once delegation is confirmed.

## Why this is a separate layer

DNS hosted zones have a different lifecycle to application infrastructure.
They are created once and rarely changed. Keeping them in a separate state
prevents accidental deletion when platform resources are updated.
