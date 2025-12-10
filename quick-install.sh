#!/bin/bash

# Demos SDK Toolkit - Quick Install
# Downloads the installer and runs it interactively
#
# Usage: curl -fsSL https://your-domain.com/install.sh -o install.sh && bash install.sh
# Or:    bash <(curl -fsSL https://your-domain.com/install.sh)

INSTALLER_URL="https://raw.githubusercontent.com/kynesyslabs/demostoolkit/main/install-demos-toolkit.sh"
TEMP_INSTALLER="/tmp/demos-toolkit-installer-$$.sh"

echo "🚀 Demos SDK Toolkit - Quick Install"
echo "====================================="
echo ""

# Download the full installer
echo "Downloading installer..."
if ! curl -fsSL "$INSTALLER_URL" -o "$TEMP_INSTALLER"; then
    echo "❌ Failed to download installer"
    exit 1
fi

chmod +x "$TEMP_INSTALLER"

# Run the installer interactively (with stdin from terminal)
# This ensures read commands work properly
exec bash "$TEMP_INSTALLER" </dev/tty

# Cleanup (won't reach here due to exec, but good practice)
rm -f "$TEMP_INSTALLER"