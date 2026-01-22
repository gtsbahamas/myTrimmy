#!/bin/bash
# scripts/setup-remotion-lambda.sh
# Deploys Remotion Lambda infrastructure to AWS

set -e

echo "========================================"
echo "Remotion Lambda Setup for myTrimmy"
echo "========================================"

# Check AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo ""
  echo "ERROR: AWS credentials not found."
  echo ""
  echo "Please set environment variables:"
  echo "  export AWS_ACCESS_KEY_ID=your_access_key"
  echo "  export AWS_SECRET_ACCESS_KEY=your_secret_key"
  echo ""
  echo "Or configure AWS CLI:"
  echo "  aws configure"
  echo ""
  exit 1
fi

REGION=${REMOTION_AWS_REGION:-us-east-1}

echo ""
echo "Region: $REGION"
echo ""

# Step 1: Deploy Lambda function
echo "[1/2] Deploying Lambda function..."
FUNCTION_OUTPUT=$(npx remotion lambda functions deploy --region=$REGION 2>&1)
echo "$FUNCTION_OUTPUT"

# Extract function name from output
FUNCTION_NAME=$(echo "$FUNCTION_OUTPUT" | grep -oE 'remotion-render-[a-z0-9]+' | head -1)
if [ -z "$FUNCTION_NAME" ]; then
  echo "Warning: Could not extract function name. Check output above."
  echo "You may need to find the function name in AWS console."
fi

# Step 2: Deploy Remotion site
echo ""
echo "[2/2] Deploying Remotion site bundle..."
SITE_OUTPUT=$(npx remotion lambda sites create src/remotion/entry.tsx --site-name=mytrimmy-promo-videos --region=$REGION 2>&1)
echo "$SITE_OUTPUT"

# Extract serve URL from output
SERVE_URL=$(echo "$SITE_OUTPUT" | grep -oE 'https://[^\s]+' | head -1)
if [ -z "$SERVE_URL" ]; then
  echo "Warning: Could not extract serve URL. Check output above."
fi

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Add these environment variables to your deployment:"
echo ""
echo "REMOTION_AWS_REGION=$REGION"
if [ -n "$FUNCTION_NAME" ]; then
  echo "REMOTION_FUNCTION_NAME=$FUNCTION_NAME"
fi
if [ -n "$SERVE_URL" ]; then
  echo "REMOTION_SERVE_URL=$SERVE_URL"
fi
echo ""
echo "For Vercel:"
echo "  vercel env add REMOTION_AWS_REGION"
echo "  vercel env add REMOTION_FUNCTION_NAME"
echo "  vercel env add REMOTION_SERVE_URL"
echo "  vercel env add AWS_ACCESS_KEY_ID"
echo "  vercel env add AWS_SECRET_ACCESS_KEY"
echo ""
echo "For .env.production.local, add:"
echo "REMOTION_AWS_REGION=$REGION"
echo "REMOTION_FUNCTION_NAME=<function-name-from-above>"
echo "REMOTION_SERVE_URL=<serve-url-from-above>"
echo "AWS_ACCESS_KEY_ID=<your-aws-key>"
echo "AWS_SECRET_ACCESS_KEY=<your-aws-secret>"
