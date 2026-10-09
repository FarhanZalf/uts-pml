#!/usr/bin/env bash

BASE_URL="${1:-http://localhost:8000/api}"
BASE_URL="${BASE_URL%/}"

echo "══════════════════════════════════════════════════════════════════════"
echo "  🔍 ERLES BAKERY ERP — API PARITY CHECK"
echo "  Target URL: ${BASE_URL}"
echo "══════════════════════════════════════════════════════════════════════"
echo ""

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

TEMP_BODY="/tmp/parity_resp_$$.json"
cleanup() {
  rm -f "$TEMP_BODY"
}
trap cleanup EXIT

pass() {
  local name="$1"
  local detail="$2"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo -e "  \033[0;32m[PASS]\033[0m ${name} — ${detail}"
}

fail() {
  local name="$1"
  local detail="$2"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo -e "  \033[0;31m[FAIL]\033[0m ${name} — ${detail}"
}

call_api() {
  local method="$1"
  local endpoint="$2"
  local data="$3"
  
  if [ -n "$data" ]; then
    HTTP_STATUS=$(curl -s -o "$TEMP_BODY" -w "%{http_code}" -X "$method" "${BASE_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d "$data")
  else
    HTTP_STATUS=$(curl -s -o "$TEMP_BODY" -w "%{http_code}" -X "$method" "${BASE_URL}${endpoint}" \
      -H "Accept: application/json")
  fi
  RESP_BODY=$(cat "$TEMP_BODY" 2>/dev/null || echo "")
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. Skenario: Health Check
# ─────────────────────────────────────────────────────────────────────────────
echo "Testing: 1. Health Check..."
call_api "GET" "/health"

if [ "$HTTP_STATUS" -eq 200 ] && [ "$(echo "$RESP_BODY" | jq -r '.status // empty')" = "ok" ]; then
  pass "1. Health Check" "HTTP 200, status=ok"
else
  fail "1. Health Check" "Expected HTTP 200 with status=ok, got HTTP ${HTTP_STATUS}: ${RESP_BODY}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 2. Skenario: Daftar Kategori
# ─────────────────────────────────────────────────────────────────────────────
echo "Testing: 2. Daftar Kategori..."
call_api "GET" "/categories"

CAT_SUCCESS=$(echo "$RESP_BODY" | jq -r '.success // false')
CAT_COUNT=$(echo "$RESP_BODY" | jq -r '.data | length // 0')
FIRST_CAT_SLUG=$(echo "$RESP_BODY" | jq -r '.data[0].slug // empty')

if [ "$HTTP_STATUS" -eq 200 ] && [ "$CAT_SUCCESS" = "true" ] && [ "$CAT_COUNT" -ge 1 ] && [ -n "$FIRST_CAT_SLUG" ]; then
  pass "2. Daftar Kategori" "HTTP 200, success=true, ${CAT_COUNT} kategori ditemukan"
else
  fail "2. Daftar Kategori" "Expected HTTP 200 & categories array, got HTTP ${HTTP_STATUS}: ${RESP_BODY}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3. Skenario: Daftar Produk
# ─────────────────────────────────────────────────────────────────────────────
echo "Testing: 3. Daftar Produk..."
call_api "GET" "/products?per_page=3"

PROD_SUCCESS=$(echo "$RESP_BODY" | jq -r '.success // false')
PROD_COUNT=$(echo "$RESP_BODY" | jq -r '.data | length // 0')
PROD_TOTAL=$(echo "$RESP_BODY" | jq -r '.meta.total // 0')
SAMPLE_PROD_ID=$(echo "$RESP_BODY" | jq -r '.data[0].id // empty')
SAMPLE_PROD_SLUG=$(echo "$RESP_BODY" | jq -r '.data[0].slug // empty')

if [ "$HTTP_STATUS" -eq 200 ] && [ "$PROD_SUCCESS" = "true" ] && [ "$PROD_COUNT" -ge 1 ] && [ -n "$SAMPLE_PROD_ID" ]; then
  pass "3. Daftar Produk" "HTTP 200, ${PROD_COUNT} produk per halaman, total=${PROD_TOTAL}"
else
  fail "3. Daftar Produk" "Expected HTTP 200 & products array, got HTTP ${HTTP_STATUS}: ${RESP_BODY}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. Skenario: Detail Produk
# ─────────────────────────────────────────────────────────────────────────────
echo "Testing: 4. Detail Produk..."
TARGET_PRODUCT="${SAMPLE_PROD_SLUG:-1}"
call_api "GET" "/products/${TARGET_PRODUCT}"

DETAIL_SUCCESS=$(echo "$RESP_BODY" | jq -r '.success // false')
DETAIL_ID=$(echo "$RESP_BODY" | jq -r '.data.id // empty')
DETAIL_NAME=$(echo "$RESP_BODY" | jq -r '.data.nama // empty')

if [ "$HTTP_STATUS" -eq 200 ] && [ "$DETAIL_SUCCESS" = "true" ] && [ -n "$DETAIL_ID" ] && [ -n "$DETAIL_NAME" ]; then
  pass "4. Detail Produk" "HTTP 200, ID=${DETAIL_ID}, Nama='${DETAIL_NAME}'"
else
  fail "4. Detail Produk" "Expected HTTP 200 & product detail, got HTTP ${HTTP_STATUS}: ${RESP_BODY}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5. Skenario: Buat Pesanan Valid (POST /orders)
# ─────────────────────────────────────────────────────────────────────────────
echo "Testing: 5. Buat Pesanan Valid..."
ORDER_PRODUCT_ID="${SAMPLE_PROD_ID:-1}"
ORDER_PAYLOAD=$(jq -n \
  --arg name "Parity Tester" \
  --arg phone "089988776655" \
  --arg addr "Jl. Pengujian Parity No. 1" \
  --arg date "2026-10-20" \
  --arg note "Uji otomatis parity check" \
  --argjson pid "$ORDER_PRODUCT_ID" \
  '{
    customer_name: $name,
    customer_phone: $phone,
    alamat: $addr,
    tanggal_ambil: $date,
    catatan: $note,
    items: [
      { product_id: $pid, qty: 2 }
    ]
  }')

call_api "POST" "/orders" "$ORDER_PAYLOAD"

ORDER_SUCCESS=$(echo "$RESP_BODY" | jq -r '.success // false')
ORDER_CODE=$(echo "$RESP_BODY" | jq -r '.data.kode_pesanan // empty')
ORDER_STATUS=$(echo "$RESP_BODY" | jq -r '.data.status // empty')
ORDER_TOTAL=$(echo "$RESP_BODY" | jq -r '.data.total_price // 0')

if [ "$HTTP_STATUS" -eq 201 ] && [ "$ORDER_SUCCESS" = "true" ] && [[ "$ORDER_CODE" =~ ^ORD- ]] && [ "$ORDER_STATUS" = "pending" ]; then
  pass "5. Buat Pesanan Valid" "HTTP 201, Kode=${ORDER_CODE}, Total=${ORDER_TOTAL}, Status=${ORDER_STATUS}"
else
  fail "5. Buat Pesanan Valid" "Expected HTTP 201 & created order, got HTTP ${HTTP_STATUS}: ${RESP_BODY}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 6. Skenario: Lacak Pesanan Valid (GET /orders/track/{code})
# ─────────────────────────────────────────────────────────────────────────────
echo "Testing: 6. Lacak Pesanan Valid..."
TRACK_TARGET="${ORDER_CODE:-ORD-NONE}"
call_api "GET" "/orders/track/${TRACK_TARGET}"

TRACK_SUCCESS=$(echo "$RESP_BODY" | jq -r '.success // false')
TRACK_CODE=$(echo "$RESP_BODY" | jq -r '.data.kode_pesanan // empty')
TRACK_CUSTOMER=$(echo "$RESP_BODY" | jq -r '.data.customer_name // empty')

if [ "$HTTP_STATUS" -eq 200 ] && [ "$TRACK_SUCCESS" = "true" ] && [ "$TRACK_CODE" = "$ORDER_CODE" ]; then
  pass "6. Lacak Pesanan Valid" "HTTP 200, Kode=${TRACK_CODE}, Customer='${TRACK_CUSTOMER}'"
else
  fail "6. Lacak Pesanan Valid" "Expected HTTP 200 & track data matching ${ORDER_CODE}, got HTTP ${HTTP_STATUS}: ${RESP_BODY}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 7. Skenario: Pesanan Tidak Valid (Qty 0 & Produk Tidak Ada -> 422)
# ─────────────────────────────────────────────────────────────────────────────
echo "Testing: 7. Pesanan Tidak Valid (Harus 422)..."
INVALID_PAYLOAD='{
  "customer_name": "Invalid Tester",
  "customer_phone": "089988776655",
  "items": [
    { "product_id": 999999, "qty": 0 }
  ]
}'

call_api "POST" "/orders" "$INVALID_PAYLOAD"

ERRORS_EXIST=$(echo "$RESP_BODY" | jq -r 'if .errors != null or .message != null then "true" else "false" end')

if [ "$HTTP_STATUS" -eq 422 ] && [ "$ERRORS_EXIST" = "true" ]; then
  pass "7. Pesanan Tidak Valid (422)" "HTTP 422 Unprocessable Entity, validasi error diterima"
else
  fail "7. Pesanan Tidak Valid (422)" "Expected HTTP 422 with validation errors, got HTTP ${HTTP_STATUS}: ${RESP_BODY}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 8. Skenario: Lacak Kode Tidak Ada (Harus 404)
# ─────────────────────────────────────────────────────────────────────────────
echo "Testing: 8. Lacak Kode Tidak Ada (Harus 404)..."
call_api "GET" "/orders/track/ORD-NONEXISTENT-9999"

NOT_FOUND_SUCCESS=$(echo "$RESP_BODY" | jq -r 'if .success == false then "false" else "true" end')

if [ "$HTTP_STATUS" -eq 404 ] && [ "$NOT_FOUND_SUCCESS" = "false" ]; then
  pass "8. Lacak Kode Tidak Ada (404)" "HTTP 404 Not Found, success=false"
else
  fail "8. Lacak Kode Tidak Ada (404)" "Expected HTTP 404 with success=false, got HTTP ${HTTP_STATUS}: ${RESP_BODY}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Ringkasan Hasil
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════════════════"
echo "  HASIL AKHIR: ${PASSED_TESTS}/${TOTAL_TESTS} Skenario LULUS (PASS)"
if [ "$FAILED_TESTS" -eq 0 ]; then
  echo -e "  \033[0;32m✓ SELURUH SKENARIO PARITY CHECK BERHASIL!\033[0m"
  echo "══════════════════════════════════════════════════════════════════════"
  exit 0
else
  echo -e "  \033[0;31m✗ TERDAPAT ${FAILED_TESTS} SKENARIO GAGAL!\033[0m"
  echo "══════════════════════════════════════════════════════════════════════"
  exit 1
fi
