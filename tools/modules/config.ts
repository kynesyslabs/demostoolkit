import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';
import { configManager, showConfig, applyEnvToConfig, useConfigOverEnv } from '../utils/config';

export class ConfigTool extends DemosTool {
  constructor() {
    super('config_tool');
  }

  protected showUsage(): void {
    console.error('Usage: demostools config <operation>');
    console.error('');
    console.error('Operations:');
    console.error('  show        Show current configuration and sources');
    console.error('  init        Create/update configuration file');
    console.error('  apply-env   Apply .env settings to encrypted config file (removes .env)');
    console.error('  use-config  Use config file over .env (backs up .env)');
    console.error('');
    console.error('Examples:');
    console.error('  demostools config show');
    console.error('  demostools config init');
    console.error('  demostools config apply-env');
    console.error('  demostools config use-config');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 1, 'config')) {
      return false;
    }

    const operation = args[0];
    if (!['show', 'init', 'apply-env', 'use-config'].includes(operation)) {
      console.error(`❌ Invalid operation: ${operation}`);
      console.error('Valid operations: show, init, apply-env, use-config');
      return false;
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

  protected async execute(args: string[]): Promise<ToolResult> {
    const operation = args[0];

    this.logger.info(`Config operation: ${operation}`);

    switch (operation) {
      case 'show':
        return await this.showCurrentConfig();
      
      case 'init':
        return await this.initConfig();
      
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