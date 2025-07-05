#!/bin/bash
# Demos SDK Toolkit - Setup Script
# Automatically installs Bun and dependencies for a seamless experience

set -e  # Exit on any error

echo "🔧 Demos SDK Toolkit - Setup"
echo "=========================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get shell config file
get_shell_config() {
    if [[ "$SHELL" == *"zsh"* ]]; then
        echo "$HOME/.zshrc"
    elif [[ "$SHELL" == *"bash"* ]]; then
        if [[ -f "$HOME/.bashrc" ]]; then
            echo "$HOME/.bashrc"
        else
            echo "$HOME/.bash_profile"
        fi
    elif [[ "$SHELL" == *"fish"* ]]; then
        echo "$HOME/.config/fish/config.fish"
    else
        echo "$HOME/.profile"
    fi
}

# Check if Bun is installed
echo "📦 Checking Bun installation..."
if command_exists bun; then
    BUN_VERSION=$(bun --version)
    echo "✅ Bun is already installed (version $BUN_VERSION)"
else
    echo "⚠️  Bun is not installed. Installing Bun..."
    echo ""
    
    # Install Bun
    curl -fsSL https://bun.sh/install | bash
    
    # Add Bun to PATH for current session
    export PATH="$HOME/.bun/bin:$PATH"
    
    # Add Bun to shell config
    SHELL_CONFIG=$(get_shell_config)
    if [[ -f "$SHELL_CONFIG" ]]; then
        echo "" >> "$SHELL_CONFIG"
        echo "# Bun" >> "$SHELL_CONFIG"
        echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$SHELL_CONFIG"
        echo "✅ Added Bun to PATH in $SHELL_CONFIG"
    fi
    
    # Verify installation
    if command_exists bun; then
        BUN_VERSION=$(bun --version)
        echo "✅ Bun installed successfully (version $BUN_VERSION)"
    else
        echo "❌ Failed to install Bun. Please install manually from https://bun.sh"
        exit 1
    fi
fi

echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found!"
    echo "   Please run this script from the internal_tools directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

if [[ $? -eq 0 ]]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Check if wrapper exists
if [[ ! -f "demostools" ]]; then
    echo "❌ Error: demostools wrapper not found!"
    echo "   The wrapper script should be included in the repository"
    exit 1
fi

# Check if the main file exists
if [[ ! -f "demostools_file.ts" ]]; then
    echo "❌ Error: demostools_file.ts not found!"
    echo "   The main script should be included in the repository"
    exit 1
fi

# Ensure wrapper is executable
chmod +x demostools
echo "✅ Verified demostools wrapper is executable"

# Test the installation
echo "🧪 Testing installation..."
if ./demostools help >/dev/null 2>&1; then
    echo "✅ Installation test passed"
else
    echo "⚠️  Installation test failed, but setup completed"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 What was installed:"
echo "   ✅ Bun runtime (if needed)"
echo "   ✅ Project dependencies"
echo "   ✅ Verified executable wrapper"
echo ""
echo "🚀 Next steps:"
echo "   1. Set up your configuration:"
echo "      ./demostools config init"
echo ""
echo "   2. Or create a .env file:"
echo "      echo 'PRIVATE_KEY=\"your mnemonic\"' > .env"
echo "      echo 'DEMOS_RPC=\"https://node2.demos.sh\"' >> .env"
echo ""
echo "   3. Start using the toolkit:"
echo "      ./demostools help"
echo "      ./demostools generate-wallet"
echo "      ./demostools check-balance <address>"
echo ""
echo "📖 For full documentation, see README.md"
echo "🛠️  For development info, see DEVELOPER_GUIDE.md"

# Check if shell config was updated
SHELL_CONFIG=$(get_shell_config)
if [[ -f "$SHELL_CONFIG" ]] && grep -q "bun" "$SHELL_CONFIG"; then
    echo ""
    echo "⚠️  Note: Bun was added to your PATH in $SHELL_CONFIG"
    echo "   Please restart your terminal or run: source $SHELL_CONFIG"
fi

echo ""
echo "🏁 Setup complete! Happy coding! 🚀"