import { websdk } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult } from '../utils/tool-framework';

export class GetMempoolTool extends DemosTool {
  constructor() {
    super('get_mempool');
  }

  protected showUsage(): void {
    console.error('Usage: demostools get-mempool');
    console.error('');
    console.error('Description:');
    console.error('  View pending transactions in mempool');
    console.error('');
    console.error('Examples:');
    console.error('  demostools get-mempool');
  }

  protected validateArgs(args: string[]): boolean {
    // No arguments required
    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    this.logger.info('Getting mempool information');
    
    // Get RPC URL (no private key needed)
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Get mempool
    const mempool = await demos.getMempool();
    
    const result = {
      mempool,
      pendingCount: Array.isArray(mempool) ? mempool.length : 0,
      rpcUrl,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('🔄 Mempool Information');
    console.log('');
    console.log(`🔗 RPC: ${rpcUrl}`);
    console.log(`📊 Pending Transactions: ${result.pendingCount}`);
    console.log('');
    console.log('📋 Mempool Data:');
    console.log(JSON.stringify(mempool, null, 2));
    console.log('');
    console.log(`⏰ Retrieved: ${result.timestamp}`);
    
    return { success: true, data: result };
  }
}

export const getMempoolTool = new GetMempoolTool();