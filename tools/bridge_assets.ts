import { websdk, bridge } from '@kynesyslabs/demosdk';
import { config } from 'dotenv';
import { Logger } from './utils/logger';

process.env.DOTENV_CONFIG_DEBUG = 'false';
config();

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const DEMOS_RPC = process.env.DEMOS_RPC!;
const logger = new Logger('bridge_assets');

async function bridgeWithRubic(
  fromChain: string,
  toChain: string, 
  fromToken: string,
  toToken: string,
  amount: string
) {
  try {
    logger.info(`Starting Rubic bridge operation`, {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount
    });
    
    const demos = new websdk.Demos();
    await demos.connect(DEMOS_RPC);
    logger.info(`Connected to RPC: ${DEMOS_RPC}`);
    
    await demos.connectWallet(PRIVATE_KEY);
    const address = demos.getAddress();
    logger.info(`Wallet connected: ${address}`);
    
    // Create Rubic bridge instance
    const rubicBridge = new bridge.RubicBridge();
    
    // Prepare bridge trade payload
    const tradePayload: bridge.BridgeTradePayload = {
      fromChain: fromChain as any,
      toChain: toChain as any,
      fromToken,
      toToken,
      amount,
      fromAddress: address,
      toAddress: address,
      referrer: address
    };
    
    logger.info(`Preparing bridge trade`, tradePayload);
    
    // Get available bridge routes
    const routes = await rubicBridge.getBridgeRoutes(tradePayload);
    logger.info(`Found ${routes.length} bridge routes`, { routeCount: routes.length });
    
    if (routes.length === 0) {
      throw new Error('No bridge routes available for this trade');
    }
    
    // Use the first available route
    const selectedRoute = routes[0];
    logger.info(`Selected bridge route`, {
      type: selectedRoute.type,
      provider: selectedRoute.bridgeType
    });
    
    // Execute the bridge transaction
    const bridgeResult = await rubicBridge.executeBridge(selectedRoute);
    
    const result = {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      fromAddress: address,
      selectedRoute: {
        type: selectedRoute.type,
        bridgeType: selectedRoute.bridgeType
      },
      bridgeResult,
      timestamp: new Date().toISOString()
    };
    
    logger.success('Rubic bridge operation completed successfully', result);
    
    return result;
  } catch (error) {
    logger.error('Error in Rubic bridge operation', error);
    throw error;
  }
}

async function bridgeWithNative(
  sourceChain: string,
  targetChain: string,
  stablecoin: string,
  amount: string
) {
  try {
    logger.info(`Starting native bridge operation`, {
      sourceChain,
      targetChain,
      stablecoin,
      amount
    });
    
    const demos = new websdk.Demos();
    await demos.connect(DEMOS_RPC);
    logger.info(`Connected to RPC: ${DEMOS_RPC}`);
    
    await demos.connectWallet(PRIVATE_KEY);
    const address = demos.getAddress();
    logger.info(`Wallet connected: ${address}`);
    
    // Check if chains are supported
    if (!bridge.NativeBridgeSupportedChains.includes(sourceChain as any)) {
      throw new Error(`Source chain not supported: ${sourceChain}`);
    }
    
    if (!bridge.NativeBridgeSupportedChains.includes(targetChain as any)) {
      throw new Error(`Target chain not supported: ${targetChain}`);
    }
    
    if (!bridge.NativeBridgeSupportedStablecoins.includes(stablecoin as any)) {
      throw new Error(`Stablecoin not supported: ${stablecoin}`);
    }
    
    logger.info(`Using native bridge methods`);
    
    // Create native bridge operation
    const bridgeOperation: bridge.NativeBridgeOperation = {
      sourceChain: sourceChain as any,
      targetChain: targetChain as any,
      stablecoin: stablecoin as any,
      amount: parseFloat(amount),
      sourceAddress: address,
      targetAddress: address
    };
    
    // Compile the bridge operation
    const compiledOperation = await bridge.NativeBridgeMethods.compile(bridgeOperation);
    
    logger.info(`Bridge operation compiled`, compiledOperation);
    
    // Execute the native bridge
    const bridgeResult = await bridge.NativeBridgeMethods.execute(compiledOperation);
    
    const result = {
      sourceChain,
      targetChain,
      stablecoin,
      amount,
      sourceAddress: address,
      targetAddress: address,
      compiledOperation,
      bridgeResult,
      timestamp: new Date().toISOString()
    };
    
    logger.success('Native bridge operation completed successfully', result);
    
    return result;
  } catch (error) {
    logger.error('Error in native bridge operation', error);
    throw error;
  }
}

async function getSupportedOptions() {
  try {
    logger.info('Getting supported bridge options');
    
    const result = {
      rubic: {
        supportedChains: Object.values(bridge.SupportedChains),
        supportedTokens: Object.values(bridge.SupportedTokens)
      },
      native: {
        supportedChains: bridge.NativeBridgeSupportedChains,
        supportedStablecoins: bridge.NativeBridgeSupportedStablecoins,
        supportedEVMChains: bridge.NativeBridgeSupportedEVMChains,
        usdcContracts: bridge.NativeBridgeUSDCContracts
      },
      timestamp: new Date().toISOString()
    };
    
    logger.success('Supported bridge options retrieved', result);
    
    return result;
  } catch (error) {
    logger.error('Error getting supported options', error);
    throw error;
  }
}

if (process.argv.length < 3) {
  console.error('Usage: bun bridge_assets.ts <rubic|native|options> [args...]');
  console.error('');
  console.error('Rubic bridge examples:');
  console.error('  bun bridge_assets.ts rubic ETHEREUM POLYGON ETH MATIC 0.1');
  console.error('');
  console.error('Native bridge examples:');
  console.error('  bun bridge_assets.ts native ethereum polygon USDC 100');
  console.error('');
  console.error('Get supported options:');
  console.error('  bun bridge_assets.ts options');
  process.exit(1);
}

const operation = process.argv[2];

logger.info(`Script started`, { operation, args: process.argv.slice(3) });

if (operation === 'rubic') {
  if (process.argv.length < 8) {
    console.error('Usage: bun bridge_assets.ts rubic <fromChain> <toChain> <fromToken> <toToken> <amount>');
    process.exit(1);
  }
  
  const fromChain = process.argv[3];
  const toChain = process.argv[4];
  const fromToken = process.argv[5];
  const toToken = process.argv[6];
  const amount = process.argv[7];
  
  bridgeWithRubic(fromChain, toChain, fromToken, toToken, amount).catch((error) => {
    logger.error('Script failed', error);
    process.exit(1);
  });
  
} else if (operation === 'native') {
  if (process.argv.length < 7) {
    console.error('Usage: bun bridge_assets.ts native <sourceChain> <targetChain> <stablecoin> <amount>');
    process.exit(1);
  }
  
  const sourceChain = process.argv[3];
  const targetChain = process.argv[4];
  const stablecoin = process.argv[5];
  const amount = process.argv[6];
  
  bridgeWithNative(sourceChain, targetChain, stablecoin, amount).catch((error) => {
    logger.error('Script failed', error);
    process.exit(1);
  });
  
} else if (operation === 'options') {
  getSupportedOptions().catch((error) => {
    logger.error('Script failed', error);
    process.exit(1);
  });
  
} else {
  console.error('Invalid operation. Use: rubic, native, or options');
  process.exit(1);
}