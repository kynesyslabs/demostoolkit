#!/usr/bin/env bun

import { signMessageTool } from './tools/modules/sign-message';
import { sendTool } from './tools/modules/send';
import { checkBalanceTool } from './tools/modules/check-balance';
import { batchSignTool } from './tools/modules/batch-sign';
import { generateWalletTool } from './tools/modules/generate-wallet';
import { getBlockTool } from './tools/modules/get-block';
import { encryptDataTool } from './tools/modules/encrypt-data';
import { verifyMessageTool } from './tools/modules/verify-message';
import { hashDataTool } from './tools/modules/hash-data';
import { getNonceTool } from './tools/modules/get-nonce';
import { networkInfoTool } from './tools/modules/network-info';
import { getMempoolTool } from './tools/modules/get-mempool';
import { getTransactionTool } from './tools/modules/get-transaction';
import { multichainTool } from './tools/modules/multichain';
import { web2IdentityTool } from './tools/modules/web2-identity';
import { web2ProxyTool } from './tools/modules/web2-proxy';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import packageJson from './package.json';

// Module-based tools (new system)
const moduleTools = {
  'sign': signMessageTool,
  'send': sendTool,
  'check-balance': checkBalanceTool,
  'batch-sign': batchSignTool,
  'generate-wallet': generateWalletTool,
  'get-block': getBlockTool,
  'encrypt': encryptDataTool,
  'verify': verifyMessageTool,
  'hash': hashDataTool,
  'get-nonce': getNonceTool,
  'network-info': networkInfoTool,
  'get-mempool': getMempoolTool,
  'get-transaction': getTransactionTool,
  'multichain': multichainTool,
  'web2-identity': web2IdentityTool,
  'web2-proxy': web2ProxyTool
};

// Legacy tools (minimal remaining)
const legacyTools = {
  // Configuration (special handling)
  'config': { file: 'config_tool.ts', desc: 'Manage configuration settings' },
  
  // Cross-chain operations (remaining tool)
  'bridge': { file: 'bridge_assets.ts', desc: 'Bridge assets between chains' }
};

function showHelp() {
  console.log(`
🔧 Demos SDK Toolkit - Command Line Interface

Usage: demostools <command> [options...]

📚 Available Commands:

🔧 Configuration:
  config show                                  Show current configuration and sources
  config init                                  Create initial config file
  config apply-env                             Apply .env to encrypted config (removes .env)
  config use-config                            Use config file over .env (backs up .env)

🌐 Network Operations:
  generate-wallet [128|256]                    Generate a new wallet with mnemonic
  check-balance <address>                      Check balance for an address
  send <amount> <address>                      Send DEM tokens to another address
  get-nonce <address>                          Get the current nonce for an address
  network-info                                 Get network status and peer information
  get-block                                    Get the latest block information
  get-mempool                                  View pending transactions in mempool
  get-transaction <hash>                       Get transaction details by hash

🔐 Cryptographic Operations:
  sign <message> [algorithm]                   Sign messages (ed25519, ml-dsa, falcon)
  verify <message> <signature> <pubkey> [alg]  Verify message signatures
  batch-sign <messages|file> [algorithm]       Sign multiple messages efficiently
  encrypt <encrypt|decrypt> <data> <alg> ...  Encrypt/decrypt data (ml-kem-aes, rsa)
  hash <hash|verify> <data> <algorithm> ...   Hash/verify data (sha256, sha3_512)

🌍 Web2 Integration:
  web2-proxy <proxy|tweet> <url> [method]     Make attested Web2 API calls
  web2-identity <proof|github|twitter|get>    Manage Web2 identities

🔗 Cross-chain Operations:
  multichain balance <address> [chains]       Check balances across multiple chains
  multichain wrapped <source> <target>        Find wrapped tokens between chains
  bridge <rubic|native|options> [args...]    Bridge assets between chains

🔧 General:
  help, --help, -h                           Show this help message
  version, --version, -v                     Show version information

📖 Examples:
  demostools generate-wallet
  demostools check-balance demo1abc123...
  demostools send 10.5 demo1xyz789...
  demostools sign "Hello World" ml-dsa
  demostools encrypt encrypt "secret" ml-kem-aes
  demostools multichain balance 0x123...

📋 Setup:
  Option 1 - Config file: demostools config init
  Option 2 - Environment: Create .env file with:
    PRIVATE_KEY="your twelve word mnemonic phrase"
    DEMOS_RPC="https://node2.demos.sh"
  Option 3 - Command line: --config private_key="..." --config demos_rpc="..."

🔗 More Info: https://github.com/your-repo/demos-toolkit
`);
}

function showVersion() {
  console.log(`Demos SDK Toolkit v${packageJson.version}`);
}

function runLegacyTool(toolFile: string, args: string[]) {
  const toolPath = join(__dirname, 'tools', toolFile);
  
  if (!existsSync(toolPath)) {
    console.error(`❌ Tool file not found: ${toolPath}`);
    process.exit(1);
  }

  // Spawn the tool with bun
  const child = spawn('bun', [toolPath, ...args], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    console.error(`❌ Failed to run tool: ${err.message}`);
    process.exit(1);
  });
}

async function main() {
  // Parse command line arguments
  let args = process.argv.slice(2);

  // Extract --config arguments and remove them from args
  const configArgs: string[] = [];
  const filteredArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && i + 1 < args.length) {
      configArgs.push(args[i], args[i + 1]);
      i++; // Skip the config value
    } else {
      filteredArgs.push(args[i]);
    }
  }

  args = filteredArgs;

  if (args.length === 0 || ['help', '--help', '-h'].includes(args[0])) {
    showHelp();
    process.exit(0);
  }

  if (['version', '--version', '-v'].includes(args[0])) {
    showVersion();
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  // Check if command is a module-based tool
  if (command in moduleTools) {
    try {
      const tool = moduleTools[command];
      const result = await tool.run(commandArgs);
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error(`❌ Error running ${command}:`, error.message);
      process.exit(1);
    }
  }

  // Check if command is a legacy tool
  else if (command in legacyTools) {
    const tool = legacyTools[command];
    let allArgs: string[];

    if (command === 'config') {
      // For config tool, include --config args
      allArgs = [...configArgs, ...commandArgs];
    } else {
      // For other tools, only pass the command arguments
      allArgs = commandArgs;
    }

    runLegacyTool(tool.file, allArgs);
  }

  // Unknown command
  else {
    console.error(`❌ Unknown command: ${command}\n`);
    console.log('Available commands:');
    
    // Show module tools
    Object.keys(moduleTools).forEach(cmd => {
      console.log(`  ${cmd.padEnd(20)} [Module]`);
    });
    
    // Show legacy tools
    Object.keys(legacyTools).forEach(cmd => {
      console.log(`  ${cmd.padEnd(20)} ${legacyTools[cmd].desc}`);
    });
    
    console.log('\nRun "demostools help" for detailed usage information.');
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});