#!/bin/bash

# Direct test of the external API to verify the fix is working
echo "🔍 Testing External API: http://147.93.28.195:5000"
echo "=================================="

echo "1. Health Check:"
curl -s "http://147.93.28.195:5000/api/health" | jq -r '.status + " - " + .message' 2>/dev/null || curl -s "http://147.93.28.195:5000/api/health"

echo -e "\n2. Tenders API (first 200 chars):"
RESPONSE=$(curl -s "http://147.93.28.195:5000/api/tenders")
echo "$RESPONSE" | head -c 200
echo "..."

echo -e "\n3. Response Analysis:"
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ Error Response - API still broken"
  echo "$RESPONSE" | grep -o '"error":"[^"]*"' || echo "Error details not found"
elif echo "$RESPONSE" | grep -q '^\[.*\]'; then
  echo "✅ Array Response - API Fixed!"
  COUNT=$(echo "$RESPONSE" | grep -o '"id"' | wc -l)
  echo "📊 Found $COUNT tenders"
else
  echo "⚠️  Unexpected response format"
fi

echo -e "\n4. Frontend Test:"
echo "Visit: http://147.93.28.195:5000/active-tenders"
echo "Expected: Page should load without JavaScript errors"