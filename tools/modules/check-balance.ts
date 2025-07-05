import { websdk } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class CheckBalanceTool extends DemosTool {
  constructor() {
    super('check_balance');
  }

  protected showUsage(): void {
    console.error('Usage: demostools check-balance <address>');
    console.error('');
    console.error('Arguments:');
    console.error('  address   Address to check balance for');
    console.error('');
    console.error('Examples:');
    console.error('  demostools check-balance demo1abc123...');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 1, 'check-balance')) {
      return false;
    }

    if (!ValidationHelper.isValidAddress(args[0])) {
      console.error(`❌ Invalid address: ${args[0]}`);
      return false;
    }

    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const address = args[0];

    this.logger.info('Checking balance', { address });
    
    // Get RPC URL (no private key needed for balance check)
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Get address info
    const addressInfo = await demos.getAddressInfo(address);
    
    const result = {
      address,
      balance: addressInfo.balance,
      nonce: addressInfo.nonce,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('💰 Balance Information');
    console.log('');
    console.log(`📍 Address: ${address}`);
    console.log(`💰 Balance: ${addressInfo.balance} DEM`);
    console.log(`🔢 Nonce: ${addressInfo.nonce}`);
    console.log(`⏰ Checked: ${result.timestamp}`);
    
    return { success: true, data: result };
  }
}

// Export tool instance for use in demostools.ts  
export const checkBalanceTool = new CheckBalanceTool();