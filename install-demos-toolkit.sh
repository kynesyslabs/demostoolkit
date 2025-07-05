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

# Download and install UI binary
install_ui_binary() {
    log_info "Installing desktop UI..."
    
    case $PLATFORM in
        linux)
            case $UI_BINARY_TYPE in
                deb)
                    local deb_file="$INSTALL_DIR/ui-binaries/deb/demostools-ui.deb"
                    if [[ -f "$deb_file" ]]; then
                        sudo dpkg -i "$deb_file"
                        log_success "UI installed via DEB package"
                    else
                        install_appimage_fallback
                    fi
                    ;;
                appimage)
                    install_appimage_fallback
                    ;;
            esac
            ;;
        macos)
            local app_bundle="$INSTALL_DIR/ui-binaries/macos/Demos SDK Toolkit.app"
            if [[ -d "$app_bundle" ]]; then
                cp -r "$app_bundle" /Applications/
                log_success "UI installed to Applications"
            else
                log_warning "macOS app bundle not found"
            fi
            ;;
        windows)
            local msi_file=$(find "$INSTALL_DIR/ui-binaries/msi/" -name "*.msi" 2>/dev/null | head -1)
            if [[ -n "$msi_file" ]]; then
                log_info "Please run: $msi_file"
                log_info "Windows installer will open after this script completes"
            else
                log_warning "Windows installer not found"
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
    case $PLATFORM in
        linux)
            echo "  UI:  demostools-ui (or search for 'Demos' in applications)"
            ;;
        macos)
            echo "  UI:  Open 'Demos SDK Toolkit' from Applications"
            ;;
        windows)
            echo "  UI:  Install and run the MSI, then search for 'Demos SDK Toolkit'"
            ;;
    esac
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
    
    # Installation steps
    install_dependencies
    install_bun
    setup_directories
    download_cli_tools
    install_cli_dependencies
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