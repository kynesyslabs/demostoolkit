import { websdk } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class GetTransactionTool extends DemosTool {
  constructor() {
    super('get_transaction');
  }

  protected showUsage(): void {
    console.error('Usage: demostools get-transaction <hash>');
    console.error('');
    console.error('Arguments:');
    console.error('  hash   Transaction hash to lookup');
    console.error('');
    console.error('Examples:');
    console.error('  demostools get-transaction 0xabc123...');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 1, 'get-transaction')) {
      return false;
    }

    const hash = args[0];
    if (!hash || hash.length < 10) {
      console.error('❌ Invalid transaction hash');
      return false;
    }

    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const txHash = args[0];

    this.logger.info('Getting transaction', { txHash });
    
    // Get RPC URL (no private key needed)
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Get transaction
    const transaction = await demos.getTransaction(txHash);
    
    const result = {
      transactionHash: txHash,
      transaction,
      rpcUrl,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('📝 Transaction Information');
    console.log('');
    console.log(`🔗 RPC: ${rpcUrl}`);
    console.log(`📋 Transaction Hash: ${txHash}`);
    console.log('');
    console.log('📊 Transaction Data:');
    console.log(JSON.stringify(transaction, null, 2));
    console.log('');
    console.log(`⏰ Retrieved: ${result.timestamp}`);
    
    return { success: true, data: result };
  }
}

export const getTransactionTool = new GetTransactionTool();