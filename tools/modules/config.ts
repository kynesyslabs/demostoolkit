import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';
import { configManager, showConfig, applyEnvToConfig, useConfigOverEnv } from '../utils/config';

export class ConfigTool extends DemosTool {
  constructor() {
    super('config_tool');
  }

  protected showUsage(): void {
    console.error('Usage: demostools config <operation> [options]');
    console.error('');
    console.error('Operations:');
    console.error('  show                    Show current configuration and sources');
    console.error('  init                    Create/update configuration file');
    console.error('  set <key> <value>       Set a configuration value');
    console.error('  get <key>               Get a configuration value');
    console.error('  set-rpc <url>           Set RPC endpoint (shorthand for set DEMOS_RPC)');
    console.error('  list-rpcs               Show available RPC endpoints');
    console.error('  apply-env               Apply .env settings to encrypted config file (removes .env)');
    console.error('  use-config              Use config file over .env (backs up .env)');
    console.error('');
    console.error('Configuration Keys:');
    console.error('  PRIVATE_KEY             Wallet mnemonic/private key');
    console.error('  DEMOS_RPC               RPC endpoint URL');
    console.error('  REFERRAL_CODE           Referral code for identity operations');
    console.error('');
    console.error('Examples:');
    console.error('  demostools config show');
    console.error('  demostools config init');
    console.error('  demostools config set-rpc https://node2.demos.sh');
    console.error('  demostools config set REFERRAL_CODE YOUR_CODE');
    console.error('  demostools config get DEMOS_RPC');
    console.error('  demostools config list-rpcs');
  }

  protected validateArgs(args: string[]): boolean {
    // Handle help requests
    if (args.length === 0 || ['--help', '-h', 'help'].includes(args[0])) {
      this.showUsage();
      return false;
    }

    const operation = args[0];
    const validOperations = ['show', 'init', 'set', 'get', 'set-rpc', 'list-rpcs', 'apply-env', 'use-config'];
    
    if (!validOperations.includes(operation)) {
      console.error(`❌ Invalid operation: ${operation}`);
      console.error(`Valid operations: ${validOperations.join(', ')}`);
      return false;
    }

    // Validate operation-specific arguments
    switch (operation) {
      case 'set':
        if (args.length < 3) {
          console.error('❌ set requires: demostools config set <key> <value>');
          return false;
        }
        break;
      
      case 'get':
        if (args.length < 2) {
          console.error('❌ get requires: demostools config get <key>');
          return false;
        }
        break;
      
      case 'set-rpc':
        if (args.length < 2) {
          console.error('❌ set-rpc requires: demostools config set-rpc <url>');
          return false;
        }
        break;
    }

    return true;
  }

  private async showCurrentConfig(): Promise<ToolResult> {
    this.logger.info('Displaying current configuration');
    showConfig();
    return { success: true, data: { operation: 'show' } };
  }

  private async initConfig(): Promise<ToolResult> {
    this.logger.info('Initializing configuration file');
    
    console.log('🔧 Creating Demos configuration file...');
    console.log('');
    
    // Check if config file already exists
    const configPath = configManager.configFilePath;
    console.log(`📁 Config location: ${configPath}`);
    
    // Get current config to preserve any existing values
    const currentConfig = configManager.getAll();
    
    console.log('');
    console.log('📋 Current settings:');
    console.log(`   PRIVATE_KEY: ${currentConfig.PRIVATE_KEY ? '***set***' : 'not set'}`);
    console.log(`   DEMOS_RPC: ${currentConfig.DEMOS_RPC || 'not set'}`);
    console.log(`   REFERRAL_CODE: ${currentConfig.REFERRAL_CODE || 'not set'}`);
    
    // Create default config with current values or defaults
    const defaultConfig = {
      PRIVATE_KEY: currentConfig.PRIVATE_KEY || "",
      DEMOS_RPC: currentConfig.DEMOS_RPC || "https://node2.demos.sh",
      REFERRAL_CODE: currentConfig.REFERRAL_CODE || ""
    };
    
    const success = configManager.createConfigFile(defaultConfig);
    
    if (success) {
      console.log('');
      console.log('📝 Next steps:');
      console.log(`1. Edit the config file: ${configPath}`);
      console.log('2. Add your wallet mnemonic to PRIVATE_KEY');
      console.log('3. Verify settings: demostools config show');
      console.log('');
      console.log('💡 Config priority order:');
      console.log('   Command line > Environment (.env) > Config file');
      
      this.logger.success('Configuration file initialized successfully');
    }
    
    return { 
      success, 
      data: { 
        operation: 'init', 
        configPath, 
        currentConfig: { ...currentConfig, PRIVATE_KEY: currentConfig.PRIVATE_KEY ? '***hidden***' : undefined }
      } 
    };
  }

  private async applyEnv(): Promise<ToolResult> {
    this.logger.info('Applying .env to config');
    const success = await applyEnvToConfig();
    return { 
      success, 
      data: { operation: 'apply-env' } 
    };
  }

  private async useConfig(): Promise<ToolResult> {
    this.logger.info('Using config over .env');
    const success = await useConfigOverEnv();
    return { 
      success, 
      data: { operation: 'use-config' } 
    };
  }

  private async setValue(args: string[]): Promise<ToolResult> {
    const key = args[1];
    const value = args.slice(2).join(' '); // Allow spaces in values
    
    this.logger.info(`Setting config value: ${key}`);
    
    const validKeys = ['PRIVATE_KEY', 'DEMOS_RPC', 'REFERRAL_CODE'];
    if (!validKeys.includes(key)) {
      console.error(`❌ Invalid configuration key: ${key}`);
      console.error(`Valid keys: ${validKeys.join(', ')}`);
      return { success: false, data: { operation: 'set', key, error: 'Invalid key' } };
    }
    
    // Special handling for sensitive keys
    if (key === 'PRIVATE_KEY') {
      console.log('🔐 Setting private key...');
      console.log('⚠️  Make sure this is a secure environment!');
    }
    
    const currentConfig = configManager.getAll();
    const newConfig = { ...currentConfig, [key]: value };
    
    const success = configManager.createConfigFile(newConfig);
    
    if (success) {
      const displayValue = key === 'PRIVATE_KEY' ? '***set***' : value;
      console.log(`✅ ${key} set to: ${displayValue}`);
      this.logger.success(`Configuration value ${key} updated`);
    } else {
      console.error(`❌ Failed to update ${key}`);
    }
    
    return { 
      success, 
      data: { 
        operation: 'set', 
        key,
        value: key === 'PRIVATE_KEY' ? '***hidden***' : value
      } 
    };
  }

  private async getValue(args: string[]): Promise<ToolResult> {
    const key = args[1];
    
    this.logger.info(`Getting config value: ${key}`);
    
    const config = configManager.getAll();
    const value = config[key as keyof typeof config];
    
    if (value === undefined) {
      console.log(`❌ ${key} is not set`);
      return { success: false, data: { operation: 'get', key, error: 'Key not set' } };
    }
    
    const displayValue = key === 'PRIVATE_KEY' ? '***set***' : value;
    console.log(`${key}: ${displayValue}`);
    
    return { 
      success: true, 
      data: { 
        operation: 'get', 
        key,
        value: key === 'PRIVATE_KEY' ? '***hidden***' : value
      } 
    };
  }

  private async setRpc(args: string[]): Promise<ToolResult> {
    const rpcUrl = args[1];
    
    this.logger.info(`Setting RPC endpoint: ${rpcUrl}`);
    
    // Basic URL validation
    try {
      new URL(rpcUrl);
    } catch {
      console.error(`❌ Invalid URL format: ${rpcUrl}`);
      return { success: false, data: { operation: 'set-rpc', url: rpcUrl, error: 'Invalid URL' } };
    }
    
    const currentConfig = configManager.getAll();
    const newConfig = { ...currentConfig, DEMOS_RPC: rpcUrl };
    
    const success = configManager.createConfigFile(newConfig);
    
    if (success) {
      console.log(`✅ RPC endpoint set to: ${rpcUrl}`);
      console.log('💡 Test the connection with: demostools network-info');
      this.logger.success('RPC endpoint updated');
    } else {
      console.error('❌ Failed to update RPC endpoint');
    }
    
    return { 
      success, 
      data: { 
        operation: 'set-rpc', 
        url: rpcUrl
      } 
    };
  }

  private async listRpcs(): Promise<ToolResult> {
    this.logger.info('Listing available RPC endpoints');
    
    console.log('🌐 Available Demos RPC Endpoints:');
    console.log('');
    console.log('🏠 Official Endpoints:');
    console.log('   https://node2.demos.sh          (Primary)');
    console.log('   https://node.demos.sh           (Alternative)');
    console.log('');
    console.log('🧪 Development Endpoints:');
    console.log('   http://localhost:8545           (Local development)');
    console.log('   http://127.0.0.1:8545           (Local development)');
    console.log('');
    console.log('💡 Usage:');
    console.log('   demostools config set-rpc <url>');
    console.log('');
    
    const currentConfig = configManager.getAll();
    const currentRpc = currentConfig.DEMOS_RPC || 'not set';
    console.log(`📍 Current RPC: ${currentRpc}`);
    
    return { 
      success: true, 
      data: { 
        operation: 'list-rpcs',
        currentRpc,
        endpoints: [
          'https://node2.demos.sh',
          'https://node.demos.sh',
          'http://localhost:8545',
          'http://127.0.0.1:8545'
        ]
      } 
    };
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const operation = args[0];

    this.logger.info(`Config operation: ${operation}`);

    switch (operation) {
      case 'show':
        return await this.showCurrentConfig();
      
      case 'init':
        return await this.initConfig();
      
      case 'set':
        return await this.setValue(args);
      
      case 'get':
        return await this.getValue(args);
      
      case 'set-rpc':
        return await this.setRpc(args);
      
      case 'list-rpcs':
        return await this.listRpcs();
      
      case 'apply-env':
        return await this.applyEnv();
      
      case 'use-config':
        return await this.useConfig();
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}

export const configTool = new ConfigTool();