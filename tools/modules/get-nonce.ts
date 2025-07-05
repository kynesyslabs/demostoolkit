import { websdk } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class GetNonceTool extends DemosTool {
  constructor() {
    super('get_nonce');
  }

  protected showUsage(): void {
    console.error('Usage: demostools get-nonce <address>');
    console.error('');
    console.error('Arguments:');
    console.error('  address   Address to check nonce for');
    console.error('');
    console.error('Examples:');
    console.error('  demostools get-nonce demo1abc123...');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 1, 'get-nonce')) {
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

    this.logger.info('Getting nonce', { address });
    
    // Get RPC URL (no private key needed)
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Get nonce
    const nonce = await demos.getNonce(address);
    
    const result = {
      address,
      nonce,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('🔢 Address Nonce Information');
    console.log('');
    console.log(`📍 Address: ${address}`);
    console.log(`🔢 Current Nonce: ${nonce}`);
    console.log(`⏰ Checked: ${result.timestamp}`);
    
    return { success: true, data: result };
  }
}

export const getNonceTool = new GetNonceTool();