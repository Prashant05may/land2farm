#!/usr/bin/env bash

set -euo pipefail

"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/build/build_docker.sh" "${1:-up}"
