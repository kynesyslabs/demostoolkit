import { encryption } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';
import { readFileSync } from 'fs';

export class BatchSignTool extends DemosTool {
  constructor() {
    super('batch_sign');
  }

  protected showUsage(): void {
    console.error('Usage: demostools batch-sign <messages|file> [algorithm]');
    console.error('');
    console.error('Arguments:');
    console.error('  messages    Comma-separated messages or file path');
    console.error('  algorithm   Signing algorithm (optional)');
    console.error('');
    console.error('Algorithms: ed25519 (default), falcon, ml-dsa');
    console.error('');
    console.error('Examples:');
    console.error('  demostools batch-sign "Hello,World,Test"');
    console.error('  demostools batch-sign messages.txt');
    console.error('  demostools batch-sign messages.json ml-dsa');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 1, 'batch-sign')) {
      return false;
    }

    if (args.length > 1 && !ValidationHelper.isValidAlgorithm(args[1])) {
      console.error(`❌ Invalid algorithm: ${args[1]}`);
      console.error('Valid algorithms: ed25519, falcon, ml-dsa');
      return false;
    }

    return true;
  }

  private parseMessages(input: string): string[] {
    // If input is a file path, read from file
    if (input.endsWith('.txt') || input.endsWith('.json')) {
      try {
        const content = readFileSync(input, 'utf-8');
        if (input.endsWith('.json')) {
          return JSON.parse(content);
        } else {
          return content.split('\n').filter(line => line.trim() !== '');
        }
      } catch (error) {
        throw new Error(`Error reading file ${input}: ${error.message}`);
      }
    }
    
    // Otherwise, treat as comma-separated messages
    return input.split(',').map(msg => msg.trim());
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const input = args[0];
    const algorithm = (args[1] as 'ed25519' | 'falcon' | 'ml-dsa') || 'ed25519';

    // Parse messages
    const messages = this.parseMessages(input);
    
    this.logger.info('Starting batch signing', { messageCount: messages.length, algorithm });
    
    // Load private key
    const privateKey = await this.loadPrivateKey();
    
    // Get unified crypto instance
    const crypto = encryption.getUnifiedCryptoInstance('batch');
    await crypto.ensureSeed(new TextEncoder().encode(privateKey));
    
    // Generate identity for the specified algorithm
    await crypto.generateIdentity(algorithm);
    
    // Get our identity
    const identity = await crypto.getIdentity(algorithm);
    const publicKey = encryption.uint8ArrayToHex(identity.publicKey as Uint8Array);
    this.logger.info(`Generated identity for ${algorithm}`, { publicKey });
    
    const signatures = [];
    const startTime = Date.now();
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      this.logger.info(`Signing message ${i + 1}/${messages.length}`, { message });
      
      // Convert message to Uint8Array
      const messageBytes = new TextEncoder().encode(message);
      
      // Sign the message
      const signedObject = await crypto.sign(algorithm, messageBytes);
      
      const result = {
        index: i,
        message,
        signature: encryption.uint8ArrayToHex(signedObject.signature),
        algorithm: signedObject.algorithm,
        publicKey: encryption.uint8ArrayToHex(signedObject.publicKey as Uint8Array)
      };
      
      signatures.push(result);
      this.logger.info(`Message ${i + 1} signed successfully`);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const batchResult = {
      totalMessages: messages.length,
      signatures,
      algorithm,
      publicKey,
      totalTimeMs: totalTime,
      averageTimeMs: totalTime / messages.length,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('✅ Batch signing completed successfully');
    console.log('');
    console.log('📊 Batch Summary:');
    console.log(`   Messages signed: ${batchResult.totalMessages}`);
    console.log(`   Algorithm: ${batchResult.algorithm}`);
    console.log(`   Public Key: ${batchResult.publicKey}`);
    console.log(`   Total time: ${batchResult.totalTimeMs}ms`);
    console.log(`   Average time: ${batchResult.averageTimeMs.toFixed(2)}ms per message`);
    console.log('');
    console.log('📝 Individual Signatures:');
    signatures.forEach((sig, i) => {
      console.log(`   ${i + 1}. "${sig.message}"`);
      console.log(`      Signature: ${sig.signature}`);
    });
    
    return { success: true, data: batchResult };
  }
}

export const batchSignTool = new BatchSignTool();