#!/usr/bin/env bash
# create-mcp-tools.sh: exposes the npm dependency workflows as MCP tools on an Orkes Conductor
# cluster, through the Orkes API. It creates the input schemas in schemas/, the gateway service
# in service.json, and one route (one MCP tool) for each file in routes/.
#
# Before running (see mcp/README.md):
#   1. Save the workflows in workflows/ (see the main README).
#   2. In the Conductor UI, create the authentication setting that service.json names
#      (npm-dependency-mcp-auth). This step stays in the UI, because it's where your API key is made.
#   3. Create an application access key: Access Control → Applications → an application → access key.
#
# Run:
#   CONDUCTOR_KEY_ID=<key id> CONDUCTOR_KEY_SECRET=<key secret> ./mcp/create-mcp-tools.sh
#   (or set CONDUCTOR_TOKEN instead, if you already have a token)
#
# CONDUCTOR_API defaults to Developer Edition, https://developer.orkescloud.com/api.
# No key, secret or token is written to the repo or printed.

set -euo pipefail

API="${CONDUCTOR_API:-https://developer.orkescloud.com/api}"
DIR="$(cd "$(dirname "$0")" && pwd)"

# Temporary files, readable only by you and removed on exit:
# the response of the last call, the auth header, and the schema list.
umask 077
RESPONSE="$(mktemp)"
HEADERS="$(mktemp)"
SCHEMAS="$(mktemp)"
trap 'rm -f "$RESPONSE" "$HEADERS" "$SCHEMAS"' EXIT

fail() {
  echo "Error: $1" >&2
  exit 1
}

# ---- 1. A token for the Orkes API ----

if [ -n "${CONDUCTOR_TOKEN:-}" ]; then
  TOKEN="$CONDUCTOR_TOKEN"
else
  if [ -z "${CONDUCTOR_KEY_ID:-}" ] || [ -z "${CONDUCTOR_KEY_SECRET:-}" ]; then
    fail "set CONDUCTOR_KEY_ID and CONDUCTOR_KEY_SECRET (an application access key), or CONDUCTOR_TOKEN."
  fi
  echo "Getting a token from $API/token"
  # The key goes in through stdin, so it doesn't appear in the process list.
  status=$(printf '{"keyId": "%s", "keySecret": "%s"}' "$CONDUCTOR_KEY_ID" "$CONDUCTOR_KEY_SECRET" |
    curl -sS -o "$RESPONSE" -w '%{http_code}' -X POST "$API/token" \
      -H 'Content-Type: application/json' --data-binary @-)
  # Don't print the response: it may contain a token.
  [ "$status" = "200" ] || fail "getting a token failed (HTTP $status). Check the key ID and secret."
  TOKEN=$(sed -n 's/.*"token" *: *"\([^"]*\)".*/\1/p' "$RESPONSE")
  [ -n "$TOKEN" ] || fail "the token response had no token."
fi

# The token goes in a header file, so it doesn't appear in the process list either.
printf 'X-Authorization: %s\n' "$TOKEN" > "$HEADERS"

# Sends a JSON file to the Orkes API, and prints the HTTP status code.
# The response body is saved in $RESPONSE.
send() {
  local method="$1" path="$2" file="$3"
  curl -sS -o "$RESPONSE" -w '%{http_code}' -X "$method" "$API$path" \
    -H @"$HEADERS" -H 'Content-Type: application/json' --data-binary @"$file"
}

# True for any 2xx status code.
succeeded() {
  case "$1" in
    2??) return 0 ;;
    *) return 1 ;;
  esac
}

# ---- 2. The input schemas ----

# The API takes a list of schemas, so wrap the files in [ ... ].
{
  echo "["
  first=true
  for file in "$DIR"/schemas/*.json; do
    if [ "$first" = true ]; then
      first=false
    else
      echo ","
    fi
    cat "$file"
  done
  echo "]"
} > "$SCHEMAS"

echo "Creating the input schemas: $(cd "$DIR/schemas" && ls *.json | tr '\n' ' ')"
status=$(send POST /schema "$SCHEMAS")
if succeeded "$status"; then
  echo "  done"
else
  # Not fatal: the schemas may already exist, for example on a second run.
  echo "  HTTP $status, continuing (the schemas may already exist): $(cat "$RESPONSE")"
fi

# ---- 3. The gateway service ----

# e.g. "npm-dependency-tools"
SERVICE_ID=$(sed -n 's/^ *"id" *: *"\([^"]*\)".*/\1/p' "$DIR/service.json" | head -n 1)
[ -n "$SERVICE_ID" ] || fail "service.json has no \"id\"."

echo "Creating the gateway service $SERVICE_ID"
status=$(send POST /gateway/config/services "$DIR/service.json")
if ! succeeded "$status"; then
  fail "HTTP $status: $(cat "$RESPONSE")
A service with this ID may already exist. Delete it first, or change \"id\" and \"path\" in service.json."
fi
echo "  done"

# ---- 4. The routes, one MCP tool each ----

for file in "$DIR"/routes/*.json; do
  echo "Creating the route in $(basename "$file")"
  status=$(send POST "/gateway/config/services/$SERVICE_ID/routes" "$file")
  succeeded "$status" || fail "HTTP $status: $(cat "$RESPONSE")"
  echo "  done"
done

echo
echo "Finished. Next:"
echo "  1. In the Conductor UI, open APIs → Services → $SERVICE_ID and test each route with its play icon."
echo "  2. Copy the MCP Tool Remote Endpoint (under Configuration) into your MCP client, with the header"
echo "     \"Authorization: Bearer <the API key from your authentication setting>\"."
