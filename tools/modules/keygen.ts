import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework.js';
import { configManager } from '../utils/config.js';
import { websdk } from '@kynesyslabs/demosdk';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class KeygenTool extends DemosTool {
  constructor() {
    super('keygen');
  }

  protected showUsage(): void {
    console.error('Usage: demostools keygen <subcommand> [options]');
    console.error('');
    console.error('Subcommands:');
    console.error('  new           Generate a new keypair');
    console.error('  pubkey        Display the public key of a keypair');
    console.error('  recover       Recover keypair from seed phrase');
    console.error('  verify        Verify a signature');
    console.error('');
    console.error('Options:');
    console.error('  --outfile <path>      Save keypair to specified path');
    console.error('  --keypair <path>      Use keypair from specified path');
    console.error('  --mnemonic <phrase>   Provide mnemonic for recovery');
    console.error('  --no-save             Display keypair without saving (shows mnemonic)');
    console.error('  --print-only          Alias for --no-save');
    console.error('');
    console.error('Examples:');
    console.error('  demostools keygen new                                    # Generate and save');
    console.error('  demostools keygen new --no-save                          # Generate and display only');
    console.error('  demostools keygen new --outfile ./my-keypair.json        # Save to custom path');
    console.error('  demostools keygen pubkey                                 # Show pubkey from config');
    console.error('  demostools keygen pubkey --keypair ~/.config/demos/id.json');
    console.error('  demostools keygen recover --mnemonic "word1 word2 ..."   # Recover and save');
    console.error('  demostools keygen recover --mnemonic "..." --no-save     # Recover and display only');
    console.error('  demostools keygen verify <pubkey> <signature> <message> [algorithm]');
  }

  protected validateArgs(args: string[]): boolean {
    // Handle help requests
    if (args.length === 0 || ['--help', '-h', 'help'].includes(args[0])) {
      this.showUsage();
      return false;
    }

    const subcommand = args[0];
    if (!['new', 'pubkey', 'recover', 'verify'].includes(subcommand)) {
      console.error(`❌ Invalid subcommand: ${subcommand}`);
      console.error('Valid subcommands: new, pubkey, recover, verify');
      return false;
    }

    // Validate verify subcommand args
    if (subcommand === 'verify') {
      const remainingArgs = args.slice(1).filter(arg => !arg.startsWith('--'));
      if (remainingArgs.length < 3) {
        console.error('❌ verify requires: <pubkey> <signature> <message>');
        return false;
      }
    }

    return true;
  }

  private parseArgs(args: string[]): { subcommand: string; outfile?: string; keypair?: string; mnemonic?: string; noSave: boolean; otherArgs: string[] } {
    const subcommand = args[0];
    let outfile: string | undefined;
    let keypair: string | undefined;
    let mnemonic: string | undefined;
    let noSave = false;
    const otherArgs: string[] = [];

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--outfile' && i + 1 < args.length) {
        outfile = args[i + 1];
        i++; // Skip next arg as it's the value
      } else if (arg === '--keypair' && i + 1 < args.length) {
        keypair = args[i + 1];
        i++; // Skip next arg as it's the value
      } else if (arg === '--mnemonic' && i + 1 < args.length) {
        mnemonic = args[i + 1];
        i++; // Skip next arg as it's the value
      } else if (arg === '--no-save' || arg === '--print-only') {
        noSave = true;
      } else if (!arg.startsWith('--')) {
        otherArgs.push(arg);
      }
    }

    return { subcommand, outfile, keypair, mnemonic, noSave, otherArgs };
  }

  private getDefaultKeypairPath(): string {
    return join(homedir(), '.config', 'demos', 'id.json');
  }

  private async saveKeypair(mnemonic: string, address: string, ed25519Address: string, outfile?: string): Promise<string> {
    const outputPath = outfile || this.getDefaultKeypairPath();
    
    // Ensure directory exists
    const dir = join(outputPath, '..');
    if (!existsSync(dir)) {
      await import('fs').then(fs => fs.mkdirSync(dir, { recursive: true }));
    }

    const keypairData = {
      mnemonic,
      address,
      ed25519Address,
      created: new Date().toISOString(),
      type: 'demos-keypair'
    };

    writeFileSync(outputPath, JSON.stringify(keypairData, null, 2));
    return outputPath;
  }

  private loadKeypair(keypairPath?: string): { mnemonic: string; address: string; ed25519Address: string } {
    const path = keypairPath || this.getDefaultKeypairPath();
    
    if (!existsSync(path)) {
      throw new Error(`Keypair file not found: ${path}`);
    }

    try {
      const data = JSON.parse(readFileSync(path, 'utf8'));
      if (!data.mnemonic) {
        throw new Error('Invalid keypair file: missing mnemonic');
      }
      return data;
    } catch (error) {
      throw new Error(`Failed to load keypair from ${path}: ${error.message}`);
    }
  }

  private async generateNew(outfile?: string, noSave: boolean = false): Promise<ToolResult> {
    this.logger.info('Generating new keypair');

    // Get RPC URL for validation
    const rpcUrl = await this.getRpcUrl();
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);

    // Generate new keypair with default 128-bit strength
    const mnemonic = demos.newMnemonic(128);
    const address = await demos.connectWallet(mnemonic);
    const ed25519Address = await demos.getEd25519Address();

    console.log('✅ Generated new keypair');
    console.log(`🔑 Public key: ${address}`);
    console.log(`🔐 Ed25519 address: ${ed25519Address}`);

    if (noSave) {
      // Display mnemonic but don't save
      console.log('');
      console.log('📝 Mnemonic (SAVE THIS SECURELY):');
      console.log(`   ${mnemonic}`);
      console.log('');
      console.log('⚠️  This keypair was NOT saved. Use --outfile to save it.');

      return {
        success: true,
        data: {
          address,
          ed25519Address,
          mnemonic,
          saved: false
        }
      };
    } else {
      // Save keypair
      const savedPath = await this.saveKeypair(mnemonic, address, ed25519Address, outfile);
      console.log(`📁 Saved to: ${savedPath}`);

      return {
        success: true,
        data: {
          address,
          ed25519Address,
          savedPath,
          saved: true
        }
      };
    }
  }

  private async showPubkey(keypairPath?: string): Promise<ToolResult> {
    try {
      let mnemonic: string;
      let source: string;

      if (keypairPath) {
        // Load from specified file
        const keypair = this.loadKeypair(keypairPath);
        mnemonic = keypair.mnemonic;
        source = keypairPath;
      } else {
        // Try to get from config first, then default keypair file
        const config = configManager.getAll();
        if (config.PRIVATE_KEY) {
          mnemonic = config.PRIVATE_KEY;
          source = 'config';
        } else {
          const keypair = this.loadKeypair();
          mnemonic = keypair.mnemonic;
          source = this.getDefaultKeypairPath();
        }
      }

      // Connect and get addresses
      const rpcUrl = await this.getRpcUrl();
      const demos = new websdk.Demos();
      await demos.connect(rpcUrl);
      
      const address = await demos.connectWallet(mnemonic);
      const ed25519Address = await demos.getEd25519Address();

      console.log(`🔑 Public key: ${address}`);
      console.log(`🔐 Ed25519 address: ${ed25519Address}`);
      console.log(`📂 Source: ${source}`);

      return {
        success: true,
        data: {
          address,
          ed25519Address,
          source
        }
      };
    } catch (error) {
      console.error(`❌ Failed to get public key: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async recoverKeypair(mnemonic?: string, outfile?: string, noSave: boolean = false): Promise<ToolResult> {
    if (!mnemonic) {
      console.error('❌ Mnemonic is required for recovery');
      console.error('');
      console.error('Usage:');
      console.error('  demostools keygen recover --mnemonic "your twelve word phrase here"');
      console.error('  demostools keygen recover --mnemonic "..." --outfile ./my-keypair.json');
      console.error('  demostools keygen recover --mnemonic "..." --no-save');
      return { success: false, error: 'Mnemonic is required' };
    }

    this.logger.info('Recovering keypair from mnemonic');

    try {
      // Get RPC URL
      const rpcUrl = await this.getRpcUrl();
      const demos = new websdk.Demos();
      await demos.connect(rpcUrl);

      // Connect with provided mnemonic
      const address = await demos.connectWallet(mnemonic);
      const ed25519Address = await demos.getEd25519Address();

      console.log('✅ Keypair recovered successfully');
      console.log(`🔑 Public key: ${address}`);
      console.log(`🔐 Ed25519 address: ${ed25519Address}`);

      if (noSave) {
        console.log('');
        console.log('⚠️  Keypair was NOT saved (--no-save flag used)');

        return {
          success: true,
          data: {
            address,
            ed25519Address,
            saved: false
          }
        };
      } else {
        // Save keypair
        const savedPath = await this.saveKeypair(mnemonic, address, ed25519Address, outfile);
        console.log(`📁 Saved to: ${savedPath}`);

        return {
          success: true,
          data: {
            address,
            ed25519Address,
            savedPath,
            saved: true
          }
        };
      }
    } catch (error) {
      console.error(`❌ Recovery failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async verifySignature(pubkey: string, signature: string, message: string, algorithm?: string): Promise<ToolResult> {
    try {
      this.logger.info(`Verifying signature for message: ${message}`);

      // Connect to verify
      const rpcUrl = await this.getRpcUrl();
      const demos = new websdk.Demos();
      await demos.connect(rpcUrl);

      console.log('🔍 Verifying signature...');
      console.log(`📝 Message: ${message}`);
      console.log(`🔑 Public key: ${pubkey}`);
      console.log(`✍️  Signature: ${signature}`);
      if (algorithm) {
        console.log(`🔐 Algorithm: ${algorithm}`);
      }

      // Use the SDK's verifyMessage method
      const options = algorithm ? { algorithm: algorithm as any } : undefined;
      const verified = await demos.verifyMessage(message, signature, pubkey, options);

      if (verified) {
        console.log('✅ Signature is VALID');
      } else {
        console.log('❌ Signature is INVALID');
      }

      return {
        success: true,
        data: {
          pubkey,
          signature,
          message,
          algorithm: algorithm || 'ed25519',
          verified
        }
      };
    } catch (error) {
      console.error(`❌ Signature verification failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const parsed = this.parseArgs(args);
    const { subcommand, outfile, keypair, mnemonic, noSave, otherArgs } = parsed;

    this.logger.info(`Keygen operation: ${subcommand}`);

    switch (subcommand) {
      case 'new':
        return await this.generateNew(outfile, noSave);

      case 'pubkey':
        return await this.showPubkey(keypair);

      case 'recover':
        return await this.recoverKeypair(mnemonic, outfile, noSave);

      case 'verify':
        if (otherArgs.length < 3) {
          throw new Error('verify requires: <pubkey> <signature> <message> [algorithm]');
        }
        return await this.verifySignature(otherArgs[0], otherArgs[1], otherArgs[2], otherArgs[3]);

      default:
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
  }
}

export const keygenTool = new KeygenTool();