# Demos SDK Toolkit - Desktop UI

A desktop user interface for the Demos SDK Toolkit, built with Tauri 2.0 and TypeScript.

## Features

- 🖥️ Native desktop application (Linux, macOS, Windows)
- 🔧 Full access to all CLI tools through intuitive UI
- 🎨 Modern, responsive design
- 🔒 Secure execution of CLI commands
- 📦 Small executable size with Tauri
- 🌐 Support for all toolkit operations:
  - Configuration management
  - Key generation & recovery
  - Account & Identity management
  - Network operations
  - Cryptographic operations
  - Cross-chain interactions
  - Web2 integrations

## Architecture

The UI acts as a wrapper around the existing CLI tools:

1. **Frontend**: TypeScript + HTML/CSS for the user interface
2. **Backend**: Rust (Tauri 2.0) for native desktop integration
3. **CLI Bridge**: Executes the existing CLI tools via subprocess
4. **No Code Changes**: The original CLI tools remain untouched

## Prerequisites

- [Rust](https://rustup.rs/) (for Tauri)
- [Bun](https://bun.sh/) (for frontend dependencies)
- The original CLI tools in the parent directory
- **Linux**: webkit2gtk-4.1 (or 4.0 for older distros), GTK3, librsvg

## Quick Setup

```bash
cd ui-app
./setup.sh
```

This will install:
- Tauri CLI
- Frontend dependencies (via Bun)
- Check for required icons

## Manual Installation

```bash
# From the ui-app directory
cd ui-app

# Install dependencies
bun install

# Install Tauri CLI
cargo install tauri-cli

# Development run
bun run tauri dev

# Build for production
bun run tauri build
```

## Usage

1. Launch the application
2. Select a tool from the sidebar
3. Fill in the required parameters
4. Click "Execute" to run the command
5. View results in the output area

## UI Components

### Sidebar Navigation
- **Configuration**: Config management, key generation, wallet generation
- **Account & Identity**: Account info, identity management
- **Network**: Balance checks, transactions, network info
- **Cryptography**: Sign/verify messages, encrypt data, hash operations
- **Cross-chain**: Multichain operations, asset bridging
- **Web2**: Identity management, proxy services

### Main Content Area
- Dynamic forms based on selected tool
- Parameter validation and help text
- Real-time command execution
- Formatted output display

## Development

The UI is designed to be maintainable and extensible:

- Tool definitions in `src/main.ts`
- Form generation is automated
- CLI integration via Tauri commands
- Responsive CSS Grid layout

## Building Executables

```bash
# Build for current platform
bun run tauri build

# Executables will be in src-tauri/target/release/bundle/
```

## Security

- Sandboxed execution environment
- No direct filesystem access from frontend
- CLI commands executed via secure Tauri bridge
- All user inputs validated before execution