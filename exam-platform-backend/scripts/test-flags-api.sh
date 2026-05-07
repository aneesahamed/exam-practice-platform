#!/usr/bin/env bash
# Simple examples for testing the Flags API. Replace <AUTH_TOKEN> with a valid Cognito JWT.

API_BASE="https://$(aws cloudformation describe-stacks --stack-name exam-platform-backend --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)"
# If AWS CLI lookup above fails, set API_BASE manually, e.g.:
# API_BASE="https://abcd.execute-api.us-east-1.amazonaws.com/dev"

AUTH="Authorization: Bearer <AUTH_TOKEN>"

echo "PUT a flag (WRONG_ANSWER)"
curl -s -X PUT "$API_BASE/flags/q123" -H "Content-Type: application/json" -H "$AUTH" -d '{"flag_type":"WRONG_ANSWER","suggested_correct_answers":["B","D"],"note":"Possible error in explanation"}' | jq

echo "GET flags"
curl -s -X GET "$API_BASE/flags" -H "$AUTH" | jq

echo "GET flags filtered by type"
curl -s -G "$API_BASE/flags" --data-urlencode "type=WRONG_ANSWER" -H "$AUTH" | jq

echo "GET flags summary"
curl -s -X GET "$API_BASE/flags/summary" -H "$AUTH" | jq

echo "DELETE flag"
curl -s -X DELETE "$API_BASE/flags/q123" -H "$AUTH" | jq
#!/bin/bash

# Flags API Testing Script
# Replace YOUR_JWT_TOKEN with actual Cognito JWT token
# Get token by signing in via Cognito and extracting from Authorization header

API_URL="https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev"
AUTH_TOKEN="YOUR_JWT_TOKEN"

echo "========================================"
echo "Flags API Testing Examples"
echo "========================================"
echo ""

echo "1. CREATE/UPDATE a REVIEW flag:"
curl -X PUT "${API_URL}/flags/question-123" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "flag_type": "REVIEW",
    "note": "Need to review this concept again"
  }'
echo -e "\n"

echo "2. CREATE a WRONG_ANSWER flag with suggested answers:"
curl -X PUT "${API_URL}/flags/question-456" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "flag_type": "WRONG_ANSWER",
    "note": "Answer explanation is incorrect",
    "suggested_correct_answers": ["B", "D"]
  }'
echo -e "\n"

echo "3. CREATE a BAD_QUESTION flag:"
curl -X PUT "${API_URL}/flags/question-789" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "flag_type": "BAD_QUESTION",
    "note": "Question wording is confusing"
  }'
echo -e "\n"

echo "4. CREATE a GOLDEN_NOTE flag:"
curl -X PUT "${API_URL}/flags/question-101" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "flag_type": "GOLDEN_NOTE",
    "note": "This is a key concept for the exam"
  }'
echo -e "\n"

echo "5. LIST all flags:"
curl -X GET "${API_URL}/flags" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
echo -e "\n"

echo "6. LIST only REVIEW flags:"
curl -X GET "${API_URL}/flags?type=REVIEW" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
echo -e "\n"

echo "7. LIST only WRONG_ANSWER flags:"
curl -X GET "${API_URL}/flags?type=WRONG_ANSWER" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
echo -e "\n"

echo "8. LIST flags with pagination (limit 10):"
curl -X GET "${API_URL}/flags?limit=10" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
echo -e "\n"

echo "9. GET flags summary (counts by type):"
curl -X GET "${API_URL}/flags/summary" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
echo -e "\n"

echo "10. DELETE a flag:"
curl -X DELETE "${API_URL}/flags/question-123" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
echo -e "\n"

echo "11. UPDATE an existing flag (change type):"
curl -X PUT "${API_URL}/flags/question-456" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "flag_type": "REVIEW",
    "note": "Actually this just needs review"
  }'
echo -e "\n"

echo "========================================"
echo "Error cases (should return 400):"
echo "========================================"
echo ""

echo "12. INVALID: WRONG_ANSWER without suggested_correct_answers:"
curl -X PUT "${API_URL}/flags/question-error1" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "flag_type": "WRONG_ANSWER",
    "note": "Missing required field"
  }'
echo -e "\n"

echo "13. INVALID: suggested_correct_answers on non-WRONG_ANSWER type:"
curl -X PUT "${API_URL}/flags/question-error2" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "flag_type": "REVIEW",
    "suggested_correct_answers": ["A"]
  }'
echo -e "\n"

echo "14. INVALID: Bad answer letters (F, G):"
curl -X PUT "${API_URL}/flags/question-error3" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "flag_type": "WRONG_ANSWER",
    "suggested_correct_answers": ["F", "G"]
  }'
echo -e "\n"

echo "15. INVALID: Note too long (>500 chars):"
curl -X PUT "${API_URL}/flags/question-error4" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"flag_type\": \"REVIEW\",
    \"note\": \"$(printf 'a%.0s' {1..501})\"
  }"
echo -e "\n"

echo "========================================"
echo "Done!"
echo "========================================"
