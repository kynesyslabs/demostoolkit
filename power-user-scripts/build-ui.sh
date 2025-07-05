#!/bin/bash

echo "🔨 Building Demos SDK Toolkit UI for production"

# Check if the UI app directory exists
if [ ! -d "ui-app" ]; then
    echo "❌ UI app directory not found. Please run setup first."
    exit 1
fi

# Change to UI app directory
cd ui-app

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Build the application
echo "🔨 Building desktop application..."
bun run tauri build

echo "✅ Build complete!"
echo "📁 Executables can be found in: ui-app/src-tauri/target/release/bundle/"

# List the generated files with platform info
echo "📋 Generated files:"
if [ -d "src-tauri/target/release/bundle/" ]; then
    find src-tauri/target/release/bundle/ -type f -exec ls -lah {} \; 2>/dev/null | while read file; do
        echo "  $file"
    done
    
    echo ""
    echo "🔍 Platform-specific locations:"
    
    # Linux AppImage
    if [ -d "src-tauri/target/release/bundle/appimage/" ]; then
        echo "  🐧 Linux AppImage: src-tauri/target/release/bundle/appimage/"
        ls -la src-tauri/target/release/bundle/appimage/*.AppImage 2>/dev/null
    fi
    
    # Linux DEB
    if [ -d "src-tauri/target/release/bundle/deb/" ]; then
        echo "  📦 Linux DEB: src-tauri/target/release/bundle/deb/"
        ls -la src-tauri/target/release/bundle/deb/*.deb 2>/dev/null
    fi
    
    # macOS app
    if [ -d "src-tauri/target/release/bundle/macos/" ]; then
        echo "  🍎 macOS App: src-tauri/target/release/bundle/macos/"
        ls -la src-tauri/target/release/bundle/macos/*.app 2>/dev/null
    fi
    
    # Windows MSI
    if [ -d "src-tauri/target/release/bundle/msi/" ]; then
        echo "  🪟 Windows MSI: src-tauri/target/release/bundle/msi/"
        ls -la src-tauri/target/release/bundle/msi/*.msi 2>/dev/null
    fi
    
    # Raw executable
    if [ -f "src-tauri/target/release/demostools-ui" ]; then
        echo "  ⚡ Raw Binary: src-tauri/target/release/demostools-ui"
        ls -la src-tauri/target/release/demostools-ui
    fi
    
else
    echo "❌ Build directory not found. Build may have failed."
    exit 1
fi

echo ""
echo "🚀 Distribution Options:"
echo "  • AppImage: Self-contained, runs on most Linux distributions"
echo "  • DEB: For Debian/Ubuntu systems (can install with: sudo dpkg -i *.deb)"
echo "  • Raw Binary: Direct executable (requires CLI tools in same directory)"
echo ""
echo "📖 To distribute:"
echo "  1. Share the AppImage for easy Linux distribution"
echo "  2. Keep CLI tools (demostools_file.ts, etc.) accessible to the UI"
echo "  3. Test on target systems before distributing"