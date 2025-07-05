#!/bin/bash

echo "🚀 Setting up Demos SDK Toolkit - Desktop UI"

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed. Please install it from https://rustup.rs/"
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install it from https://bun.sh/"
    exit 1
fi

# Install Tauri CLI
echo "📦 Installing Tauri CLI..."
cargo install tauri-cli

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
bun install

# Create placeholder icons (you should replace these with actual icons)
echo "🎨 Creating placeholder icons..."
mkdir -p src-tauri/icons
echo "Replace these with actual icons" > src-tauri/icons/32x32.png
echo "Replace these with actual icons" > src-tauri/icons/128x128.png
echo "Replace these with actual icons" > src-tauri/icons/128x128@2x.png
echo "Replace these with actual icons" > src-tauri/icons/icon.icns

echo "✅ Setup complete!"
echo ""
echo "To run in development mode:"
echo "  bun run tauri dev"
echo ""
echo "To build for production:"
echo "  bun run tauri build"
echo ""
echo "Note: Make sure the parent directory contains the CLI tools (demostools_file.ts)"