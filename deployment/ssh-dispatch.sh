#!/bin/bash
set -euo pipefail
if [[ ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  exec sudo -n /usr/local/sbin/coremintcrm-deploy "${BASH_REMATCH[1]}"
fi
echo 'This account accepts only CRM deployment commands.' >&2
exit 64
