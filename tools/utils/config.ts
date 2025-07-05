import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { config as dotenvConfig } from 'dotenv';
import { encryptWithPassword, decryptWithPassword, EncryptedData } from './encryption';
import { createInterface } from 'readline';

// Load .env first (silently)
process.env.DOTENV_CONFIG_DEBUG = 'false';
dotenvConfig();

export interface DemosConfig {
  PRIVATE_KEY?: string;
  DEMOS_RPC?: string;
  REFERRAL_CODE?: string;
}

interface ConfigFile {
  PRIVATE_KEY?: string | EncryptedData;
  DEMOS_RPC?: string;
  REFERRAL_CODE?: string;
  encrypted?: boolean;
}

class ConfigManager {
  private configPath: string;
  private config: DemosConfig = {};
  private password?: string;
  private isConfigEncrypted = false;

  constructor() {
    // Config file location: ~/.config/demos/config.json
    const configDir = join(homedir(), '.config', 'demos');
    this.configPath = join(configDir, 'config.json');
    this.loadConfig();
  }

  private loadConfig() {
    // 1. Load from config file (lowest priority)
    this.loadFromConfigFileSync();
    
    // 2. Override with .env variables (medium priority)
    this.loadFromEnv();
    
    // 3. Override with command line args (highest priority)
    this.loadFromCommandLine();
  }

  private loadFromConfigFileSync() {
    if (existsSync(this.configPath)) {
      try {
        const configData = readFileSync(this.configPath, 'utf-8');
        const fileConfig: ConfigFile = JSON.parse(configData);
        
        // Check if config is encrypted
        this.isConfigEncrypted = fileConfig.encrypted === true;
        
        if (this.isConfigEncrypted && fileConfig.PRIVATE_KEY && typeof fileConfig.PRIVATE_KEY === 'object') {
          // Need to decrypt private key - will be done lazily when accessed
          this.config.DEMOS_RPC = fileConfig.DEMOS_RPC;
          this.config.REFERRAL_CODE = fileConfig.REFERRAL_CODE;
          // PRIVATE_KEY will be decrypted on-demand
        } else {
          // Plain text config
          this.config = { ...this.config, ...fileConfig };
        }
      } catch (error) {
        console.warn(`Warning: Could not read config file ${this.configPath}: ${error.message}`);
      }
    }
  }

  private async loadFromConfigFile() {
    if (existsSync(this.configPath)) {
      try {
        const configData = readFileSync(this.configPath, 'utf-8');
        const fileConfig: ConfigFile = JSON.parse(configData);
        
        // Check if config is encrypted
        this.isConfigEncrypted = fileConfig.encrypted === true;
        
        if (this.isConfigEncrypted && fileConfig.PRIVATE_KEY && typeof fileConfig.PRIVATE_KEY === 'object') {
          // Need to decrypt private key - will be done lazily when accessed
          this.config.DEMOS_RPC = fileConfig.DEMOS_RPC;
          this.config.REFERRAL_CODE = fileConfig.REFERRAL_CODE;
          // PRIVATE_KEY will be decrypted on-demand
        } else {
          // Plain text config
          this.config = { ...this.config, ...fileConfig };
        }
      } catch (error) {
        console.warn(`Warning: Could not read config file ${this.configPath}: ${error.message}`);
      }
    }
  }

  private async promptPassword(): Promise<string> {
    return new Promise((resolve) => {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      console.log('🔐 Config file is encrypted. Please enter your password:');
      rl.question('Password: ', (password) => {
        rl.close();
        resolve(password);
      });
    });
  }

  private async getDecryptedPrivateKey(): Promise<string | undefined> {
    if (!this.isConfigEncrypted) {
      return this.config.PRIVATE_KEY;
    }

    try {
      const configData = readFileSync(this.configPath, 'utf-8');
      const fileConfig: ConfigFile = JSON.parse(configData);
      
      if (fileConfig.PRIVATE_KEY && typeof fileConfig.PRIVATE_KEY === 'object') {
        if (!this.password) {
          this.password = await this.promptPassword();
        }
        
        const decrypted = decryptWithPassword(fileConfig.PRIVATE_KEY as EncryptedData, this.password);
        return decrypted;
      }
    } catch (error) {
      console.error('❌ Failed to decrypt private key. Wrong password?');
      throw error;
    }
    
    return undefined;
  }

  private loadFromEnv() {
    if (process.env.PRIVATE_KEY) this.config.PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (process.env.DEMOS_RPC) this.config.DEMOS_RPC = process.env.DEMOS_RPC;
    if (process.env.REFERRAL_CODE) this.config.REFERRAL_CODE = process.env.REFERRAL_CODE;
  }

  private loadFromCommandLine() {
    const args = process.argv;
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--config' && i + 1 < args.length) {
        const configArg = args[i + 1];
        
        // Parse key=value format
        if (configArg.includes('=')) {
          const [key, value] = configArg.split('=', 2);
          
          switch (key.toLowerCase()) {
            case 'private_key':
              this.config.PRIVATE_KEY = value;
              break;
            case 'demos_rpc':
            case 'demos_rpc_url':
              this.config.DEMOS_RPC = value;
              break;
            case 'referral_code':
              this.config.REFERRAL_CODE = value;
              break;
            default:
              console.warn(`Warning: Unknown config key: ${key}`);
          }
        }
      }
    }
  }

  public async get(key: keyof DemosConfig): Promise<string | undefined> {
    if (key === 'PRIVATE_KEY' && this.isConfigEncrypted) {
      return await this.getDecryptedPrivateKey();
    }
    return this.config[key];
  }

  public getSync(key: keyof DemosConfig): string | undefined {
    if (key === 'PRIVATE_KEY' && this.isConfigEncrypted) {
      throw new Error('Private key is encrypted. Use async get() method or provide password.');
    }
    return this.config[key];
  }

  public getAll(): DemosConfig {
    return { ...this.config };
  }

  public createConfigFile(config: DemosConfig) {
    try {
      // Create config directory if it doesn't exist
      const configDir = join(homedir(), '.config', 'demos');
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      // Write config file
      writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      console.log(`✅ Config file created: ${this.configPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to create config file: ${error.message}`);
      return false;
    }
  }

  public showConfigSources() {
    console.log('📋 Configuration sources (in order of priority):');
    console.log(`1. Command line: --config key=value`);
    console.log(`2. Environment: .env file`);
    console.log(`3. Config file: ${this.configPath}`);
    console.log('');
    console.log('📄 Current configuration:');
    
    const sources = this.getConfigSources();
    Object.entries(sources).forEach(([key, info]) => {
      const value = info.value ? (key === 'PRIVATE_KEY' ? '***hidden***' : info.value) : 'not set';
      console.log(`   ${key}: ${value} (from ${info.source})`);
    });
  }

  private getConfigSources(): Record<string, { value?: string; source: string }> {
    const result: Record<string, { value?: string; source: string }> = {};
    
    // Check each config key and determine its source
    ['PRIVATE_KEY', 'DEMOS_RPC', 'REFERRAL_CODE'].forEach(key => {
      const envKey = key as keyof DemosConfig;
      
      // Check command line first
      const originalArgv = process.argv;
      let fromCommandLine = false;
      for (let i = 0; i < originalArgv.length; i++) {
        if (originalArgv[i] === '--config' && i + 1 < originalArgv.length) {
          const configArg = originalArgv[i + 1];
          if (configArg.includes('=')) {
            const [argKey] = configArg.split('=', 2);
            if (argKey.toLowerCase() === key.toLowerCase() || 
                (argKey.toLowerCase() === 'demos_rpc_url' && key === 'DEMOS_RPC')) {
              fromCommandLine = true;
              break;
            }
          }
        }
      }

      if (fromCommandLine) {
        result[key] = { value: this.config[envKey], source: 'command line' };
      } else if (process.env[key] && this.config[envKey] === process.env[key]) {
        result[key] = { value: this.config[envKey], source: 'environment (.env)' };
      } else if (this.config[envKey]) {
        result[key] = { value: this.config[envKey], source: 'config file' };
      } else {
        result[key] = { source: 'not set' };
      }
    });

    return result;
  }

  public get configFilePath(): string {
    return this.configPath;
  }

  public async applyEnvToConfig(): Promise<boolean> {
    try {
      console.log('📋 Applying .env settings to config file...');
      
      // Check if .env exists
      if (!existsSync('.env')) {
        console.log('❌ No .env file found in current directory');
        return false;
      }

      // Get current .env values
      const envPrivateKey = process.env.PRIVATE_KEY;
      const envDemosRpc = process.env.DEMOS_RPC;
      const envReferralCode = process.env.REFERRAL_CODE;

      if (!envPrivateKey && !envDemosRpc && !envReferralCode) {
        console.log('❌ No relevant settings found in .env file');
        return false;
      }

      // Get current config
      const currentConfig = this.getAll();
      const newConfig = {
        PRIVATE_KEY: envPrivateKey || currentConfig.PRIVATE_KEY || '',
        DEMOS_RPC: envDemosRpc || currentConfig.DEMOS_RPC || 'https://node2.demos.sh',
        REFERRAL_CODE: envReferralCode || currentConfig.REFERRAL_CODE || ''
      };

      console.log('🔐 Encrypting private key...');
      const password = await this.promptPassword();
      
      const success = await this.createEncryptedConfigFile(newConfig, password);
      
      if (success) {
        console.log('🗑️  Removing .env file...');
        unlinkSync('.env');
        console.log('✅ Successfully applied .env to encrypted config and removed .env file');
        console.log('   Your private key is now encrypted and secure!');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to apply .env to config:', error.message);
      return false;
    }
  }

  public async useConfigOverEnv(): Promise<boolean> {
    try {
      console.log('📋 Using config file over .env...');
      
      if (!existsSync(this.configPath)) {
        console.log('❌ No config file found. Run: demostools config init');
        return false;
      }

      if (existsSync('.env')) {
        console.log('📁 Backing up .env as .env.backup...');
        writeFileSync('.env.backup', readFileSync('.env'));
        unlinkSync('.env');
      }

      console.log('✅ Config file will now take precedence');
      console.log('   .env file has been removed/backed up');
      console.log('   Run "demostools config show" to verify settings');

      return true;
    } catch (error) {
      console.error('❌ Failed to prioritize config:', error.message);
      return false;
    }
  }

  public async createEncryptedConfigFile(config: DemosConfig, password: string): Promise<boolean> {
    try {
      // Create config directory if it doesn't exist
      const configDir = join(homedir(), '.config', 'demos');
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      // Encrypt private key if provided
      const configFile: ConfigFile = {
        DEMOS_RPC: config.DEMOS_RPC,
        REFERRAL_CODE: config.REFERRAL_CODE,
        encrypted: true
      };

      if (config.PRIVATE_KEY) {
        configFile.PRIVATE_KEY = encryptWithPassword(config.PRIVATE_KEY, password);
      }

      // Write encrypted config file
      writeFileSync(this.configPath, JSON.stringify(configFile, null, 2));
      console.log(`✅ Encrypted config file created: ${this.configPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to create encrypted config file: ${error.message}`);
      return false;
    }
  }
}

// Export singleton instance
export const configManager = new ConfigManager();

// Convenience functions
export async function getConfig(key: keyof DemosConfig): Promise<string | undefined> {
  return await configManager.get(key);
}

export function getConfigSync(key: keyof DemosConfig): string | undefined {
  return configManager.getSync(key);
}

export function getAllConfig(): DemosConfig {
  return configManager.getAll();
}

export function showConfig() {
  configManager.showConfigSources();
}

export async function applyEnvToConfig(): Promise<boolean> {
  return await configManager.applyEnvToConfig();
}

export async function useConfigOverEnv(): Promise<boolean> {
  return await configManager.useConfigOverEnv();
}