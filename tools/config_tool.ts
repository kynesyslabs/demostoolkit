import { configManager, showConfig, applyEnvToConfig, useConfigOverEnv } from './utils/config';
import { Logger } from './utils/logger';

const logger = new Logger('config_tool');

async function showCurrentConfig() {
  try {
    logger.info('Displaying current configuration');
    showConfig();
    return true;
  } catch (error) {
    logger.error('Error showing configuration', error);
    throw error;
  }
}

async function initConfig() {
  try {
    logger.info('Initializing configuration file');
    
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
      
      logger.success('Configuration file initialized successfully');
    }
    
    return success;
  } catch (error) {
    logger.error('Error initializing configuration', error);
    throw error;
  }
}

// Find the actual operation (skip --config arguments)
let operation = '';
const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--config' && i + 1 < args.length) {
    i++; // Skip the config value
  } else if (!operation) {
    operation = args[i];
    break;
  }
}

if (!operation) {
  console.error('Usage: bun config_tool.ts <show|init|apply-env|use-config>');
  console.error('');
  console.error('Commands:');
  console.error('  show        Show current configuration and sources');
  console.error('  init        Create/update configuration file');
  console.error('  apply-env   Apply .env settings to encrypted config file (removes .env)');
  console.error('  use-config  Use config file over .env (backs up .env)');
  process.exit(1);
}

logger.info(`Config tool started with operation: ${operation}`);

if (operation === 'show') {
  showCurrentConfig().catch((error) => {
    logger.error('Config show failed', error);
    process.exit(1);
  });
  
} else if (operation === 'init') {
  initConfig().catch((error) => {
    logger.error('Config init failed', error);
    process.exit(1);
  });

} else if (operation === 'apply-env') {
  logger.info('Applying .env to config');
  applyEnvToConfig().catch((error) => {
    logger.error('Apply env failed', error);
    process.exit(1);
  });

} else if (operation === 'use-config') {
  logger.info('Using config over .env');
  useConfigOverEnv().catch((error) => {
    logger.error('Use config failed', error);
    process.exit(1);
  });
  
} else {
  console.error(`❌ Unknown operation: ${operation}`);
  console.error('Use: show, init, apply-env, or use-config');
  process.exit(1);
}