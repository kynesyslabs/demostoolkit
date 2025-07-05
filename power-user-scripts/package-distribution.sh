#!/bin/bash

echo "📦 Creating Demos SDK Toolkit Distribution Package"

# Get version from package.json
VERSION=$(grep '"version"' ui-app/package.json | cut -d '"' -f 4)
DIST_NAME="demos-sdk-toolkit-v${VERSION}"
DIST_DIR="dist/${DIST_NAME}"

echo "🏷️  Version: ${VERSION}"

# Clean and create distribution directory
echo "🧹 Cleaning previous builds..."
rm -rf dist/
mkdir -p "${DIST_DIR}"

# Build the UI application
echo "🔨 Building UI application..."
./build-ui.sh

# Check if build was successful
if [ ! -d "ui-app/src-tauri/target/release/bundle/" ]; then
    echo "❌ UI build failed. Cannot create distribution."
    exit 1
fi

# Copy CLI tools
echo "📋 Copying CLI tools..."
cp demostools_file.ts "${DIST_DIR}/"
cp -r tools/ "${DIST_DIR}/"
cp package.json "${DIST_DIR}/"
cp bun.lock "${DIST_DIR}/" 2>/dev/null || echo "No bun.lock found, skipping"

# Copy documentation
echo "📚 Copying documentation..."
cp README.md "${DIST_DIR}/"
cp DEVELOPER_GUIDE.md "${DIST_DIR}/"
cp UI_GUIDE.md "${DIST_DIR}/"
cp LICENSE.md "${DIST_DIR}/" 2>/dev/null || echo "No LICENSE.md found, skipping"

# Copy UI binaries
echo "🖥️  Copying UI binaries..."
mkdir -p "${DIST_DIR}/ui-binaries"

# Copy all available binaries
cp -r ui-app/src-tauri/target/release/bundle/* "${DIST_DIR}/ui-binaries/" 2>/dev/null || echo "No bundle directory found"

# Copy raw binary if it exists
if [ -f "ui-app/src-tauri/target/release/demostools-ui" ]; then
    cp ui-app/src-tauri/target/release/demostools-ui "${DIST_DIR}/ui-binaries/"
fi

# Create installation scripts
echo "📜 Creating installation scripts..."

# Linux install script
cat > "${DIST_DIR}/install-linux.sh" << 'EOF'
#!/bin/bash

echo "🐧 Installing Demos SDK Toolkit on Linux"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Install CLI dependencies
echo "📦 Installing CLI dependencies..."
bun install

# Make CLI executable
chmod +x demostools_file.ts

# Install UI binary
if [ -f "ui-binaries/appimage/demostools-ui.AppImage" ]; then
    echo "🖥️  Installing UI (AppImage)..."
    chmod +x ui-binaries/appimage/*.AppImage
    echo "✅ UI installed! Run ./ui-binaries/appimage/*.AppImage"
elif [ -f "ui-binaries/deb/"*.deb ]; then
    echo "🖥️  Installing UI (DEB package)..."
    sudo dpkg -i ui-binaries/deb/*.deb
    echo "✅ UI installed! Run 'demostools-ui' from anywhere"
fi

echo "✅ Installation complete!"
echo ""
echo "🚀 Usage:"
echo "  CLI: ./demostools_file.ts help"
echo "  UI:  Run the installed binary or AppImage"
EOF

# macOS install script
cat > "${DIST_DIR}/install-macos.sh" << 'EOF'
#!/bin/bash

echo "🍎 Installing Demos SDK Toolkit on macOS"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Install CLI dependencies
echo "📦 Installing CLI dependencies..."
bun install

# Make CLI executable
chmod +x demostools_file.ts

# Install UI app
if [ -d "ui-binaries/macos/"*.app ]; then
    echo "🖥️  Installing UI app..."
    cp -r ui-binaries/macos/*.app /Applications/
    echo "✅ UI installed to Applications folder!"
fi

echo "✅ Installation complete!"
echo ""
echo "🚀 Usage:"
echo "  CLI: ./demostools_file.ts help"
echo "  UI:  Open from Applications folder"
EOF

# Windows install script
cat > "${DIST_DIR}/install-windows.bat" << 'EOF'
@echo off
echo 🪟 Installing Demos SDK Toolkit on Windows

echo 📦 Please ensure you have Bun installed from https://bun.sh/
echo 📦 Installing CLI dependencies...
bun install

echo 🖥️  Installing UI...
if exist "ui-binaries\msi\*.msi" (
    echo Please run the MSI installer in ui-binaries\msi\
) else (
    echo No Windows installer found
)

echo ✅ Installation complete!
echo.
echo 🚀 Usage:
echo   CLI: demostools_file.ts help
echo   UI:  Run the installed application
pause
EOF

# Create README for distribution
cat > "${DIST_DIR}/DISTRIBUTION_README.md" << EOF
# Demos SDK Toolkit v${VERSION} - Distribution Package

## 📦 What's Included

- **CLI Tools**: Complete command-line toolkit (\`demostools_file.ts\`)
- **Desktop UI**: Native desktop application binaries
- **Documentation**: Complete guides and documentation
- **Installation Scripts**: Platform-specific installers

## 🚀 Quick Start

### Linux
\`\`\`bash
chmod +x install-linux.sh
./install-linux.sh
\`\`\`

### macOS
\`\`\`bash
chmod +x install-macos.sh
./install-macos.sh
\`\`\`

### Windows
\`\`\`cmd
install-windows.bat
\`\`\`

## 📁 Directory Structure

- \`demostools_file.ts\` - Main CLI entry point
- \`tools/\` - CLI tool modules and utilities
- \`ui-binaries/\` - Desktop application binaries
- \`install-*.sh\` - Platform installation scripts
- \`*.md\` - Documentation files

## 🖥️  UI Binaries

- **AppImage** (Linux): Self-contained, runs on most distributions
- **DEB** (Linux): For Debian/Ubuntu systems
- **App** (macOS): Native macOS application
- **MSI** (Windows): Windows installer package

## 📖 Documentation

- \`README.md\` - User guide for CLI tools
- \`UI_GUIDE.md\` - Desktop UI usage guide
- \`DEVELOPER_GUIDE.md\` - Development documentation

## 🔧 Manual Usage

### CLI Only
\`\`\`bash
# Install dependencies
bun install

# Run CLI
./demostools_file.ts help
\`\`\`

### UI Only
Navigate to \`ui-binaries/\` and run the appropriate binary for your platform.

---

Built with ❤️ by the Kynesys Labs team
EOF

# Make install scripts executable
chmod +x "${DIST_DIR}/install-linux.sh"
chmod +x "${DIST_DIR}/install-macos.sh"

# Create archive
echo "🗜️  Creating distribution archive..."
cd dist/
tar -czf "${DIST_NAME}.tar.gz" "${DIST_NAME}/"
zip -r "${DIST_NAME}.zip" "${DIST_NAME}/" > /dev/null 2>&1

echo ""
echo "✅ Distribution package created successfully!"
echo ""
echo "📦 Archives created:"
echo "  • dist/${DIST_NAME}.tar.gz (Linux/macOS)"
echo "  • dist/${DIST_NAME}.zip (Windows/Universal)"
echo ""
echo "📁 Distribution directory:"
echo "  • dist/${DIST_NAME}/"
echo ""
echo "🚀 Ready for distribution!"
echo "  1. Test the installation scripts on target platforms"
echo "  2. Share the appropriate archive with users"
echo "  3. Users can run the install script for their platform"