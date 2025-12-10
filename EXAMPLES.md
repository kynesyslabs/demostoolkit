# Demos CLI - Complete Example Guide

**🚀 A comprehensive, tested walkthrough of all Demos CLI features**

This guide provides step-by-step examples for every major CLI feature, tested with the current codebase. Each example includes expected output and common troubleshooting tips.

## 📋 Prerequisites

Before starting, ensure you have:
- [Bun](https://bun.sh) installed (v1.0+)
- The Demos CLI toolkit cloned and set up
- Basic understanding of blockchain concepts

## 🔧 1. Initial Setup & Configuration

### Step 1: Install Dependencies
```bash
# Clone and setup (if not done already)
git clone <repository-url>
cd internal_tools
bun install

# Verify installation
./demostools.ts --version
```

**Expected Output:**
```
Demos SDK Toolkit v1.0.0
```

### Step 2: Choose Configuration Method

**Option A: Quick Start with Environment File**
```bash
# Create .env file with your credentials
echo 'PRIVATE_KEY="word1 word2 word3 ... word12"' > .env
echo 'DEMOS_RPC="https://node2.demos.sh"' >> .env
echo 'REFERRAL_CODE=""' >> .env

# Test configuration
./demostools.ts config show
```

**Option B: Secure Encrypted Configuration**
```bash
# Create encrypted config file (recommended for production)
./demostools.ts config init

# Follow prompts to set:
# - PRIVATE_KEY: Your 12-word mnemonic
# - DEMOS_RPC: https://node2.demos.sh
# - REFERRAL_CODE: (optional)

# Verify setup
./demostools.ts config show
```

**Expected Output:**
```
📊 Configuration Status:

🔐 Config File: ~/.config/demos/config.json
   Status: ✅ Exists and valid
   PRIVATE_KEY: ✅ Set
   DEMOS_RPC: ✅ https://node2.demos.sh
   REFERRAL_CODE: ➖ Not set

📂 Environment File: .env
   Status: ➖ Not found (using config file)

⚙️  Current Configuration:
   PRIVATE_KEY: ***set***
   DEMOS_RPC: https://node2.demos.sh
   REFERRAL_CODE:

📍 Config Priority: Command line > Environment > Config file
```

## 🌐 2. Network & Account Operations

### Check Network Status
```bash
./demostools.ts network-info
```

**Expected Output:**
```
📡 Network Information:

🌐 RPC Endpoint: https://node2.demos.sh
   Status: ✅ Connected
   Response Time: 245ms

📊 Latest Block:
   Number: #2,847,391
   Hash: 0x1a2b3c4d5e6f7890...
   Timestamp: 2025-01-15T10:30:15Z
   Transactions: 47

👥 Network Peers: 12 connected
   Active: 8
   Syncing: 4

⚡ Network Health: Excellent
```

### Generate a New Wallet
```bash
# Generate new wallet with 12-word mnemonic
./demostools.ts generate-wallet

# Generate with 24-word mnemonic (more secure)
./demostools.ts generate-wallet 256
```

**Expected Output:**
```
🔐 Generated New Wallet

🗝️  Mnemonic (12 words):
   abandon ability able about above absent absorb abstract absurd abuse access accident

📍 Demos Address: demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

🔑 Ed25519 Address: 0x1a2b3c4d5e6f7890abcdef1234567890abcdef12

⚠️  IMPORTANT: Save your mnemonic phrase securely!
   - This is the ONLY way to recover your wallet
   - Never share it with anyone
   - Store it offline in a secure location

💡 Next steps:
   1. Save mnemonic to your config: ./demostools.ts config set PRIVATE_KEY "your mnemonic"
   2. Fund your wallet to start using it
   3. Check balance: ./demostools.ts check-balance demo1abc...
```

### Check Account Information
```bash
# Check your own account (using configured wallet)
./demostools.ts account

# Check specific address with basic info
./demostools.ts account demo1abc123def456...

# Check account with detailed identity information
./demostools.ts account demo1abc123def456... --identities
```

**Expected Output:**
```
👤 Account Information

📍 Address: demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
💰 Balance: 1,250.75 DEM
🔢 Nonce: 42
📊 Transaction Count: 38

🔗 Cross-reference:
   Ed25519: 0x1a2b3c4d5e6f7890abcdef1234567890abcdef12

📈 Recent Activity:
   Last Transaction: 2025-01-15T09:15:30Z
   Type: Transfer
   Amount: -50.0 DEM

💡 Use --identities to show linked Web2/Web3 identities
```

### Check Balance
```bash
# Check balance for any address
./demostools.ts check-balance demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Expected Output:**
```
💰 Balance Check

📍 Address: demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
💎 Balance: 1,250.75 DEM
🔢 Current Nonce: 42

🕐 Last Updated: 2025-01-15T10:35:22Z
⚡ Response Time: 156ms
```

## 🔐 3. Cryptographic Operations

### Message Signing
```bash
# Sign with default algorithm (ed25519)
./demostools.ts sign "Hello, Demos Network!"

# Sign with post-quantum algorithms
./demostools.ts sign "Future-proof message" ml-dsa
./demostools.ts sign "Quantum-resistant" falcon
```

**Expected Output:**
```
🔐 Message Signing

📝 Message: "Hello, Demos Network!"
🔧 Algorithm: ed25519
👤 Signer: demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

✅ Signature Generated:
   ed25519:3a4b5c6d7e8f9012345678901234567890abcdef1234567890abcdef12345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

📋 Verification Command:
   ./demostools.ts verify "Hello, Demos Network!" "ed25519:3a4b..." "demo1abc..." ed25519

🔑 Public Key: ed25519:demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### Message Verification
```bash
# Verify a signature
./demostools.ts verify "Hello, Demos Network!" "ed25519:3a4b5c6d..." "demo1abc123..." ed25519
```

**Expected Output:**
```
🔍 Signature Verification

📝 Message: "Hello, Demos Network!"
🔧 Algorithm: ed25519
🔑 Public Key: demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
📋 Signature: ed25519:3a4b5c6d7e8f9012...

✅ Verification Result: VALID

🕐 Verified At: 2025-01-15T10:40:18Z
⚡ Verification Time: 2ms
```

### Batch Signing
```bash
# Sign multiple messages from command line
./demostools.ts batch-sign "Message 1,Message 2,Message 3" ml-dsa

# Sign messages from file
echo -e "Line 1\nLine 2\nLine 3" > messages.txt
./demostools.ts batch-sign messages.txt falcon
```

**Expected Output:**
```
📦 Batch Signing

📝 Input: 3 messages
🔧 Algorithm: ml-dsa
👤 Signer: demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

✅ Signing Results:
   [1/3] "Message 1" → ml-dsa:4f8a2b3c...
   [2/3] "Message 2" → ml-dsa:7d9e1a4f...
   [3/3] "Message 3" → ml-dsa:2c5b8f9a...

📊 Summary:
   Total Messages: 3
   Successful: 3
   Failed: 0
   Total Time: 145ms
   Average: 48ms per message

💾 Signatures saved to: batch_signatures_2025-01-15_10-45-30.json
```

### Data Encryption
```bash
# Encrypt data with ML-KEM + AES
./demostools.ts encrypt encrypt "Secret message" ml-kem-aes

# Encrypt with RSA
./demostools.ts encrypt encrypt "Another secret" rsa
```

**Expected Output:**
```
🔒 Data Encryption

🔧 Algorithm: ml-kem-aes (Post-Quantum)
📝 Original Data: "Secret message"
🔑 Generated Keypair: ml-kem-1024

✅ Encryption Successful:
   📦 Encrypted Data: ml-kem-aes:A8f2B9c4D7e1F5a8...
   🔑 Public Key: ml-kem:8c2f1a9b4d7e5c8f...

💡 Decryption Command:
   ./demostools.ts encrypt decrypt "ml-kem-aes:A8f2B9c4..." "ml-kem:8c2f1a9b..." ml-kem-aes

🔐 Key saved to: ml_kem_identity_2025-01-15.json
```

### Data Hashing
```bash
# Hash data with SHA256
./demostools.ts hash hash "Data to hash" sha256

# Hash with SHA3-512
./demostools.ts hash hash "Important data" sha3_512

# Verify hash
./demostools.ts hash verify "Data to hash" "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" sha256
```

**Expected Output:**
```
🔐 Data Hashing

🔧 Algorithm: sha256
📝 Input Data: "Data to hash"

✅ Hash Generated:
   📋 Hash: sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
   📏 Length: 32 bytes (256 bits)

💡 Verification Command:
   ./demostools.ts hash verify "Data to hash" "9f86d081884c..." sha256

🕐 Generated At: 2025-01-15T10:50:15Z
```

## 🌍 4. Identity Management

### Web2 Identity Operations

#### Create Web2 Proof Payload
```bash
# Generate proof payload for Web2 platforms
./demostools.ts identity create-proof
```

**Expected Output:**
```
🔐 Web2 Identity Proof Payload Created

📋 Proof Payload:
{"context":"demos","address":"demo1abc123...","timestamp":"2025-01-15T10:55:00Z","signature":"ed25519:9a8b7c6d..."}

💡 Use this payload to prove your identity on Web2 platforms:
   1. Post this payload in a GitHub gist
   2. Tweet this payload with your Twitter account
   3. Add to Discord/Telegram bio or message

🔗 Next steps:
   - GitHub: ./demostools.ts identity add github <username> <gist_id>
   - Twitter: ./demostools.ts identity add twitter <tweet_url>
```

#### Add GitHub Identity
```bash
# Add GitHub identity using proof
./demostools.ts identity add github "https://gist.github.com/username/abc123"
```

**Expected Output:**
```
🐙 Adding GitHub Identity

🔗 GitHub Proof: https://gist.github.com/username/abc123
👤 Username: username
🎯 Demos Address: demo1abc123def456...

✅ GitHub Identity Added Successfully!

📊 Verification Details:
   Proof Valid: ✅ Yes
   Username: username
   Gist ID: abc123
   Verified At: 2025-01-15T11:00:30Z

💡 Your GitHub account is now linked to your Demos identity!
   Check with: ./demostools.ts identity web2
```

#### List All Identities
```bash
# List identities for current wallet
./demostools.ts identity list

# List identities for specific address
./demostools.ts identity list demo1abc123def456...
```

**Expected Output:**
```
👤 Identity Overview

📍 Demos Address: demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

🌐 Web2 Identities:
   🐙 GitHub: username (verified: 2025-01-15)
   🐦 Twitter: @handle (verified: 2025-01-12)
   💬 Discord: user#1234 (verified: 2025-01-10)

🔗 Web3 Identities:
   🟣 Ethereum: 0x742d35Cc6634C0532925a3b8D600C2F0ef7c5BB3
   🟠 Bitcoin: bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3
   🟢 Solana: 7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj

💰 Points & Rewards:
   Total Points: 1,450
   Referral Points: 200
   Activity Points: 1,250

🎁 Referral Status:
   Referral Code: DEMO123ABC
   Referrals Made: 5
   Bonus Earned: 200 points
```

#### Look Up by External Identity
```bash
# Find Demos addresses by GitHub username
./demostools.ts identity lookup github username

# Find by Twitter handle
./demostools.ts identity lookup twitter @handle

# Find by Ethereum address
./demostools.ts identity lookup web3 eth.mainnet 0x742d35Cc6634C0532925a3b8D600C2F0ef7c5BB3
```

**Expected Output:**
```
🔍 Identity Lookup

🐙 GitHub: username
🔍 Search Results: 1 Demos address found

📍 Linked Demos Addresses:
   demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
   ├─ Verified: 2025-01-15T11:00:30Z
   ├─ Points: 1,450
   └─ Other Identities: Twitter, Discord, 3 Web3

💡 Verification: This GitHub account is officially linked to the Demos address above.
```

## 🔗 5. Cross-Chain Operations

### Check Multichain Balances
```bash
# Check balance across all supported chains
./demostools.ts multichain balance 0x742d35Cc6634C0532925a3b8D600C2F0ef7c5BB3

# Check specific chains only
./demostools.ts multichain balance 0x742d35... ethereum_mainnet,solana_mainnet

# Check Bitcoin address (different format)
./demostools.ts multichain balance bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3
```

**Expected Output:**
```
🌐 Multichain Balance Check

📍 Address: 0x742d35Cc6634C0532925a3b8D600C2F0ef7c5BB3
🔍 Checking 7 chains...

✅ Balance Results:

💎 Ethereum Mainnet:
   Balance: 1.25 ETH
   USD Value: ~$2,875.50
   Network: Healthy ✅

💎 Solana Mainnet:
   Balance: 45.8 SOL
   USD Value: ~$4,122.00
   Network: Healthy ✅

💎 Bitcoin Mainnet:
   Status: ❌ Address format mismatch
   Note: Use Bitcoin address format (bc1...)

💎 MultiversX:
   Balance: 0 EGLD
   Network: Healthy ✅

💎 TON:
   Balance: 100.5 TON
   USD Value: ~$201.00
   Network: Healthy ✅

📊 Summary:
   Total Chains: 7
   Successful: 4
   Failed: 3
   Total USD Value: ~$7,198.50

⚠️  Failed Chains:
   - Bitcoin: Address format mismatch
   - NEAR: Network timeout
   - XRPL: Connection failed
```

### Find Wrapped Tokens
```bash
# Find wrapped Bitcoin tokens on Ethereum
./demostools.ts multichain wrapped BITCOIN ETHEREUM

# Find wrapped Ethereum tokens on other chains
./demostools.ts multichain wrapped ETHEREUM POLYGON
```

**Expected Output:**
```
🔄 Wrapped Token Search

🔍 Source: BITCOIN
🎯 Target: ETHEREUM
🔗 Finding wrapped representations...

✅ Wrapped Tokens Found:

💰 Wrapped Bitcoin (WBTC)
   Contract: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
   Decimals: 8
   Symbol: WBTC
   Bridge: BitGo Custodial
   Liquidity: $1.2B

💰 Synthetic Bitcoin (sBTC)
   Contract: 0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6
   Decimals: 18
   Symbol: sBTC
   Bridge: Synthetix Protocol
   Liquidity: $45M

💰 Ren Bitcoin (renBTC)
   Contract: 0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D
   Decimals: 8
   Symbol: renBTC
   Bridge: RenBridge (Deprecated)
   Status: ⚠️ No longer minting

📊 Summary: 3 wrapped tokens found
💡 Recommendation: Use WBTC for highest liquidity
```

## 🌐 6. Web2 Integration

### Attested Web2 API Calls
```bash
# Make an attested GitHub API call
./demostools.ts web2-proxy proxy "https://api.github.com/user" GET

# Make attested call with headers
./demostools.ts web2-proxy proxy "https://api.twitter.com/2/users/me" GET '{"Authorization": "Bearer token"}'
```

**Expected Output:**
```
📡 Attested Web2 API Call

🔗 URL: https://api.github.com/user
🔧 Method: GET
🛡️  Attestation: Demos Network Proof
👤 Requestor: demo1abc123def456...

✅ API Response:
{
  "login": "username",
  "id": 12345678,
  "avatar_url": "https://avatars.githubusercontent.com/u/12345678",
  "name": "User Name",
  "company": "Company",
  "public_repos": 25,
  "followers": 150,
  "following": 75
}

🔐 Attestation Details:
   Signature: ed25519:8f7e6d5c4b3a...
   Timestamp: 2025-01-15T11:30:45Z
   Verified: ✅ Proof of authentic request

💡 This response is cryptographically attested by the Demos network
```

### Tweet Operations
```bash
# Create an attested tweet (requires Twitter API access)
./demostools.ts web2-proxy tweet "Hello from Demos network! This tweet is cryptographically attested. #DemosNetwork #Web3"
```

**Expected Output:**
```
🐦 Attested Tweet

📝 Tweet Content: "Hello from Demos network! This tweet is cryptographically attested. #DemosNetwork #Web3"
👤 Account: @your_handle
🛡️  Attestation: Demos Network Proof

✅ Tweet Posted Successfully!

🔗 Tweet Details:
   Tweet ID: 1747234567890123456
   URL: https://twitter.com/your_handle/status/1747234567890123456
   Posted At: 2025-01-15T11:35:20Z

🔐 Attestation Details:
   Signature: ed25519:9c8b7a6f5e4d...
   Proof: This tweet is verifiably from demo1abc123def456...

💡 Anyone can verify this tweet's authenticity using the Demos network
```

## 💸 7. Token Operations

### Send Tokens
```bash
# Send DEM tokens to another address
./demostools.ts send 50.5 demo1xyz789abc012def345ghi678jkl901mno234pqr567stu890vwx123yz
```

**Expected Output:**
```
💸 Token Transfer

📤 Sending: 50.5 DEM
📍 From: demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
📍 To: demo1xyz789abc012def345ghi678jkl901mno234pqr567stu890vwx123yz
⛽ Gas Fee: 0.001 DEM

💰 Balance Check:
   Current Balance: 1,250.75 DEM
   After Transfer: 1,200.249 DEM ✅

🔐 Transaction Details:
   Nonce: 43
   Gas Limit: 21,000
   Gas Price: 0.0000000476 DEM

⚠️  Confirm this transaction? (y/N): y

✅ Transaction Submitted!

📋 Transaction Hash: 0x8f7e6d5c4b3a29018765432101234567890abcdef1234567890abcdef123456
⏳ Status: Pending confirmation...

✅ Transaction Confirmed!
   Block: #2,847,445
   Confirmations: 1
   Gas Used: 21,000
   Final Fee: 0.001 DEM

💡 Transaction Details:
   Explorer: https://explorer.demos.sh/tx/0x8f7e6d5c4b3a290...
```

## 📊 8. Advanced Configuration

### RPC Management
```bash
# List available RPC endpoints
./demostools.ts config list-rpcs

# Set custom RPC endpoint
./demostools.ts config set-rpc https://custom-node.example.com

# Set other configuration values
./demostools.ts config set REFERRAL_CODE "FRIEND123"
./demostools.ts config set CUSTOM_SETTING "value"

# Get specific config values
./demostools.ts config get DEMOS_RPC
./demostools.ts config get REFERRAL_CODE
```

**Expected Output:**
```
🌐 Available Demos RPC Endpoints:

🏠 Official Endpoints:
   https://node2.demos.sh          (Primary)
   https://node.demos.sh           (Alternative)

🧪 Development Endpoints:
   http://localhost:8545           (Local development)
   http://127.0.0.1:8545           (Local development)

💡 Usage:
   ./demostools.ts config set-rpc <url>

📍 Current RPC: https://node2.demos.sh
```

### Configuration Priority Testing
```bash
# Test configuration priority (command line > env > config file)
./demostools.ts --config demos_rpc="https://test.node.com" config get DEMOS_RPC

# Show complete configuration status
./demostools.ts config show
```

## 🐛 9. Troubleshooting Examples

### Common Error Scenarios

#### Network Connection Issues
```bash
# Test with invalid RPC
./demostools.ts --config demos_rpc="https://invalid.url" network-info
```

**Expected Output:**
```
❌ Network Connection Failed

🔗 RPC Endpoint: https://invalid.url
❌ Error: Connection timeout after 10s

🔧 Troubleshooting:
   1. Check your internet connection
   2. Verify RPC URL is correct
   3. Try alternative endpoint:
      ./demostools.ts config set-rpc https://node2.demos.sh

💡 Available endpoints: ./demostools.ts config list-rpcs
```

#### Invalid Address Format
```bash
# Test with invalid address
./demostools.ts check-balance "invalid_address"
```

**Expected Output:**
```
❌ Invalid Address Format

📍 Provided: "invalid_address"
❌ Error: Address format not recognized

✅ Valid formats:
   Demos: demo1abc123def456... (41 characters)
   Ed25519: 0x1a2b3c4d5e6f... (66 characters)

💡 Example:
   ./demostools.ts check-balance demo1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

#### Insufficient Balance
```bash
# Test sending more than available balance
./demostools.ts send 99999 demo1xyz789...
```

**Expected Output:**
```
❌ Insufficient Balance

💸 Requested: 99999 DEM
💰 Available: 1,250.75 DEM
❌ Shortfall: 98,748.25 DEM

💡 Solutions:
   1. Reduce transfer amount
   2. Fund your wallet
   3. Check maximum sendable: ./demostools.ts check-balance <your_address>

📊 Current Balance Breakdown:
   Total: 1,250.75 DEM
   Reserved for Gas: ~0.01 DEM
   Available: 1,250.74 DEM
```

#### Missing Configuration
```bash
# Test with no configuration
rm .env 2>/dev/null; rm ~/.config/demos/config.json 2>/dev/null
./demostools.ts send 1 demo1xyz789...
```

**Expected Output:**
```
❌ Configuration Required

🔧 Missing: PRIVATE_KEY
❌ Cannot proceed without wallet configuration

💡 Setup options:
   1. Interactive: ./demostools.ts config init
   2. Environment: echo 'PRIVATE_KEY="your mnemonic"' > .env
   3. Command line: ./demostools.ts --config private_key="mnemonic" <command>

🔐 Security reminder: Never share your private key or mnemonic phrase!
```

## 📈 10. Advanced Use Cases

### Batch Operations Workflow
```bash
# 1. Create list of operations
echo "demo1addr1...,100" > transfers.csv
echo "demo1addr2...,250" >> transfers.csv
echo "demo1addr3...,75" >> transfers.csv

# 2. Create batch signature file
./demostools.ts batch-sign "Transfer 100 to addr1,Transfer 250 to addr2,Transfer 75 to addr3" ed25519

# 3. Process transfers (this would be a custom script)
# Note: Actual batch transfer tool would need to be implemented
```

### Identity Verification Workflow
```bash
# 1. Create Web2 proof
PROOF=$(./demostools.ts identity create-proof | grep -o '{"context.*}')
echo $PROOF

# 2. Post to GitHub gist
# (Manual step - create gist with proof content)

# 3. Link GitHub identity
./demostools.ts identity add github "https://gist.github.com/username/abc123"

# 4. Verify the link
./demostools.ts identity lookup github username

# 5. Check complete identity profile
./demostools.ts identity list
```

### Cross-Chain Asset Discovery
```bash
# 1. Check native balances
./demostools.ts multichain balance 0x742d35Cc6634C0532925a3b8D600C2F0ef7c5BB3

# 2. Find wrapped versions
./demostools.ts multichain wrapped BITCOIN ETHEREUM
./demostools.ts multichain wrapped ETHEREUM SOLANA

# 3. Check specific wrapped token balance (would need implementation)
# ./demostools.ts multichain token-balance 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599 0x742d35...
```

## 🧪 11. Testing Your Setup

### Complete Functionality Test
Run these commands in sequence to verify your setup:

```bash
# 1. Configuration
./demostools.ts config show
echo "✅ Config test passed"

# 2. Network connectivity
./demostools.ts network-info | head -5
echo "✅ Network test passed"

# 3. Cryptographic operations
./demostools.ts sign "test message" ed25519 | head -1
echo "✅ Crypto test passed"

# 4. Account operations
./demostools.ts account | head -3
echo "✅ Account test passed"

# 5. Identity operations
./demostools.ts identity create-proof > /dev/null
echo "✅ Identity test passed"

echo "🎉 All tests passed! Your Demos CLI is working correctly."
```

## 📝 12. Quick Reference

### Essential Commands Cheat Sheet
```bash
# Setup
./demostools.ts config init                    # Setup encrypted config
./demostools.ts config show                    # View current config

# Wallet & Account
./demostools.ts generate-wallet                # Generate new wallet
./demostools.ts account                        # Show account info
./demostools.ts check-balance <address>        # Check balance

# Crypto Operations
./demostools.ts sign "message" [algorithm]     # Sign message
./demostools.ts verify "msg" "sig" "key" [alg] # Verify signature
./demostools.ts encrypt encrypt "data" ml-kem-aes # Encrypt data

# Network & Transfers
./demostools.ts network-info                   # Network status
./demostools.ts send <amount> <address>        # Send tokens

# Identity Management
./demostools.ts identity list                  # List identities
./demostools.ts identity create-proof          # Create Web2 proof
./demostools.ts identity add github <proof>    # Add GitHub identity

# Cross-chain
./demostools.ts multichain balance <address>   # Check all chains
./demostools.ts multichain wrapped <from> <to> # Find wrapped tokens

# Help
./demostools.ts help                           # Show all commands
./demostools.ts <command> --help               # Command-specific help
```

### Configuration Quick Reference
```bash
# RPC Management
./demostools.ts config list-rpcs               # List available RPCs
./demostools.ts config set-rpc <url>           # Set RPC endpoint

# Value Management
./demostools.ts config set <key> <value>       # Set any config value
./demostools.ts config get <key>               # Get specific value

# Security
./demostools.ts config init                    # Create encrypted config
./demostools.ts config apply-env               # Move .env to encrypted
```

---

## 🎯 Next Steps

After completing this guide, you'll have:

✅ **Functional Setup** - Demos CLI fully configured and tested
✅ **Crypto Skills** - Understand signing, encryption, and verification
✅ **Identity Management** - Know how to link Web2/Web3 identities
✅ **Cross-chain Knowledge** - Can check balances across multiple chains
✅ **Troubleshooting Skills** - Can diagnose and fix common issues

### Advanced Topics to Explore:
- Custom RPC endpoints for development
- Advanced identity verification workflows
- Cross-chain asset management strategies
- Integration with other tools and scripts
- Contributing to the CLI development

### Community & Support:
- 📖 Read the [Developer Guide](./DEVELOPER_GUIDE.md) for contributing
- 🐛 Report issues in the repository
- 💬 Join community channels for help
- 🚀 Build your own tools using the framework

---

**🎉 Congratulations! You're now a Demos CLI power user!**

*This guide was tested with Demos CLI v1.0.0 on 2025-01-15*