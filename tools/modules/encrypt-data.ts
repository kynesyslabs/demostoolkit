import { encryption } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class EncryptDataTool extends DemosTool {
  constructor() {
    super('encrypt_data');
  }

  protected showUsage(): void {
    console.error('Usage: demostools encrypt <operation> <data> <algorithm> [key]');
    console.error('');
    console.error('Arguments:');
    console.error('  operation   encrypt or decrypt');
    console.error('  data        Data to encrypt/decrypt (or file path)');
    console.error('  algorithm   Encryption algorithm');
    console.error('  key         Key for RSA operations (optional for ML-KEM)');
    console.error('');
    console.error('Algorithms: ml-kem-aes, rsa');
    console.error('');
    console.error('Examples:');
    console.error('  demostools encrypt encrypt "secret data" ml-kem-aes');
    console.error('  demostools encrypt decrypt "encrypted_data" ml-kem-aes');
    console.error('  demostools encrypt encrypt "data" rsa "public_key"');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 3, 'encrypt')) {
      return false;
    }

    const operation = args[0];
    if (operation !== 'encrypt' && operation !== 'decrypt') {
      console.error('❌ Invalid operation. Use "encrypt" or "decrypt"');
      return false;
    }

    const algorithm = args[2];
    if (algorithm !== 'ml-kem-aes' && algorithm !== 'rsa') {
      console.error('❌ Invalid algorithm. Use "ml-kem-aes" or "rsa"');
      return false;
    }

    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const operation = args[0] as 'encrypt' | 'decrypt';
    const data = args[1];
    const algorithm = args[2] as 'ml-kem-aes' | 'rsa';
    const key = args[3]; // Optional for RSA

    this.logger.info('Starting encryption operation', { operation, algorithm });
    
    // Load private key
    const privateKey = await this.loadPrivateKey();
    
    if (algorithm === 'ml-kem-aes') {
      return await this.handleMlKemAes(operation, data, privateKey);
    } else if (algorithm === 'rsa') {
      return await this.handleRsa(operation, data, privateKey, key);
    }

    throw new Error('Unsupported algorithm');
  }

  private async handleMlKemAes(operation: 'encrypt' | 'decrypt', data: string, privateKey: string): Promise<ToolResult> {
    // Get unified crypto instance
    const crypto = encryption.getUnifiedCryptoInstance('encrypt');
    await crypto.ensureSeed(new TextEncoder().encode(privateKey));
    
    // Generate ML-KEM identity
    await crypto.generateIdentity('ml-kem');
    const identity = await crypto.getIdentity('ml-kem');
    
    if (operation === 'encrypt') {
      // Encrypt data
      const dataBytes = new TextEncoder().encode(data);
      const encryptedObject = await crypto.encrypt('ml-kem', dataBytes);
      
      const result = {
        operation,
        algorithm: 'ml-kem-aes',
        originalData: data,
        encryptedData: encryption.uint8ArrayToHex(encryptedObject.encryptedData),
        publicKey: encryption.uint8ArrayToHex(identity.publicKey as Uint8Array),
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Data encrypted successfully');
      console.log('');
      console.log('🔐 Encryption Result:');
      console.log(`   Algorithm: ${result.algorithm}`);
      console.log(`   Public Key: ${result.publicKey}`);
      console.log(`   Encrypted Data: ${result.encryptedData}`);
      
      return { success: true, data: result };
      
    } else {
      // Decrypt data
      const encryptedBytes = encryption.hexToUint8Array(data);
      const decryptedBytes = await crypto.decrypt('ml-kem', encryptedBytes);
      const decryptedText = new TextDecoder().decode(decryptedBytes);
      
      const result = {
        operation,
        algorithm: 'ml-kem-aes',
        encryptedData: data,
        decryptedData: decryptedText,
        publicKey: encryption.uint8ArrayToHex(identity.publicKey as Uint8Array),
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Data decrypted successfully');
      console.log('');
      console.log('🔓 Decryption Result:');
      console.log(`   Algorithm: ${result.algorithm}`);
      console.log(`   Decrypted Data: ${result.decryptedData}`);
      
      return { success: true, data: result };
    }
  }

  private async handleRsa(operation: 'encrypt' | 'decrypt', data: string, privateKey: string, key?: string): Promise<ToolResult> {
    // Get unified crypto instance  
    const crypto = encryption.getUnifiedCryptoInstance('rsa');
    await crypto.ensureSeed(new TextEncoder().encode(privateKey));
    
    if (operation === 'encrypt') {
      if (!key) {
        throw new Error('RSA encryption requires a public key');
      }
      
      const dataBytes = new TextEncoder().encode(data);
      const publicKeyBytes = encryption.hexToUint8Array(key);
      const encryptedBytes = await crypto.rsaEncrypt(dataBytes, publicKeyBytes);
      
      const result = {
        operation,
        algorithm: 'rsa',
        originalData: data,
        encryptedData: encryption.uint8ArrayToHex(encryptedBytes),
        publicKey: key,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Data encrypted with RSA');
      console.log('');
      console.log('🔐 RSA Encryption Result:');
      console.log(`   Encrypted Data: ${result.encryptedData}`);
      
      return { success: true, data: result };
      
    } else {
      const encryptedBytes = encryption.hexToUint8Array(data);
      const decryptedBytes = await crypto.rsaDecrypt(encryptedBytes);
      const decryptedText = new TextDecoder().decode(decryptedBytes);
      
      const result = {
        operation,
        algorithm: 'rsa',
        encryptedData: data,
        decryptedData: decryptedText,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Data decrypted with RSA');
      console.log('');
      console.log('🔓 RSA Decryption Result:');
      console.log(`   Decrypted Data: ${result.decryptedData}`);
      
      return { success: true, data: result };
    }
  }
}

export const encryptDataTool = new EncryptDataTool();