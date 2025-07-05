import { encryption } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class HashDataTool extends DemosTool {
  constructor() {
    super('hash_data');
  }

  protected showUsage(): void {
    console.error('Usage: demostools hash <operation> <data> <algorithm> [hash]');
    console.error('');
    console.error('Arguments:');
    console.error('  operation   hash or verify');
    console.error('  data        Data to hash/verify');
    console.error('  algorithm   Hash algorithm');
    console.error('  hash        Expected hash for verification (verify only)');
    console.error('');
    console.error('Algorithms: sha256, sha3_512');
    console.error('');
    console.error('Examples:');
    console.error('  demostools hash hash "Hello World" sha256');
    console.error('  demostools hash verify "Hello World" sha256 0xabc123...');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 3, 'hash')) {
      return false;
    }

    const operation = args[0];
    if (operation !== 'hash' && operation !== 'verify') {
      console.error('❌ Invalid operation. Use "hash" or "verify"');
      return false;
    }

    const algorithm = args[2];
    if (algorithm !== 'sha256' && algorithm !== 'sha3_512') {
      console.error('❌ Invalid algorithm. Use "sha256" or "sha3_512"');
      return false;
    }

    if (operation === 'verify' && args.length < 4) {
      console.error('❌ Verify operation requires expected hash');
      return false;
    }

    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const operation = args[0] as 'hash' | 'verify';
    const data = args[1];
    const algorithm = args[2] as 'sha256' | 'sha3_512';
    const expectedHash = args[3];

    this.logger.info('Starting hash operation', { operation, algorithm });

    // Convert data to bytes
    const dataBytes = new TextEncoder().encode(data);
    
    // Get unified crypto instance (no private key needed for hashing)
    const crypto = encryption.getUnifiedCryptoInstance('hash');
    
    if (operation === 'hash') {
      // Hash the data
      const hashBytes = await crypto.hash(algorithm, dataBytes);
      const hashHex = encryption.uint8ArrayToHex(hashBytes);
      
      const result = {
        operation,
        data,
        algorithm,
        hash: hashHex,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Data hashed successfully');
      console.log('');
      console.log('🔐 Hash Result:');
      console.log(`   Data: ${data}`);
      console.log(`   Algorithm: ${algorithm}`);
      console.log(`   Hash: ${hashHex}`);
      
      return { success: true, data: result };
      
    } else {
      // Verify hash
      const computedHashBytes = await crypto.hash(algorithm, dataBytes);
      const computedHash = encryption.uint8ArrayToHex(computedHashBytes);
      const isValid = computedHash === expectedHash;
      
      const result = {
        operation,
        data,
        algorithm,
        expectedHash,
        computedHash,
        isValid,
        timestamp: new Date().toISOString()
      };
      
      if (isValid) {
        console.log('✅ Hash verification PASSED');
        console.log('');
        console.log('✅ Verification Result:');
        console.log(`   Data: ${data}`);
        console.log(`   Algorithm: ${algorithm}`);
        console.log(`   Expected: ${expectedHash}`);
        console.log(`   Computed: ${computedHash}`);
        console.log(`   Status: VALID`);
      } else {
        console.log('❌ Hash verification FAILED');
        console.log('');
        console.log('❌ Verification Result:');
        console.log(`   Data: ${data}`);
        console.log(`   Algorithm: ${algorithm}`);
        console.log(`   Expected: ${expectedHash}`);
        console.log(`   Computed: ${computedHash}`);
        console.log(`   Status: INVALID`);
      }
      
      return { success: true, data: result };
    }
  }
}

export const hashDataTool = new HashDataTool();