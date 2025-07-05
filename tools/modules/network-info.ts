import { websdk } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult } from '../utils/tool-framework';

export class NetworkInfoTool extends DemosTool {
  constructor() {
    super('network_info');
  }

  protected showUsage(): void {
    console.error('Usage: demostools network-info');
    console.error('');
    console.error('Description:');
    console.error('  Get network status and peer information');
    console.error('');
    console.error('Examples:');
    console.error('  demostools network-info');
  }

  protected validateArgs(args: string[]): boolean {
    // No arguments required
    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    this.logger.info('Getting network information');
    
    // Get RPC URL (no private key needed)
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Get network info
    const networkInfo = await demos.getNetworkInfo();
    
    const result = {
      networkInfo,
      rpcUrl,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('🌐 Network Information');
    console.log('');
    console.log(`🔗 RPC: ${rpcUrl}`);
    console.log(`📊 Network Data:`);
    console.log(JSON.stringify(networkInfo, null, 2));
    console.log('');
    console.log(`⏰ Retrieved: ${result.timestamp}`);
    
    return { success: true, data: result };
  }
}

export const networkInfoTool = new NetworkInfoTool();