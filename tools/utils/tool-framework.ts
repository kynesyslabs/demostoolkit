import { getConfig } from './config';
import { Logger } from './logger';

/**
 * Common interface for all demostools utilities
 */
export interface ToolOptions {
  args: string[];
  logger?: Logger;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Base class for all demostools with common functionality
 */
export abstract class DemosTool {
  protected logger: Logger;
  protected privateKey?: string;

  constructor(toolName: string) {
    this.logger = new Logger(toolName);
  }

  /**
   * Load and validate private key from config (handles encryption)
   */
  protected async loadPrivateKey(): Promise<string> {
    this.logger.info('Loading private key from configuration');
    
    const privateKey = await getConfig('PRIVATE_KEY');
    
    if (!privateKey) {
      const error = 'PRIVATE_KEY not configured!';
      this.logger.error(error);
      console.error('❌ PRIVATE_KEY not configured!');
      console.error('');
      console.error('Configure using one of:');
      console.error('1. demostools config init');
      console.error('2. Create .env file with PRIVATE_KEY');
      console.error('3. Use --config private_key="your_key"');
      throw new Error(error);
    }

    this.privateKey = privateKey;
    this.logger.info('Private key loaded successfully');
    return privateKey;
  }

  /**
   * Get RPC URL from config with fallback
   */
  protected async getRpcUrl(): Promise<string> {
    const rpcUrl = await getConfig('DEMOS_RPC') || 'https://node2.demos.sh';
    this.logger.info(`Using RPC URL: ${rpcUrl}`);
    return rpcUrl;
  }

  /**
   * Show usage information for the tool
   */
  protected abstract showUsage(): void;

  /**
   * Validate command line arguments
   */
  protected abstract validateArgs(args: string[]): boolean;

  /**
   * Execute the main tool functionality
   */
  protected abstract execute(args: string[]): Promise<ToolResult>;

  /**
   * Main entry point for tools - handles common setup, error handling
   */
  public async run(args: string[]): Promise<ToolResult> {
    try {
      this.logger.info(`Tool started`, { args });

      if (!this.validateArgs(args)) {
        this.showUsage();
        return { success: false, error: 'Invalid arguments' };
      }

      const result = await this.execute(args);
      
      if (result.success) {
        this.logger.success('Tool completed successfully', result.data);
      } else {
        this.logger.error('Tool failed', result.error);
      }

      return result;
    } catch (error) {
      this.logger.error('Tool execution failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

/**
 * Utility function to create and run a tool
 */
export async function runTool(tool: DemosTool, args: string[]): Promise<void> {
  const result = await tool.run(args);
  
  if (!result.success) {
    process.exit(1);
  }
}

/**
 * Common validation helpers
 */
export class ValidationHelper {
  static requireArgs(args: string[], minCount: number, toolName: string): boolean {
    if (args.length < minCount) {
      console.error(`❌ ${toolName} requires at least ${minCount} argument(s)`);
      return false;
    }
    return true;
  }

  static isValidAlgorithm(algorithm: string): algorithm is 'ed25519' | 'falcon' | 'ml-dsa' {
    return ['ed25519', 'falcon', 'ml-dsa'].includes(algorithm);
  }

  static isValidAddress(address: string): boolean {
    return address.length > 0 && (address.startsWith('demo1') || address.startsWith('0x'));
  }

  static isValidAmount(amount: string): boolean {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }
}