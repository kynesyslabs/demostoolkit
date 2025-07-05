#!/bin/bash

# Demos SDK Toolkit - Universal Installer
# One command installs everything: CLI tools + Desktop UI

set -e  # Exit on any error

echo "🚀 Demos SDK Toolkit - Universal Installer"
echo "=============================================="

# Configuration
REPO_URL="https://github.com/kynesyslabs/demostoolkit"
RELEASE_URL="https://api.github.com/repos/kynesyslabs/demostoolkit/releases/latest"
INSTALL_DIR="$HOME/.demos-toolkit"
BIN_DIR="$HOME/.local/bin"

# Installation options (will be set by user choice)
INSTALL_UI="false"
BUILD_UI="false"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Utility functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Platform detection
detect_platform() {
    local os=$(uname -s)
    local arch=$(uname -m)
    
    case $os in
        Linux*)
            if command -v apt-get >/dev/null 2>&1; then
                PLATFORM="linux"
                PACKAGE_MANAGER="apt"
                UI_BINARY_TYPE="deb"
            elif command -v yum >/dev/null 2>&1; then
                PLATFORM="linux"
                PACKAGE_MANAGER="yum"
                UI_BINARY_TYPE="appimage"
            else
                PLATFORM="linux"
                PACKAGE_MANAGER="generic"
                UI_BINARY_TYPE="appimage"
            fi
            ;;
        Darwin*)
            PLATFORM="macos"
            PACKAGE_MANAGER="brew"
            UI_BINARY_TYPE="app"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            PLATFORM="windows"
            PACKAGE_MANAGER="chocolatey"
            UI_BINARY_TYPE="msi"
            ;;
        *)
            log_error "Unsupported operating system: $os"
            exit 1
            ;;
    esac
    
    log_info "Detected platform: $PLATFORM ($arch)"
}

# Check if running as root (not recommended)
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root is not recommended"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Ask user about installation preferences
ask_installation_options() {
    echo ""
    log_info "Installation Options"
    echo "===================="
    echo ""
    echo "What would you like to install?"
    echo ""
    echo "1) CLI tools only (fast, ~30 seconds)"
    echo "   • Command-line interface"
    echo "   • All toolkit functionality"
    echo "   • Lightweight installation"
    echo ""
    echo "2) CLI tools + Desktop UI (slower, ~3-5 minutes)"
    echo "   • Everything from option 1"
    echo "   • Native desktop application"
    echo "   • Requires Rust and build dependencies"
    echo ""
    
    while true; do
        read -p "Choose option (1/2): " choice
        case $choice in
            1)
                INSTALL_UI="false"
                BUILD_UI="false"
                log_info "Selected: CLI tools only"
                break
                ;;
            2)
                INSTALL_UI="true"
                BUILD_UI="true"
                log_info "Selected: CLI tools + Desktop UI"
                echo ""
                log_warning "This will install additional dependencies (Rust, build tools)"
                read -p "Continue with UI build? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    break
                else
                    log_info "Falling back to CLI-only installation"
                    INSTALL_UI="false"
                    BUILD_UI="false"
                    break
                fi
                ;;
            *)
                echo "Please enter 1 or 2"
                ;;
        esac
    done
    echo ""
}

# Install system dependencies
install_dependencies() {
    log_info "Installing system dependencies..."
    
    case $PLATFORM in
        linux)
            case $PACKAGE_MANAGER in
                apt)
                    sudo apt update
                    sudo apt install -y curl wget unzip tar git
                    ;;
                yum)
                    sudo yum install -y curl wget unzip tar git
                    ;;
                generic)
                    log_warning "Generic Linux detected. Please ensure curl, wget, unzip, tar, and git are installed."
                    ;;
            esac
            ;;
        macos)
            if ! command -v brew >/dev/null 2>&1; then
                log_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install curl wget
            ;;
        windows)
            log_info "Please ensure you have curl and git available"
            ;;
    esac
}

# Install Bun runtime
install_bun() {
    if command -v bun >/dev/null 2>&1; then
        log_success "Bun already installed ($(bun --version))"
        return 0
    fi
    
    log_info "Installing Bun runtime..."
    
    case $PLATFORM in
        linux|macos)
            curl -fsSL https://bun.sh/install | bash
            # Add to PATH for current session
            export PATH="$HOME/.bun/bin:$PATH"
            ;;
        windows)
            log_info "Please install Bun from https://bun.sh/"
            read -p "Press Enter after installing Bun..."
            ;;
    esac
    
    if command -v bun >/dev/null 2>&1; then
        log_success "Bun installed successfully"
    else
        log_error "Failed to install Bun"
        exit 1
    fi
}

# Install Rust (needed for UI building)
install_rust() {
    if [[ "$BUILD_UI" != "true" ]]; then
        return 0
    fi
    
    if command -v cargo >/dev/null 2>&1; then
        log_success "Rust already installed ($(rustc --version))"
        return 0
    fi
    
    log_info "Installing Rust (required for UI building)..."
    
    case $PLATFORM in
        linux|macos)
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
            # Add to PATH for current session
            export PATH="$HOME/.cargo/bin:$PATH"
            ;;
        windows)
            log_info "Please install Rust from https://rustup.rs/"
            read -p "Press Enter after installing Rust..."
            ;;
    esac
    
    if command -v cargo >/dev/null 2>&1; then
        log_success "Rust installed successfully"
    else
        log_error "Failed to install Rust"
        exit 1
    fi
}

# Install additional UI build dependencies
install_ui_dependencies() {
    if [[ "$BUILD_UI" != "true" ]]; then
        return 0
    fi
    
    log_info "Installing UI build dependencies..."
    
    case $PLATFORM in
        linux)
            case $PACKAGE_MANAGER in
                apt)
                    sudo apt install -y libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
                    ;;
                yum)
                    sudo yum groupinstall -y "Development Tools"
                    sudo yum install -y webkit2gtk3-devel openssl-devel curl wget gtk3-devel libappindicator-gtk3-devel librsvg2-devel
                    ;;
                generic)
                    log_warning "Please install webkit2gtk, build-essential, and development tools for your distribution"
                    ;;
            esac
            ;;
        macos)
            # macOS usually has everything needed, just ensure Xcode tools
            if ! xcode-select -p >/dev/null 2>&1; then
                log_info "Installing Xcode command line tools..."
                xcode-select --install
                read -p "Press Enter after Xcode tools installation completes..."
            fi
            ;;
        windows)
            log_info "Please ensure Visual Studio Build Tools are installed"
            ;;
    esac
}

# Create installation directory
setup_directories() {
    log_info "Setting up directories..."
    
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$BIN_DIR"
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
        case $PLATFORM in
            linux|macos)
                echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$HOME/.bashrc"
                echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$HOME/.zshrc" 2>/dev/null || true
                ;;
        esac
        log_info "Added $BIN_DIR to PATH (restart shell or source ~/.bashrc)"
    fi
}

# Download CLI tools
download_cli_tools() {
    log_info "Downloading CLI tools..."
    
    # Option 1: If you have GitHub releases
    if curl -s "$RELEASE_URL" >/dev/null 2>&1; then
        local download_url=$(curl -s "$RELEASE_URL" | grep "browser_download_url.*tar.gz" | cut -d '"' -f 4 | head -1)
        if [[ -n "$download_url" ]]; then
            wget -O "$INSTALL_DIR/demos-toolkit.tar.gz" "$download_url"
            tar -xzf "$INSTALL_DIR/demos-toolkit.tar.gz" -C "$INSTALL_DIR" --strip-components=1
            rm "$INSTALL_DIR/demos-toolkit.tar.gz"
            log_success "Downloaded from release"
            return 0
        fi
    fi
    
    # Option 2: Clone repository (fallback)
    log_info "Cloning repository..."
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        cd "$INSTALL_DIR"
        git pull
    else
        git clone "$REPO_URL" "$INSTALL_DIR"
    fi
    
    log_success "CLI tools downloaded"
}

# Install CLI dependencies
install_cli_dependencies() {
    log_info "Installing CLI dependencies..."
    
    cd "$INSTALL_DIR"
    bun install
    
    # Make CLI executable
    chmod +x demostools_file.ts
    
    # Create symlink in bin directory
    ln -sf "$INSTALL_DIR/demostools_file.ts" "$BIN_DIR/demostools"
    
    log_success "CLI tools installed"
}

# Build UI application from source
build_ui_application() {
    if [[ "$BUILD_UI" != "true" ]]; then
        return 0
    fi
    
    log_info "Building desktop UI application (this may take 3-5 minutes)..."
    
    cd "$INSTALL_DIR"
    
    # Install UI dependencies
    cd ui-app
    bun install
    
    # Build the UI
    log_info "Compiling UI application with Tauri..."
    bun run tauri build
    
    if [[ $? -eq 0 ]]; then
        log_success "UI application built successfully"
    else
        log_error "UI build failed"
        return 1
    fi
    
    cd "$INSTALL_DIR"
}

# Install UI binary (either from build or pre-built)
install_ui_binary() {
    if [[ "$INSTALL_UI" != "true" ]]; then
        return 0
    fi
    
    log_info "Installing desktop UI..."
    
    if [[ "$BUILD_UI" == "true" ]]; then
        # Install from fresh build
        install_ui_from_build
    else
        # Try to install from pre-built binaries
        install_ui_from_prebuilt
    fi
}

# Install UI from fresh build
install_ui_from_build() {
    local bundle_dir="$INSTALL_DIR/ui-app/src-tauri/target/release/bundle"
    
    case $PLATFORM in
        linux)
            # Try AppImage first
            local appimage_file=$(find "$bundle_dir/appimage/" -name "*.AppImage" 2>/dev/null | head -1)
            if [[ -n "$appimage_file" ]]; then
                chmod +x "$appimage_file"
                cp "$appimage_file" "$BIN_DIR/demostools-ui"
                log_success "UI installed as AppImage in $BIN_DIR"
                return 0
            fi
            
            # Try DEB package
            local deb_file=$(find "$bundle_dir/deb/" -name "*.deb" 2>/dev/null | head -1)
            if [[ -n "$deb_file" ]]; then
                sudo dpkg -i "$deb_file"
                log_success "UI installed via DEB package"
                return 0
            fi
            ;;
        macos)
            local app_bundle=$(find "$bundle_dir/macos/" -name "*.app" 2>/dev/null | head -1)
            if [[ -n "$app_bundle" ]]; then
                cp -r "$app_bundle" /Applications/
                log_success "UI installed to Applications"
                return 0
            fi
            ;;
        windows)
            local msi_file=$(find "$bundle_dir/msi/" -name "*.msi" 2>/dev/null | head -1)
            if [[ -n "$msi_file" ]]; then
                log_info "MSI installer created: $msi_file"
                log_info "Please run the installer manually"
                return 0
            fi
            ;;
    esac
    
    log_warning "Could not install UI binary automatically"
}

# Install UI from pre-built binaries (fallback)
install_ui_from_prebuilt() {
    case $PLATFORM in
        linux)
            local appimage_file=$(find "$INSTALL_DIR/ui-binaries/appimage/" -name "*.AppImage" 2>/dev/null | head -1)
            if [[ -n "$appimage_file" ]]; then
                chmod +x "$appimage_file"
                ln -sf "$appimage_file" "$BIN_DIR/demostools-ui"
                log_success "UI installed as AppImage"
            else
                log_warning "Pre-built UI not found. Use --build-ui option to build from source."
            fi
            ;;
        macos)
            local app_bundle="$INSTALL_DIR/ui-binaries/macos/Demos SDK Toolkit.app"
            if [[ -d "$app_bundle" ]]; then
                cp -r "$app_bundle" /Applications/
                log_success "UI installed to Applications"
            else
                log_warning "Pre-built macOS app not found"
            fi
            ;;
        windows)
            local msi_file=$(find "$INSTALL_DIR/ui-binaries/msi/" -name "*.msi" 2>/dev/null | head -1)
            if [[ -n "$msi_file" ]]; then
                log_info "Please run: $msi_file"
            else
                log_warning "Pre-built Windows installer not found"
            fi
            ;;
    esac
}

install_appimage_fallback() {
    local appimage_file=$(find "$INSTALL_DIR/ui-binaries/appimage/" -name "*.AppImage" 2>/dev/null | head -1)
    if [[ -n "$appimage_file" ]]; then
        chmod +x "$appimage_file"
        ln -sf "$appimage_file" "$BIN_DIR/demostools-ui"
        log_success "UI installed as AppImage"
    else
        log_warning "AppImage not found. UI installation skipped."
    fi
}

# Test installation
test_installation() {
    log_info "Testing installation..."
    
    # Test CLI
    if command -v demostools >/dev/null 2>&1 || [[ -x "$BIN_DIR/demostools" ]]; then
        log_success "CLI tools: OK"
    else
        log_warning "CLI tools: Not found in PATH"
    fi
    
    # Test UI (basic check)
    case $PLATFORM in
        linux)
            if command -v demostools-ui >/dev/null 2>&1 || dpkg -l | grep -q demostools; then
                log_success "Desktop UI: OK"
            else
                log_warning "Desktop UI: May need manual installation"
            fi
            ;;
        macos)
            if [[ -d "/Applications/Demos SDK Toolkit.app" ]]; then
                log_success "Desktop UI: OK"
            else
                log_warning "Desktop UI: Not found in Applications"
            fi
            ;;
        windows)
            log_info "Desktop UI: Run the MSI installer manually"
            ;;
    esac
}

# Show usage instructions
show_usage() {
    echo ""
    echo "🎉 Installation Complete!"
    echo "========================="
    echo ""
    echo "📋 What was installed:"
    echo "  • CLI Tools: $INSTALL_DIR"
    echo "  • Desktop UI: Platform-specific location"
    echo "  • Binary Links: $BIN_DIR"
    echo ""
    echo "🚀 Usage:"
    echo "  CLI: demostools help"
    echo "       demostools generate-wallet"
    echo "       demostools check-balance <address>"
    echo ""
    if [[ "$INSTALL_UI" == "true" ]]; then
        case $PLATFORM in
            linux)
                echo "  UI:  demostools-ui (or search for 'Demos' in applications)"
                ;;
            macos)
                echo "  UI:  Open 'Demos SDK Toolkit' from Applications"
                ;;
            windows)
                echo "  UI:  Search for 'Demos SDK Toolkit' in Start Menu"
                ;;
        esac
    else
        echo "  UI:  Not installed (CLI-only mode selected)"
        echo "       To add UI later, re-run installer and select option 2"
    fi
    echo ""
    echo "📖 Documentation:"
    echo "  • README: $INSTALL_DIR/README.md"
    echo "  • UI Guide: $INSTALL_DIR/UI_GUIDE.md"
    echo "  • Developer Guide: $INSTALL_DIR/DEVELOPER_GUIDE.md"
    echo ""
    echo "🔧 Configuration:"
    echo "  Run: demostools config init"
    echo ""
    echo "⚠️  If 'demostools' command not found:"
    echo "  1. Restart your terminal, or"
    echo "  2. Run: source ~/.bashrc"
    echo "  3. Or use full path: $BIN_DIR/demostools"
}

# Main installation flow
main() {
    echo ""
    
    # Pre-checks
    check_root
    detect_platform
    ask_installation_options
    
    # Basic installation steps
    install_dependencies
    install_bun
    
    # UI-specific dependencies (only if building UI)
    if [[ "$BUILD_UI" == "true" ]]; then
        install_rust
        install_ui_dependencies
    fi
    
    setup_directories
    download_cli_tools
    install_cli_dependencies
    
    # UI building and installation (only if requested)
    if [[ "$BUILD_UI" == "true" ]]; then
        build_ui_application
    fi
    
    install_ui_binary
    
    # Post-installation
    test_installation
    show_usage
    
    echo ""
    log_success "🚀 Ready to use Demos SDK Toolkit!"
}

# Handle interruption
trap 'echo ""; log_error "Installation interrupted"; exit 1' INT TERM

# Run main installation
main "$@"