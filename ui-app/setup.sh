#!/bin/bash

echo "🚀 Setting up Demos SDK Toolkit - Desktop UI"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Detect platform and package manager
detect_platform() {
    local os=$(uname -s)

    case $os in
        Linux*)
            PLATFORM="linux"
            if command -v apt-get >/dev/null 2>&1; then
                PACKAGE_MANAGER="apt"
            elif command -v dnf >/dev/null 2>&1; then
                PACKAGE_MANAGER="dnf"
            elif command -v yum >/dev/null 2>&1; then
                PACKAGE_MANAGER="yum"
            elif command -v pacman >/dev/null 2>&1; then
                PACKAGE_MANAGER="pacman"
            else
                PACKAGE_MANAGER="unknown"
            fi
            ;;
        Darwin*)
            PLATFORM="macos"
            PACKAGE_MANAGER="brew"
            ;;
        *)
            PLATFORM="unknown"
            PACKAGE_MANAGER="unknown"
            ;;
    esac

    log_info "Detected: $PLATFORM ($PACKAGE_MANAGER)"
}

# Install system dependencies for Tauri
install_system_deps() {
    log_info "Checking system dependencies for Tauri 2.0..."

    case $PLATFORM in
        linux)
            case $PACKAGE_MANAGER in
                apt)
                    log_info "Installing APT dependencies..."
                    # Try webkit2gtk-4.1 first (newer), fallback to 4.0
                    if apt-cache show libwebkit2gtk-4.1-dev >/dev/null 2>&1; then
                        sudo apt update
                        sudo apt install -y libwebkit2gtk-4.1-dev build-essential libssl-dev \
                            libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
                    else
                        sudo apt update
                        sudo apt install -y libwebkit2gtk-4.0-dev build-essential libssl-dev \
                            libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
                    fi
                    ;;
                dnf)
                    log_info "Installing DNF dependencies (Fedora)..."
                    sudo dnf groupinstall -y "Development Tools"
                    sudo dnf install -y webkit2gtk4.1-devel openssl-devel gtk3-devel \
                        libappindicator-gtk3-devel librsvg2-devel pango-devel libsoup3-devel \
                        cairo-devel cairo-gobject-devel gdk-pixbuf2-devel atk-devel
                    ;;
                yum)
                    log_info "Installing YUM dependencies..."
                    sudo yum groupinstall -y "Development Tools"
                    sudo yum install -y webkit2gtk3-devel openssl-devel gtk3-devel \
                        libappindicator-gtk3-devel librsvg2-devel
                    ;;
                pacman)
                    log_info "Installing Pacman dependencies (Arch)..."
                    sudo pacman -Sy --noconfirm webkit2gtk-4.1 base-devel openssl gtk3 \
                        libappindicator-gtk3 librsvg
                    ;;
                *)
                    log_warning "Unknown package manager. Please install manually:"
                    echo "  - webkit2gtk 4.1 (or 4.0)"
                    echo "  - gtk3, pango, cairo, gdk-pixbuf2, atk (development packages)"
                    echo "  - librsvg, libsoup3, openssl (development packages)"
                    ;;
            esac
            ;;
        macos)
            if ! xcode-select -p >/dev/null 2>&1; then
                log_info "Installing Xcode command line tools..."
                xcode-select --install
                echo "Press Enter after Xcode tools installation completes..."
                read -r
            fi
            log_success "macOS dependencies OK (Xcode tools)"
            ;;
        *)
            log_warning "Unknown platform. Please install Tauri dependencies manually."
            ;;
    esac
}

# Check if Rust is installed
check_rust() {
    if ! command -v rustc &> /dev/null; then
        log_error "Rust is not installed."
        echo ""
        echo "Install Rust with:"
        echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        echo ""
        read -p "Install Rust now? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
            source "$HOME/.cargo/env"
        else
            exit 1
        fi
    else
        log_success "Rust installed ($(rustc --version | cut -d' ' -f2))"
    fi
}

# Check if Bun is installed
check_bun() {
    if ! command -v bun &> /dev/null; then
        log_error "Bun is not installed."
        echo ""
        echo "Install Bun with:"
        echo "  curl -fsSL https://bun.sh/install | bash"
        echo ""
        read -p "Install Bun now? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            curl -fsSL https://bun.sh/install | bash
            export PATH="$HOME/.bun/bin:$PATH"
        else
            exit 1
        fi
    else
        log_success "Bun installed ($(bun --version))"
    fi
}

# Main setup
main() {
    detect_platform

    echo ""
    log_info "Step 1/5: Checking Rust..."
    check_rust

    echo ""
    log_info "Step 2/5: Checking Bun..."
    check_bun

    echo ""
    log_info "Step 3/5: Installing system dependencies..."
    install_system_deps

    echo ""
    log_info "Step 4/5: Installing Tauri CLI..."
    cargo install tauri-cli
    log_success "Tauri CLI installed"

    echo ""
    log_info "Step 5/5: Installing frontend dependencies..."
    bun install
    log_success "Frontend dependencies installed"

    # Check for icons
    echo ""
    if [[ -d "src-tauri/icons" ]] && [[ -f "src-tauri/icons/icon.png" ]]; then
        log_success "Icons found"
    else
        log_warning "Icons not found. Please add icons to src-tauri/icons/"
        echo "   Required: 32x32.png, 128x128.png, 128x128@2x.png, icon.icns, icon.ico"
        echo "   Generate from PNG: cargo tauri icon <source.png>"
    fi

    echo ""
    echo "=========================================="
    log_success "Setup complete!"
    echo "=========================================="
    echo ""
    echo "To run in development mode:"
    echo "  bun run tauri dev"
    echo ""
    echo "To build for production:"
    echo "  bun run tauri build"
    echo ""
    echo "Note: Make sure the parent directory contains the CLI tools (demostools_file.ts)"
}

main "$@"
