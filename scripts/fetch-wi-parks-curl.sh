#!/bin/bash
# Fetch Wisconsin dog parks from BringFido using curl
# This script attempts to fetch all pages and save them to a JSON file

STATE="wisconsin"
OUTPUT_DIR="$(dirname "$0")/data"
OUTPUT_FILE="$OUTPUT_DIR/bringfido-parks.json"
TEMP_DIR="$OUTPUT_DIR/temp"

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

# Clean up temp files on exit
trap "rm -rf $TEMP_DIR" EXIT

echo "=== Fetching Wisconsin Dog Parks from BringFido ==="
echo ""

START=0
PAGE=1
ALL_PARKS=""

while true; do
    echo "Fetching page $PAGE (starting at $START)..."
    
    URL="https://www.bringfido.com/attraction/?state=${STATE}&type=P&start=${START}&refresh=0&__amp_source_origin=https%3A%2F%2Fwww.bringfido.com"
    
    TEMP_FILE="$TEMP_DIR/page_${START}.json"
    
    # Fetch with curl using browser-like headers
    curl -s "$URL" \
        -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36' \
        -H 'Accept: application/json' \
        -H 'Accept-Language: en-US,en;q=0.9' \
        -H 'Referer: https://www.bringfido.com/attraction/' \
        -H 'Origin: https://www.bringfido.com' \
        --compressed \
        -o "$TEMP_FILE"
    
    # Check if the file was downloaded and contains valid JSON
    if [ ! -f "$TEMP_FILE" ] || [ ! -s "$TEMP_FILE" ]; then
        echo "  Error: Failed to download page $PAGE"
        break
    fi
    
    # Check if it's valid JSON and has results
    if ! jq -e '.results' "$TEMP_FILE" > /dev/null 2>&1; then
        echo "  Error: Invalid JSON or no results field"
        cat "$TEMP_FILE"
        break
    fi
    
    RESULT_COUNT=$(jq '.results | length' "$TEMP_FILE")
    echo "  -> Got $RESULT_COUNT parks"
    
    if [ "$RESULT_COUNT" -eq 0 ]; then
        break
    fi
    
    # Append results to our collection
    if [ -z "$ALL_PARKS" ]; then
        ALL_PARKS=$(jq '.results' "$TEMP_FILE")
    else
        NEW_PARKS=$(jq '.results' "$TEMP_FILE")
        ALL_PARKS=$(echo "$ALL_PARKS $NEW_PARKS" | jq -s 'add')
    fi
    
    # Check for next page
    NEXT_OFFSET=$(jq -r '.nextResultOffset // empty' "$TEMP_FILE")
    
    if [ -z "$NEXT_OFFSET" ] || [ "$RESULT_COUNT" -lt 20 ]; then
        echo "  No more pages"
        break
    fi
    
    START=$NEXT_OFFSET
    PAGE=$((PAGE + 1))
    
    # Be nice to the server
    sleep 1
done

# Save the combined results
if [ -n "$ALL_PARKS" ]; then
    TOTAL_COUNT=$(echo "$ALL_PARKS" | jq 'length')
    echo ""
    echo "=== Total parks fetched: $TOTAL_COUNT ==="
    echo "$ALL_PARKS" > "$OUTPUT_FILE"
    echo "Saved to: $OUTPUT_FILE"
    
    # Also run the processor
    echo ""
    echo "Running SQL generator..."
    node "$(dirname "$0")/process-bringfido-data.js"
else
    echo "No parks fetched!"
    exit 1
fi
