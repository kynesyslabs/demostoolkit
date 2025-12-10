import { websdk, abstraction } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class AccountTool extends DemosTool {
  constructor() {
    super('account');
  }

  protected showUsage(): void {
    console.error('Usage: demostools account [address]');
    console.error('');
    console.error('Arguments:');
    console.error('  address   Address to get account info for (defaults to current keypair)');
    console.error('');
    console.error('Options:');
    console.error('  --output json     Output in JSON format');
    console.error('  --identities      Show detailed identity information');
    console.error('  --transactions    Show recent transaction list');
    console.error('');
    console.error('Examples:');
    console.error('  demostools account');
    console.error('  demostools account demo1abc123...');
    console.error('  demostools account demo1abc123... --output json');
    console.error('  demostools account --identities');
  }

  protected validateArgs(args: string[]): boolean {
    // Handle help request
    if (args.includes('--help') || args.includes('-h') || args.includes('help')) {
      this.showUsage();
      return false;
    }
    
    // Filter out flag arguments to get just the address
    const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));
    
    // Address is optional - if not provided, use connected wallet
    if (nonFlagArgs.length > 1) {
      console.error('❌ Too many arguments. Expected at most 1 address.');
      return false;
    }

    if (nonFlagArgs.length === 1 && !ValidationHelper.isValidAddress(nonFlagArgs[0])) {
      console.error(`❌ Invalid address: ${nonFlagArgs[0]}`);
      return false;
    }

    return true;
  }

  private hasFlag(flag: string): boolean {
    return process.argv.includes(flag);
  }

  private getFlagValue(flag: string): string | undefined {
    const index = process.argv.indexOf(flag);
    if (index !== -1 && index + 1 < process.argv.length) {
      return process.argv[index + 1];
    }
    return undefined;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    // Filter out flag arguments to get the actual address
    const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));
    let targetAddress = nonFlagArgs[0];
    const outputFormat = this.getFlagValue('--output') || 'display';
    const showIdentities = this.hasFlag('--identities');
    const showTransactions = this.hasFlag('--transactions');

    this.logger.info('Getting account information', { 
      targetAddress: targetAddress || 'current wallet',
      outputFormat,
      showIdentities,
      showTransactions 
    });
    
    // Get RPC URL and connect
    const rpcUrl = await this.getRpcUrl();
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // If no address provided, connect wallet and use that address
    if (!targetAddress) {
      const privateKey = await this.loadPrivateKey();
      targetAddress = await demos.connectWallet(privateKey);
      this.logger.info(`Using connected wallet address: ${targetAddress}`);
    }
    
    // Get comprehensive account information
    const addressInfo = await demos.getAddressInfo(targetAddress);
    
    // Get enhanced account data if available
    let accountData;
    let identities;
    try {
      // Try to get full account data from GLS if available
      accountData = await demos.rpcCall('getAccountData', { address: targetAddress });
    } catch (error) {
      this.logger.info('Full account data not available, using basic address info');
    }

    // Get identities if requested or available
    if (showIdentities || accountData?.identities) {
      try {
        const identityManager = new abstraction.Identities();
        identities = {
          web2: await identityManager.getWeb2Identities(demos, targetAddress),
          web3: await identityManager.getXmIdentities(demos, targetAddress),
          points: await identityManager.getUserPoints(demos, targetAddress),
          referral: await identityManager.getReferralInfo(demos, targetAddress)
        };
      } catch (error) {
        this.logger.info('Identity information not available:', error.message);
      }
    }

    const result = {
      address: targetAddress,
      balance: addressInfo.native?.balance || addressInfo.balance,
      nonce: addressInfo.native?.nonce || addressInfo.nonce,
      addressInfo,
      accountData,
      identities,
      timestamp: new Date().toISOString()
    };

    // Output based on format
    if (outputFormat === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      this.displayAccountInfo(result, showIdentities, showTransactions);
    }
    
    return { success: true, data: result };
  }

  private displayAccountInfo(data: any, showIdentities: boolean, showTransactions: boolean): void {
    console.log('📋 Account Information');
    console.log('');
    
    // Basic info
    console.log(`📍 Address: ${data.address}`);
    console.log(`💰 Balance: ${data.balance} DEM`);
    console.log(`🔢 Nonce: ${data.nonce}`);
    
    // Account metadata if available
    if (data.accountData) {
      const acc = data.accountData;
      console.log('');
      console.log('📊 Account Details:');
      if (acc.createdAt) console.log(`   📅 Created: ${new Date(acc.createdAt).toLocaleString()}`);
      if (acc.updatedAt) console.log(`   🔄 Updated: ${new Date(acc.updatedAt).toLocaleString()}`);
      if (acc.assignedTxs) console.log(`   📝 Transactions: ${acc.assignedTxs.length}`);
      if (acc.flagged !== undefined) {
        const flagStatus = acc.flagged ? '🚩 Flagged' : '✅ Clear';
        console.log(`   🛡️  Status: ${flagStatus}`);
        if (acc.flagged && acc.flaggedReason) {
          console.log(`   ⚠️  Reason: ${acc.flaggedReason}`);
        }
      }
    }

    // Identity information
    if (showIdentities && data.identities) {
      console.log('');
      console.log('🆔 Identity Information:');
      
      // Web2 identities
      if (data.identities.web2?.result) {
        console.log('   🌐 Web2 Identities:');
        const web2Identities = data.identities.web2.result;
        if (web2Identities.github?.length > 0) {
          console.log(`      🔗 GitHub: ${web2Identities.github.join(', ')}`);
        }
        if (web2Identities.twitter?.length > 0) {
          console.log(`      🐦 Twitter: ${web2Identities.twitter.join(', ')}`);
        }
        if (web2Identities.discord?.length > 0) {
          console.log(`      💬 Discord: ${web2Identities.discord.join(', ')}`);
        }
        if (web2Identities.telegram?.length > 0) {
          console.log(`      📱 Telegram: ${web2Identities.telegram.join(', ')}`);
        }
      }
      
      // Web3 identities  
      if (data.identities.web3?.result && Object.keys(data.identities.web3.result).length > 0) {
        console.log('   ⛓️  Web3 Identities:');
        Object.entries(data.identities.web3.result).forEach(([chain, addresses]) => {
          if (Array.isArray(addresses) && addresses.length > 0) {
            console.log(`      ${chain}: ${addresses.join(', ')}`);
          }
        });
      }

      // Points and referral info
      if (data.identities.points?.result) {
        const points = data.identities.points.result;
        console.log('   🎯 Rewards:');
        console.log(`      Points: ${points.total || 0}`);
        if (points.breakdown) {
          Object.entries(points.breakdown).forEach(([source, amount]) => {
            console.log(`      ${source}: ${amount}`);
          });
        }
      }

      if (data.identities.referral?.result) {
        const referral = data.identities.referral.result;
        console.log('   👥 Referral:');
        console.log(`      Code: ${referral.code || 'None'}`);
        console.log(`      Referred: ${referral.referredCount || 0} users`);
        if (referral.totalEarned) {
          console.log(`      Earned: ${referral.totalEarned} points`);
        }
      }
    }

    // Recent transactions if requested
    if (showTransactions && data.accountData?.assignedTxs?.length > 0) {
      console.log('');
      console.log('📝 Recent Transactions:');
      data.accountData.assignedTxs.slice(-5).forEach((txHash: string) => {
        console.log(`   ${txHash}`);
      });
      if (data.accountData.assignedTxs.length > 5) {
        console.log(`   ... and ${data.accountData.assignedTxs.length - 5} more`);
      }
    }
    
    console.log('');
    console.log(`⏰ Retrieved: ${new Date(data.timestamp).toLocaleString()}`);
    
    // Usage hints
    if (!showIdentities && !showTransactions) {
      console.log('');
      console.log('💡 Use --identities to show identity information');
      console.log('   Use --transactions to show recent transactions');
      console.log('   Use --output json for machine-readable format');
    }
  }
}

// Export tool instance for use in demostools.ts  
export const accountTool = new AccountTool();