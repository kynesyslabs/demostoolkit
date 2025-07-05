import { websdk } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult } from '../utils/tool-framework';

export class GetBlockTool extends DemosTool {
  constructor() {
    super('get_latest_block');
  }

  protected showUsage(): void {
    console.error('Usage: demostools get-block');
    console.error('');
    console.error('Description:');
    console.error('  Get the latest block information from the network');
    console.error('');
    console.error('Examples:');
    console.error('  demostools get-block');
  }

  protected validateArgs(args: string[]): boolean {
    // No arguments required
    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    this.logger.info('Getting latest block information');
    
    // Get RPC URL (no private key needed)
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Get latest block number first
    const blockNumber = await demos.getLastBlockNumber();
    this.logger.info(`Latest block number: ${blockNumber}`);
    
    // Get latest block by number
    const latestBlock = await demos.getBlockByNumber(blockNumber);
    
    const result = {
      block: latestBlock,
      timestamp: new Date().toISOString(),
      rpcUrl
    };
    
    // Output result
    console.log('📦 Latest Block Information');
    console.log('');
    console.log(`🔗 RPC: ${rpcUrl}`);
    console.log(`📊 Block Data:`);
    console.log(JSON.stringify(latestBlock, null, 2));
    console.log('');
    console.log(`⏰ Retrieved: ${result.timestamp}`);
    
    return { success: true, data: result };
  }
}

export const getBlockTool = new GetBlockTool();