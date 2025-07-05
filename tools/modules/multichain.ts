import { xmcore, abstraction } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

// Supported chains for balance checking
const supportedChains = [
  'ethereum_mainnet',
  'bitcoin_mainnet', 
  'solana_mainnet',
  'multiversx_mainnet',
  'ton_mainnet',
  'near_mainnet',
  'xrpl_mainnet'
] as const;

type SupportedChain = typeof supportedChains[number];

export class MultichainTool extends DemosTool {
  constructor() {
    super('multichain');
  }

  protected showUsage(): void {
    console.error('Usage: demostools multichain <balance|wrapped> <address|sourceChain> [chains|targetChain]');
    console.error('');
    console.error('Balance examples:');
    console.error('  demostools multichain balance 0x742d35Cc6634C0532925a3b8D600C2F0ef7c5BB3');
    console.error('  demostools multichain balance bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh ethereum_mainnet,bitcoin_mainnet');
    console.error('');
    console.error('Wrapped token examples:');
    console.error('  demostools multichain wrapped BITCOIN ETHEREUM');
    console.error('  demostools multichain wrapped SOLANA ETHEREUM');
    console.error('');
    console.error('Supported chains: ethereum_mainnet, bitcoin_mainnet, solana_mainnet, multiversx_mainnet, ton_mainnet, near_mainnet, xrpl_mainnet');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 2, 'multichain')) {
      return false;
    }

    const operation = args[0];
    if (!['balance', 'wrapped'].includes(operation)) {
      console.error('❌ Invalid operation. Use: balance or wrapped');
      return false;
    }

    if (operation === 'balance') {
      const address = args[1];
      if (!address) {
        console.error('❌ Address is required for balance check');
        return false;
      }

      if (args[2]) {
        const chains = args[2].split(',').map(c => c.trim()) as SupportedChain[];
        for (const chain of chains) {
          if (!supportedChains.includes(chain)) {
            console.error(`❌ Unsupported chain: ${chain}`);
            console.error(`Supported chains: ${supportedChains.join(', ')}`);
            return false;
          }
        }
      }
    } else if (operation === 'wrapped') {
      if (!args[1] || !args[2]) {
        console.error('❌ Both source chain and target chain are required');
        return false;
      }
    }

    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const operation = args[0];
    
    if (operation === 'balance') {
      const address = args[1];
      const chainsArg = args[2];
      
      let chains: SupportedChain[] | undefined;
      if (chainsArg) {
        chains = chainsArg.split(',').map(c => c.trim()) as SupportedChain[];
      }
      
      const result = await this.getMultichainBalances(address, chains);
      
      console.log('✅ Multichain balance check completed');
      console.log('');
      console.log('📊 Balance Summary:');
      console.log(`   Address: ${result.address}`);
      console.log(`   Total Chains: ${result.totalChains}`);
      console.log(`   Successful: ${result.successfulChains}`);
      console.log(`   Failed: ${result.failedChains}`);
      console.log('');
      
      if (result.balances.length > 0) {
        console.log('💰 Balances:');
        result.balances.forEach(balance => {
          console.log(`   ${balance.chain}: ${balance.balance}`);
        });
        console.log('');
      }
      
      if (result.errors.length > 0) {
        console.log('⚠️  Errors:');
        result.errors.forEach(error => {
          console.log(`   ${error.chain}: ${error.error}`);
        });
        console.log('');
      }
      
      return { success: true, data: result };
      
    } else if (operation === 'wrapped') {
      const sourceChain = args[1];
      const targetChain = args[2];
      
      const result = await this.findWrappedTokens(sourceChain, targetChain);
      
      console.log('✅ Wrapped token search completed');
      console.log('');
      console.log('🔍 Search Results:');
      console.log(`   Source Chain: ${result.sourceChain}`);
      console.log(`   Target Chain: ${result.targetChain}`);
      console.log(`   Found: ${result.found ? 'Yes' : 'No'}`);
      if (result.found) {
        console.log(`   Token Address: ${result.wrappedTokenAddress}`);
      }
      console.log('');
      
      return { success: true, data: result };
    }
    
    return { success: false, error: 'Invalid operation' };
  }

  private async getMultichainBalances(address: string, chains?: SupportedChain[]) {
    try {
      const chainsToCheck = chains || supportedChains;
      this.logger.info(`Starting multichain balance check`, { address, chains: chainsToCheck });
      
      const balances: any[] = [];
      const errors: any[] = [];
      
      for (const chain of chainsToCheck) {
        try {
          this.logger.info(`Checking balance on ${chain}`);
        
        let balance = null;
        let chainInfo = null;
        
        switch (chain) {
          case 'ethereum_mainnet':
            try {
              const evm = new xmcore.EVM();
              const result = await evm.getBalance(address, { chain: 'ethereum' });
              balance = result.balance;
              chainInfo = { chain: 'ethereum', network: 'mainnet' };
            } catch (error) {
              this.logger.info(`EVM balance check failed for ${chain}`, { error: error.message });
            }
            break;
            
          case 'bitcoin_mainnet':
            try {
              const btc = new xmcore.BTC();
              const result = await btc.getBalance(address);
              balance = result.balance;
              chainInfo = { chain: 'bitcoin', network: 'mainnet' };
            } catch (error) {
              this.logger.info(`BTC balance check failed for ${chain}`, { error: error.message });
            }
            break;
            
          case 'solana_mainnet':
            try {
              const solana = new xmcore.SOLANA();
              const result = await solana.getBalance(address);
              balance = result.balance;
              chainInfo = { chain: 'solana', network: 'mainnet' };
            } catch (error) {
              this.logger.info(`Solana balance check failed for ${chain}`, { error: error.message });
            }
            break;
            
          case 'multiversx_mainnet':
            try {
              const mvx = new xmcore.MULTIVERSX();
              const result = await mvx.getBalance(address);
              balance = result.balance;
              chainInfo = { chain: 'multiversx', network: 'mainnet' };
            } catch (error) {
              this.logger.info(`MultiversX balance check failed for ${chain}`, { error: error.message });
            }
            break;
            
          case 'ton_mainnet':
            try {
              const ton = new xmcore.TON();
              const result = await ton.getBalance(address);
              balance = result.balance;
              chainInfo = { chain: 'ton', network: 'mainnet' };
            } catch (error) {
              this.logger.info(`TON balance check failed for ${chain}`, { error: error.message });
            }
            break;
            
          case 'near_mainnet':
            try {
              const near = new xmcore.NEAR();
              const result = await near.getBalance(address);
              balance = result.balance;
              chainInfo = { chain: 'near', network: 'mainnet' };
            } catch (error) {
              this.logger.info(`NEAR balance check failed for ${chain}`, { error: error.message });
            }
            break;
            
          case 'xrpl_mainnet':
            try {
              const xrpl = new xmcore.XRPL();
              const result = await xrpl.getBalance(address);
              balance = result.balance;
              chainInfo = { chain: 'xrpl', network: 'mainnet' };
            } catch (error) {
              this.logger.info(`XRPL balance check failed for ${chain}`, { error: error.message });
            }
            break;
            
          default:
            this.logger.info(`Unsupported chain: ${chain}`);
        }
        
        if (balance !== null && chainInfo) {
          const balanceInfo = {
            chain,
            ...chainInfo,
            address,
            balance,
            timestamp: new Date().toISOString()
          };
          
          balances.push(balanceInfo);
          this.logger.info(`Balance retrieved for ${chain}`, balanceInfo);
        } else {
          errors.push({
            chain,
            address,
            error: 'Failed to retrieve balance',
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        const errorInfo = {
          chain,
          address,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        errors.push(errorInfo);
        this.logger.error(`Error checking balance on ${chain}`, errorInfo);
      }
    }
    
    const result = {
      address,
      requestedChains: chainsToCheck,
      balances,
      errors,
      totalChains: chainsToCheck.length,
      successfulChains: balances.length,
      failedChains: errors.length,
      timestamp: new Date().toISOString()
    };
    
    this.logger.success(`Multichain balance check completed`, result);
    
    return result;
  } catch (error) {
    this.logger.error('Error in multichain balance check', error);
    throw error;
  }
}

  private async findWrappedTokens(sourceChain: string, targetChain: string) {
    try {
      this.logger.info(`Finding wrapped tokens`, { sourceChain, targetChain });
      
      const coinFinder = new abstraction.CoinFinder();
      
      const wrappedToken = await coinFinder.findWrappedToken(
        sourceChain as any,
        targetChain as any
      );
      
      const result = {
        sourceChain,
        targetChain,
        wrappedTokenAddress: wrappedToken,
        found: wrappedToken !== false,
        timestamp: new Date().toISOString()
      };
      
      if (wrappedToken) {
        this.logger.success('Wrapped token found', result);
      } else {
        this.logger.info('Wrapped token not found', result);
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error finding wrapped tokens', error);
      throw error;
    }
  }
}

// Export tool instance for use in demostools.ts
export const multichainTool = new MultichainTool();