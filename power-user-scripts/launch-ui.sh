#!/bin/bash

echo "🚀 Launching Demos SDK Toolkit UI"

# Check if the UI app directory exists
if [ ! -d "ui-app" ]; then
    echo "❌ UI app directory not found. Please run setup first."
    exit 1
fi

# Change to UI app directory
cd ui-app

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    bun install
fi

# Install Tauri CLI via npm if not available
if ! command -v tauri &> /dev/null; then
    echo "📦 Installing Tauri CLI..."
    bun add -d @tauri-apps/cli@latest
fi

# Launch in development mode using bunx
echo "🖥️ Starting desktop application..."
bunx tauri dev