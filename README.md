# Demos SDK Toolkit

A comprehensive command-line interface and desktop application for interacting with the Demos blockchain network. This toolkit provides a unified interface for wallet management, cryptographic operations, cross-chain interactions, and Web2 integrations.

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime (v1.0+)

### Installation

**Option A: Quick Install (Recommended)**
```bash
# One-liner install (CLI + optional Desktop UI)
bash <(curl -fsSL https://raw.githubusercontent.com/kynesyslabs/demostoolkit/main/quick-install.sh)

# Alternative: download first, then run
curl -fsSL https://raw.githubusercontent.com/kynesyslabs/demostoolkit/main/quick-install.sh -o install.sh
bash install.sh
```

**Option B: Manual Install**
```bash
# Clone the repository
git clone <repository-url>
cd internal_tools

# Install dependencies
bun install

# Make CLI executable
chmod +x demostools
```

### Configuration

Set up your configuration (choose one method):

**Option 1: Interactive setup**
```bash
./demostools config init
```

**Option 2: Environment file**
```bash
# Create .env file
echo 'PRIVATE_KEY="your twelve word mnemonic phrase"' > .env
echo 'DEMOS_RPC="https://node2.demos.sh"' >> .env
```

**Option 3: Command line**
```bash
./demostools --config private_key="your mnemonic" --config demos_rpc="https://node2.demos.sh" <command>
```

### Basic Usage

```bash
# Show help
./demostools help

# Generate a new wallet
./demostools generate-wallet

# Generate keypair (Solana-style key management)
./demostools keygen new
./demostools keygen new --no-save  # Display only, don't save

# Recover wallet from mnemonic
./demostools keygen recover --mnemonic "your twelve word phrase"

# Check balance
./demostools check-balance demo1abc123...

# Sign a message
./demostools sign "Hello World" ed25519

# Check multichain balances
./demostools multichain balance 0x123...
```

## 🖥️ Desktop UI

A native desktop application is available for users who prefer a graphical interface.

### Running the Desktop UI

```bash
cd ui-app

# Install dependencies
bun install

# Development mode
bun run tauri dev

# Build for production
bun run tauri build
```

### Desktop UI Setup (Alternative)
```bash
cd ui-app
./setup.sh  # Installs Tauri CLI and dependencies
```

See [ui-app/README.md](./ui-app/README.md) for detailed UI documentation.

## 📚 Available Commands

### 🔧 Configuration Management
- `config show` - Display current configuration and sources
- `config init` - Create initial encrypted config file
- `config set <key> <value>` - Set a configuration value
- `config get <key>` - Get a configuration value
- `config set-rpc <url>` - Set RPC endpoint
- `config list-rpcs` - List available RPC endpoints
- `config apply-env` - Move .env settings to encrypted config
- `config use-config` - Switch from .env to config file

### 🔑 Key Management
- `keygen new [--outfile <path>] [--no-save]` - Generate new keypair
- `keygen pubkey [--keypair <path>]` - Display public key
- `keygen recover --mnemonic "..." [--outfile <path>] [--no-save]` - Recover from seed
- `keygen verify <pubkey> <signature> <message> [algorithm]` - Verify signature

### 👤 Account & Identity
- `account [address]` - Get comprehensive account information
- `identity list` - List all linked identities
- `identity web2` - Show Web2 identities (GitHub, Twitter, etc.)
- `identity web3` - Show Web3/cross-chain identities
- `identity points` - Show user points
- `identity referral` - Show referral information
- `identity add <platform> <username> <id>` - Add identity
- `identity remove <platform> <username>` - Remove identity
- `identity lookup <platform> <username>` - Find Demos address by identity

### 🌐 Network Operations
- `generate-wallet [128|256]` - Generate new wallet with mnemonic
- `check-balance <address>` - Check DEM token balance
- `send <amount> <address>` - Send DEM tokens
- `get-nonce <address>` - Get current nonce for address
- `network-info` - Display network status and peers
- `get-block` - Get latest block information
- `get-mempool` - View pending transactions
- `get-transaction <hash>` - Get transaction details

### 🔐 Cryptographic Operations
- `sign <message> [algorithm]` - Sign messages (ed25519, ml-dsa, falcon)
- `verify <message> <signature> <pubkey> [alg]` - Verify signatures
- `batch-sign <messages|file> [algorithm]` - Sign multiple messages
- `encrypt <encrypt|decrypt> <data> <alg> ...` - Encrypt/decrypt data
- `hash <hash|verify> <data> <algorithm> ...` - Hash/verify data

### 🌍 Web2 Integration
- `web2-proxy <proxy|tweet> <url> [method]` - Make attested Web2 API calls
- `web2-identity <proof|github|twitter|get>` - Manage Web2 identities (legacy)

### 🔗 Cross-chain Operations
- `multichain balance <address> [chains]` - Check balances across chains
- `multichain wrapped <source> <target>` - Find wrapped tokens
- `bridge <rubic|native|options> [args...]` - Bridge assets between chains

## 🔒 Security Features

### Encrypted Configuration
The toolkit supports encrypted configuration files to keep your private keys secure:

```bash
# Create encrypted config (prompts for password)
./demostools config init

# Apply existing .env to encrypted config
./demostools config apply-env
```

### Supported Cryptographic Algorithms
- **Signing**: ed25519 (default), ml-dsa, falcon
- **Encryption**: ml-kem-aes, rsa
- **Hashing**: sha256, sha3_512

## 🌐 Supported Chains

The multichain functionality supports:
- Ethereum Mainnet
- Bitcoin Mainnet
- Solana Mainnet
- MultiversX Mainnet
- TON Mainnet
- NEAR Mainnet
- XRPL Mainnet

## 📖 Examples

### Wallet Management
```bash
# Generate new wallet and save to config
./demostools generate-wallet --save-config

# Check your balance
./demostools check-balance $(./demostools config show | grep Address)
```

### Cryptographic Operations
```bash
# Sign with different algorithms
./demostools sign "Hello World" ed25519
./demostools sign "Hello World" ml-dsa
./demostools sign "Hello World" falcon

# Encrypt sensitive data
./demostools encrypt encrypt "secret data" ml-kem-aes

# Hash data
./demostools hash hash "data to hash" sha256
```

### Cross-chain Operations
```bash
# Check balances across all supported chains
./demostools multichain balance 0x742d35Cc6634C0532925a3b8D600C2F0ef7c5BB3

# Check specific chains only
./demostools multichain balance 0x123... ethereum_mainnet,bitcoin_mainnet

# Find wrapped tokens
./demostools multichain wrapped BITCOIN ETHEREUM
```

### Web2 Integration
```bash
# Create Web2 proof payload
./demostools web2-identity proof

# Add GitHub identity
./demostools web2-identity github octocat abc123def456

# Add Twitter identity
./demostools web2-identity twitter jack 1234567890123456789

# Make attested Web2 API call
./demostools web2-proxy proxy "https://api.github.com/user" GET
```

## 📚 Complete Example Guide

For a comprehensive walkthrough of all features with tested examples and expected outputs, see our **[Complete Example Guide](./EXAMPLES.md)**.

## 📂 Project Structure

```
internal_tools/
├── demostools                 # CLI wrapper script
├── demostools_file.ts         # Main CLI entry point
├── tools/
│   ├── modules/               # Modular tool implementations
│   │   ├── keygen.ts          # Key generation & recovery
│   │   ├── account.ts         # Account information
│   │   ├── identity.ts        # Identity management
│   │   ├── sign-message.ts    # Message signing
│   │   ├── check-balance.ts   # Balance checking
│   │   ├── multichain.ts      # Cross-chain operations
│   │   ├── config.ts          # Configuration management
│   │   └── ...                # Other tools (send, encrypt, hash, etc.)
│   ├── utils/                 # Shared utilities
│   │   ├── config.ts          # Configuration manager
│   │   ├── encryption.ts      # Crypto operations
│   │   ├── logger.ts          # Logging system
│   │   └── tool-framework.ts  # Base tool class
│   └── bridge_assets.ts       # Bridge tool (legacy)
├── ui-app/                    # Desktop UI (Tauri)
│   ├── src/                   # Frontend TypeScript
│   ├── src-tauri/             # Rust backend
│   ├── setup.sh               # UI setup script
│   └── README.md              # UI documentation
├── install-demos-toolkit.sh   # Universal installer
├── local-install.sh           # Local development installer
├── quick-install.sh           # Quick one-liner installer
├── package.json
├── README.md
├── EXAMPLES.md                # Complete example guide
├── DEVELOPER_GUIDE.md         # Developer documentation
├── UI_GUIDE.md                # Desktop UI guide
├── INSTALL.md                 # Installation guide
└── LICENSE.md                 # License information
```

## 🛠️ Development

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for detailed development instructions.

## 🔗 Links

- [Demos SDK Documentation](https://github.com/kynesyslabs/demosdk)
- [Bun Runtime](https://bun.sh)
- [Demos Network](https://demos.sh)

## 📄 License

This project is part of the Kynesys Labs ecosystem. See license terms in the main repository.

## 🆘 Support

For issues, questions, or contributions:
1. Check existing issues in the repository
2. Create a new issue with detailed information
3. Join the Kynesys Labs community channels

---

*Built with ❤️ by the Kynesys Labs team*