import { encryption } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class SignMessageTool extends DemosTool {
  constructor() {
    super('sign_message');
  }

  protected showUsage(): void {
    console.error('Usage: demostools sign <message> [algorithm]');
    console.error('');
    console.error('Arguments:');
    console.error('  message     The message to sign');
    console.error('  algorithm   Signing algorithm (optional)');
    console.error('');
    console.error('Algorithms: ed25519 (default), falcon, ml-dsa');
    console.error('');
    console.error('Examples:');
    console.error('  demostools sign "Hello World"');
    console.error('  demostools sign "Test message" ml-dsa');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 1, 'sign')) {
      return false;
    }

    if (args.length > 1 && !ValidationHelper.isValidAlgorithm(args[1])) {
      console.error(`❌ Invalid algorithm: ${args[1]}`);
      console.error('Valid algorithms: ed25519, falcon, ml-dsa');
      return false;
    }

    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const message = args[0];
    const algorithm = (args[1] as 'ed25519' | 'falcon' | 'ml-dsa') || 'ed25519';

    this.logger.info('Starting message signing', { message, algorithm });
    
    // Load private key (handles encryption automatically)
    const privateKey = await this.loadPrivateKey();
    
    // Get unified crypto instance
    const crypto = encryption.getUnifiedCryptoInstance('default');
    await crypto.ensureSeed(new TextEncoder().encode(privateKey));
    
    // Generate identity for the specified algorithm
    await crypto.generateIdentity(algorithm);
    
    // Get our identity
    const identity = await crypto.getIdentity(algorithm);
    this.logger.info(`Generated identity for ${algorithm}`);
    
    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // Sign the message
    const signedObject = await crypto.sign(algorithm, messageBytes);
    
    const result = {
      message,
      signature: encryption.uint8ArrayToHex(signedObject.signature),
      algorithm: signedObject.algorithm,
      publicKey: encryption.uint8ArrayToHex(signedObject.publicKey as Uint8Array),
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('✅ Message signed successfully');
    console.log('');
    console.log('📝 Signature Details:');
    console.log(`   Message: ${result.message}`);
    console.log(`   Algorithm: ${result.algorithm}`);
    console.log(`   Public Key: ${result.publicKey}`);
    console.log(`   Signature: ${result.signature}`);
    console.log(`   Timestamp: ${result.timestamp}`);
    
    return { success: true, data: result };
  }
}

// Export tool instance for use in demostools.ts
export const signMessageTool = new SignMessageTool();