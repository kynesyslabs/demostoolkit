#!/bin/bash

# Demos SDK Toolkit - Quick Install
# Usage: curl -fsSL https://your-domain.com/install | bash

INSTALLER_URL="https://raw.githubusercontent.com/kynesyslabs/demostoolkit/main/install-demos-toolkit.sh"

echo "🚀 Demos SDK Toolkit - Quick Install"
echo "====================================="

# Download and run the full installer
curl -fsSL "$INSTALLER_URL" | bash