import { websdk } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult } from '../utils/tool-framework';
import { configManager } from '../utils/config';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class GenerateWalletTool extends DemosTool {
  constructor() {
    super('generate_wallet');
  }

  protected showUsage(): void {
    console.error('Usage: demostools generate-wallet [strength] [options]');
    console.error('');
    console.error('Arguments:');
    console.error('  strength    Mnemonic strength: 128 or 256 bits (default: 128)');
    console.error('');
    console.error('Options:');
    console.error('  --save-config   Save to encrypted config file');
    console.error('  --save-env      Save to .env file');
    console.error('');
    console.error('Examples:');
    console.error('  demostools generate-wallet');
    console.error('  demostools generate-wallet 256 --save-config');
    console.error('  demostools generate-wallet 128 --save-env');
  }

  protected validateArgs(args: string[]): boolean {
    // No required args, all optional
    if (args.length > 0) {
      const strengthArg = args[0];
      if (strengthArg !== '128' && strengthArg !== '256' && !strengthArg.startsWith('--')) {
        console.error('❌ Invalid strength. Use 128 or 256');
        return false;
      }
    }
    return true;
  }

  private async saveToConfig(walletInfo: any) {
    try {
      const currentConfig = configManager.getAll();
      const newConfig = {
        ...currentConfig,
        PRIVATE_KEY: walletInfo.mnemonic,
        DEMOS_RPC: currentConfig.DEMOS_RPC || 'https://node2.demos.sh'
      };
      
      const success = configManager.createConfigFile(newConfig);
      if (success) {
        console.log('✅ Wallet saved to config file');
        console.log('   You can now use other demostools commands without additional setup');
      }
    } catch (error) {
      console.error('❌ Failed to save to config:', error.message);
    }
  }

  private async saveToEnv(walletInfo: any) {
    try {
      const rpcUrl = await this.getRpcUrl();
      const envContent = `# Demos SDK Toolkit Configuration
# Generated on ${walletInfo.generated}

PRIVATE_KEY="${walletInfo.mnemonic}"
DEMOS_RPC="${rpcUrl}"
`;
      
      writeFileSync('.env', envContent);
      console.log('✅ Wallet saved to .env file');
      console.log('   You can now use other demostools commands');
    } catch (error) {
      console.error('❌ Failed to save to .env:', error.message);
    }
  }

  private async saveWalletInfo(walletInfo: any) {
    try {
      const configDir = join(homedir(), '.config', 'demos');
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      
      const walletsFile = join(configDir, 'wallets.json');
      let wallets: any[] = [];
      
      // Load existing wallets if file exists
      if (existsSync(walletsFile)) {
        try {
          const existing = require(walletsFile);
          wallets = Array.isArray(existing) ? existing : [];
        } catch {
          // Ignore parse errors, start fresh
        }
      }
      
      // Add new wallet info (without mnemonic for security)
      const walletRecord = {
        address: walletInfo.address,
        ed25519Address: walletInfo.ed25519Address,
        strength: walletInfo.strength,
        generated: walletInfo.generated,
        label: `Wallet ${wallets.length + 1}`
      };
      
      wallets.push(walletRecord);
      
      writeFileSync(walletsFile, JSON.stringify(wallets, null, 2));
      console.log(`💼 Wallet info saved to ${walletsFile}`);
      console.log('   (Private key not stored in wallet registry for security)');
    } catch (error) {
      this.logger.error('Failed to save wallet info', error);
    }
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    // Parse arguments
    let strength: 128 | 256 = 128;
    let saveToConfigFile = false;
    let saveToEnvFile = false;

    for (const arg of args) {
      if (arg === '128' || arg === '256') {
        strength = parseInt(arg) as 128 | 256;
      } else if (arg === '--save-config') {
        saveToConfigFile = true;
      } else if (arg === '--save-env') {
        saveToEnvFile = true;
      }
    }

    this.logger.info(`Starting wallet generation with ${strength} bits`);
    
    // Get RPC URL
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Generate wallet
    const mnemonic = demos.newMnemonic(strength);
    this.logger.info(`Mnemonic generated with ${strength} bits`);
    
    const address = await demos.connectWallet(mnemonic);
    const ed25519Address = await demos.getEd25519Address();
    
    const walletInfo = {
      mnemonic,
      address,
      ed25519Address,
      strength,
      generated: new Date().toISOString()
    };
    
    // Output wallet info
    console.log('✅ Wallet generated successfully');
    console.log('');
    console.log('🎲 Generated Wallet:');
    console.log(`   Mnemonic: ${walletInfo.mnemonic}`);
    console.log(`   Address: ${walletInfo.address}`);
    console.log(`   Ed25519 Address: ${walletInfo.ed25519Address}`);
    console.log(`   Strength: ${walletInfo.strength} bits`);
    console.log(`   Generated: ${walletInfo.generated}`);
    console.log('');
    
    // Handle saving based on flags
    if (saveToConfigFile) {
      await this.saveToConfig(walletInfo);
    } else if (saveToEnvFile) {
      await this.saveToEnv(walletInfo);
    } else {
      console.log('💾 Save wallet to configuration?');
      console.log('   This will update your config to use this wallet automatically.');
      console.log('   Choose an option:');
      console.log('');
      console.log('   1. Save to config file (~/.config/demos/config.json)');
      console.log('   2. Save to current directory (.env)');
      console.log('   3. Don\'t save (just display)');
      console.log('');
      console.log('   Use flags: --save-config or --save-env to skip this prompt');
    }
    
    // Always save wallet info for reference
    await this.saveWalletInfo(walletInfo);
    
    return { success: true, data: walletInfo };
  }
}

export const generateWalletTool = new GenerateWalletTool();