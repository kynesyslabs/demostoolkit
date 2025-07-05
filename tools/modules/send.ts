import { websdk } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class SendTool extends DemosTool {
  constructor() {
    super('send');
  }

  protected showUsage(): void {
    console.error('Usage: demostools send <amount> <address>');
    console.error('');
    console.error('Arguments:');
    console.error('  amount    Amount of DEM to send');
    console.error('  address   Recipient address');
    console.error('');
    console.error('Examples:');
    console.error('  demostools send 10.5 demo1abc123...');
    console.error('  demostools send 1 demo1xyz789...');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 2, 'send')) {
      return false;
    }

    if (!ValidationHelper.isValidAmount(args[0])) {
      console.error(`❌ Invalid amount: ${args[0]}`);
      return false;
    }

    if (!ValidationHelper.isValidAddress(args[1])) {
      console.error(`❌ Invalid address: ${args[1]}`);
      return false;
    }

    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const amount = parseFloat(args[0]);
    const toAddress = args[1];

    this.logger.info('Starting token send', { amount, toAddress });
    
    // Load private key and RPC URL
    const privateKey = await this.loadPrivateKey();
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Connect wallet
    const fromAddress = await demos.connectWallet(privateKey);
    this.logger.info(`Wallet connected: ${fromAddress}`);
    
    // Check balance
    const fromInfo = await demos.getAddressInfo(fromAddress);
    const balance = fromInfo.balance;
    
    console.log(`💰 Current balance: ${balance} DEM`);
    
    if (balance < amount) {
      throw new Error(`Insufficient balance. You have ${balance} DEM, but trying to send ${amount} DEM`);
    }
    
    // Get nonce
    const nonce = await demos.getNonce(fromAddress);
    this.logger.info(`Current nonce: ${nonce}`);
    
    // Send transaction
    this.logger.info('Sending transaction...');
    const txHash = await demos.send(toAddress, amount, nonce);
    
    const result = {
      transactionHash: txHash,
      fromAddress,
      toAddress,
      amount,
      balance,
      nonce,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('✅ Transaction sent successfully');
    console.log('');
    console.log('📋 Transaction Details:');
    console.log(`   From: ${fromAddress}`);
    console.log(`   To: ${toAddress}`);
    console.log(`   Amount: ${amount} DEM`);
    console.log(`   Transaction Hash: ${txHash}`);
    console.log(`   Nonce: ${nonce}`);
    console.log('');
    console.log('⏱️  Transaction submitted to mempool. Check status with:');
    console.log(`   demostools get-transaction ${txHash}`);
    
    return { success: true, data: result };
  }
}

// Export tool instance for use in demostools.ts
export const sendTool = new SendTool();