import { encryption } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class VerifyMessageTool extends DemosTool {
  constructor() {
    super('verify_message');
  }

  protected showUsage(): void {
    console.error('Usage: demostools verify <message> <signature> <publicKey> [algorithm]');
    console.error('');
    console.error('Arguments:');
    console.error('  message     The original message');
    console.error('  signature   The signature to verify');
    console.error('  publicKey   The public key to verify against');
    console.error('  algorithm   Verification algorithm (optional)');
    console.error('');
    console.error('Algorithms: ed25519 (default), falcon, ml-dsa');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 3, 'verify')) {
      return false;
    }

    if (args.length > 3 && !ValidationHelper.isValidAlgorithm(args[3])) {
      console.error(`❌ Invalid algorithm: ${args[3]}`);
      return false;
    }

    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const message = args[0];
    const signature = args[1];
    const publicKey = args[2];
    const algorithm = (args[3] as 'ed25519' | 'falcon' | 'ml-dsa') || 'ed25519';

    this.logger.info('Starting message verification', { message, algorithm });
    
    // Convert inputs
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = encryption.hexToUint8Array(signature);
    const publicKeyBytes = encryption.hexToUint8Array(publicKey);

    // Get unified crypto instance (no private key needed for verification)
    const crypto = encryption.getUnifiedCryptoInstance('verify');
    
    // Verify the signature
    const isValid = await crypto.verify(algorithm, messageBytes, signatureBytes, publicKeyBytes);
    
    const result = {
      message,
      signature,
      publicKey,
      algorithm,
      isValid,
      timestamp: new Date().toISOString()
    };
    
    if (isValid) {
      console.log('✅ Signature verification PASSED');
      console.log('');
      console.log('✅ Verification Result:');
      console.log(`   Message: ${message}`);
      console.log(`   Algorithm: ${algorithm}`);
      console.log(`   Public Key: ${publicKey}`);
      console.log(`   Status: VALID`);
    } else {
      console.log('❌ Signature verification FAILED');
      console.log('');
      console.log('❌ Verification Result:');
      console.log(`   Message: ${message}`);
      console.log(`   Algorithm: ${algorithm}`);
      console.log(`   Public Key: ${publicKey}`);
      console.log(`   Status: INVALID`);
    }
    
    return { success: true, data: result };
  }
}

export const verifyMessageTool = new VerifyMessageTool();