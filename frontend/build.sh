#!/usr/bin/env bash
# Rebuilds the CRM frontend with Jalali dates. Run it from anywhere, and again after every CRM upgrade:
# bench build rebuilds the stock CRM frontend, this replaces it with the Jalali one.
# CRM_APP points at the CRM app folder when it is not next to crm_iran.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
crm="$(cd "${CRM_APP:-$here/../../crm}" && pwd)"

# The helper module lives inside the CRM source so that its imports (vue, dayjs) resolve there
mkdir -p "$crm/frontend/src/crm_iran_jalali"
cp "$here/overlay/jalali.js" "$crm/frontend/src/crm_iran_jalali/jalali.js"

cd "$crm/frontend"
CRM_FRONTEND="$crm/frontend" npx vite build --config "$here/vite.config.mjs" --base=/assets/crm/frontend/
cp ../crm/public/frontend/index.html ../crm/www/crm.html
echo "CRM frontend rebuilt with Jalali dates"
