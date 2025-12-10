import { websdk, abstraction } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class IdentityTool extends DemosTool {
  constructor() {
    super('identity');
  }

  protected showUsage(): void {
    console.error('Usage: demostools identity <subcommand> [options...]');
    console.error('');
    console.error('Subcommands:');
    console.error('  list [address]                      List all identities for an address');
    console.error('  web2 [address]                      Show Web2 identities (GitHub, Twitter, etc.)');
    console.error('  web3 [address]                      Show cross-chain Web3 identities');
    console.error('  points [address]                    Show points and rewards');
    console.error('  referral [address]                  Show referral information');
    console.error('');
    console.error('  add github <proof>                  Add GitHub identity');
    console.error('  add twitter <proof>                 Add Twitter identity');  
    console.error('  add discord <proof>                 Add Discord identity');
    console.error('  add telegram <attestation>          Add Telegram identity');
    console.error('  add pqc [algorithms]                Add post-quantum crypto identity');
    console.error('');
    console.error('  remove web2 <context> <username>    Remove Web2 identity');
    console.error('  remove web3 <chain> <address>       Remove Web3 identity');
    console.error('  remove pqc [algorithms]             Remove PQC identity');
    console.error('');
    console.error('  infer web2 <payload>                Infer Web2 identity from proof');
    console.error('  infer web3 <payload>                Infer Web3 identity from signature');
    console.error('');
    console.error('  lookup github <username> [userId]   Find Demos addresses by GitHub');
    console.error('  lookup twitter <username> [userId]  Find Demos addresses by Twitter');
    console.error('  lookup discord <username> [userId]  Find Demos addresses by Discord');
    console.error('  lookup telegram <username> [userId] Find Demos addresses by Telegram');
    console.error('  lookup web3 <chain> <address>       Find Demos addresses by Web3 identity');
    console.error('');
    console.error('  validate-referral <code>            Validate a referral code');
    console.error('  create-proof                        Create Web2 proof payload');
    console.error('');
    console.error('Options:');
    console.error('  --output json                       Output in JSON format');
    console.error('  --referral-code <code>              Include referral code for rewards');
    console.error('');
    console.error('Examples:');
    console.error('  demostools identity list');
    console.error('  demostools identity web2 demo1abc123...');
    console.error('  demostools identity add github https://github.com/username/proof');
    console.error('  demostools identity remove web2 github username');
    console.error('  demostools identity lookup twitter @elonmusk');
    console.error('  demostools identity points --output json');
  }

  protected validateArgs(args: string[]): boolean {
    // Handle help request
    if (args.length === 0 || args.includes('--help') || args.includes('-h') || args.includes('help')) {
      this.showUsage();
      return false;
    }

    const subcommand = args[0];
    const validSubcommands = [
      'list', 'web2', 'web3', 'points', 'referral',
      'add', 'remove', 'infer', 'lookup', 
      'validate-referral', 'create-proof'
    ];

    if (!validSubcommands.includes(subcommand)) {
      console.error(`❌ Invalid subcommand: ${subcommand}`);
      console.error(`Valid subcommands: ${validSubcommands.join(', ')}`);
      return false;
    }

    // Validate specific subcommand arguments
    switch (subcommand) {
      case 'add':
        if (args.length < 3) {
          console.error('❌ add requires: demostools identity add <platform> <proof>');
          return false;
        }
        break;
      case 'remove':
        if (args.length < 4) {
          console.error('❌ remove requires: demostools identity remove <type> <context> <identifier>');
          return false;
        }
        break;
      case 'lookup':
        if (args.length < 3) {
          console.error('❌ lookup requires: demostools identity lookup <platform> <identifier>');
          return false;
        }
        break;
      case 'validate-referral':
        if (args.length < 2) {
          console.error('❌ validate-referral requires: demostools identity validate-referral <code>');
          return false;
        }
        break;
    }

    return true;
  }

  private getFlagValue(flag: string): string | undefined {
    const index = process.argv.indexOf(flag);
    if (index !== -1 && index + 1 < process.argv.length) {
      return process.argv[index + 1];
    }
    return undefined;
  }

  private hasFlag(flag: string): boolean {
    return process.argv.includes(flag);
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const subcommand = args[0];
    const subArgs = args.slice(1);
    const outputFormat = this.getFlagValue('--output') || 'display';
    const referralCode = this.getFlagValue('--referral-code');

    this.logger.info('Identity operation', { subcommand, args: subArgs, outputFormat });

    // Initialize SDK
    const rpcUrl = await this.getRpcUrl();
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);

    const identities = new abstraction.Identities();
    let result: any;

    try {
      switch (subcommand) {
        case 'list':
          result = await this.handleList(demos, identities, subArgs);
          break;
        case 'web2':
          result = await this.handleWeb2(demos, identities, subArgs);
          break;
        case 'web3':
          result = await this.handleWeb3(demos, identities, subArgs);
          break;
        case 'points':
          result = await this.handlePoints(demos, identities, subArgs);
          break;
        case 'referral':
          result = await this.handleReferral(demos, identities, subArgs);
          break;
        case 'add':
          result = await this.handleAdd(demos, identities, subArgs, referralCode);
          break;
        case 'remove':
          result = await this.handleRemove(demos, identities, subArgs);
          break;
        case 'infer':
          result = await this.handleInfer(demos, identities, subArgs, referralCode);
          break;
        case 'lookup':
          result = await this.handleLookup(demos, identities, subArgs);
          break;
        case 'validate-referral':
          result = await this.handleValidateReferral(demos, identities, subArgs);
          break;
        case 'create-proof':
          result = await this.handleCreateProof(demos, identities, subArgs);
          break;
        default:
          throw new Error(`Unhandled subcommand: ${subcommand}`);
      }

      // Output result
      if (outputFormat === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        this.displayResult(subcommand, result);
      }

      return { success: true, data: result };

    } catch (error) {
      console.error(`❌ Error with identity ${subcommand}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  private async handleList(demos: any, identities: any, args: string[]): Promise<any> {
    const address = args[0];
    
    if (address && !ValidationHelper.isValidAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    const allIdentities = await identities.getIdentities(demos, 'getIdentities', address);
    return {
      operation: 'list',
      address: address || 'current wallet',
      identities: allIdentities,
      timestamp: new Date().toISOString()
    };
  }

  private async handleWeb2(demos: any, identities: any, args: string[]): Promise<any> {
    const address = args[0];
    
    if (address && !ValidationHelper.isValidAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    const web2Identities = await identities.getWeb2Identities(demos, address);
    return {
      operation: 'web2',
      address: address || 'current wallet',
      web2Identities,
      timestamp: new Date().toISOString()
    };
  }

  private async handleWeb3(demos: any, identities: any, args: string[]): Promise<any> {
    const address = args[0];
    
    if (address && !ValidationHelper.isValidAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    const web3Identities = await identities.getXmIdentities(demos, address);
    return {
      operation: 'web3',
      address: address || 'current wallet',
      web3Identities,
      timestamp: new Date().toISOString()
    };
  }

  private async handlePoints(demos: any, identities: any, args: string[]): Promise<any> {
    const address = args[0];
    
    if (address && !ValidationHelper.isValidAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    const points = await identities.getUserPoints(demos, address);
    return {
      operation: 'points',
      address: address || 'current wallet',
      points,
      timestamp: new Date().toISOString()
    };
  }

  private async handleReferral(demos: any, identities: any, args: string[]): Promise<any> {
    const address = args[0];
    
    if (address && !ValidationHelper.isValidAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    const referral = await identities.getReferralInfo(demos, address);
    return {
      operation: 'referral',
      address: address || 'current wallet',
      referral,
      timestamp: new Date().toISOString()
    };
  }

  private async handleAdd(demos: any, identities: any, args: string[], referralCode?: string): Promise<any> {
    const platform = args[0];
    const proof = args[1];

    // Connect wallet for adding identity
    const privateKey = await this.loadPrivateKey();
    await demos.connectWallet(privateKey);

    let result;
    switch (platform.toLowerCase()) {
      case 'github':
        result = await identities.addGithubIdentity(demos, { proof }, referralCode);
        break;
      case 'twitter':
        result = await identities.addTwitterIdentity(demos, proof, referralCode);
        break;
      case 'discord':
        result = await identities.addDiscordIdentity(demos, { proof }, referralCode);
        break;
      case 'telegram':
        result = await identities.addTelegramIdentity(demos, JSON.parse(proof), referralCode);
        break;
      case 'pqc':
        const algorithms = proof ? proof.split(',') : 'all';
        result = await identities.bindPqcIdentity(demos, algorithms);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    return {
      operation: 'add',
      platform,
      proof,
      result,
      timestamp: new Date().toISOString()
    };
  }

  private async handleRemove(demos: any, identities: any, args: string[]): Promise<any> {
    const type = args[0]; // 'web2', 'web3', 'pqc'
    const context = args[1];
    const identifier = args[2];

    // Connect wallet for removing identity
    const privateKey = await this.loadPrivateKey();
    await demos.connectWallet(privateKey);

    let result;
    switch (type.toLowerCase()) {
      case 'web2':
        result = await identities.removeWeb2Identity(demos, {
          context: context,
          username: identifier
        });
        break;
      case 'web3':
        result = await identities.removeXmIdentity(demos, {
          chain: context,
          address: identifier
        });
        break;
      case 'pqc':
        const algorithms = context ? context.split(',') : 'all';
        result = await identities.removePqcIdentity(demos, algorithms);
        break;
      default:
        throw new Error(`Unsupported remove type: ${type}`);
    }

    return {
      operation: 'remove',
      type,
      context,
      identifier,
      result,
      timestamp: new Date().toISOString()
    };
  }

  private async handleInfer(demos: any, identities: any, args: string[], referralCode?: string): Promise<any> {
    const type = args[0]; // 'web2', 'web3'
    const payload = args[1];

    // Connect wallet for inferring identity
    const privateKey = await this.loadPrivateKey();
    await demos.connectWallet(privateKey);

    let result;
    switch (type.toLowerCase()) {
      case 'web2':
        result = await identities.inferWeb2Identity(demos, JSON.parse(payload));
        break;
      case 'web3':
        result = await identities.inferXmIdentity(demos, JSON.parse(payload), referralCode);
        break;
      default:
        throw new Error(`Unsupported infer type: ${type}`);
    }

    return {
      operation: 'infer',
      type,
      payload,
      result,
      timestamp: new Date().toISOString()
    };
  }

  private async handleLookup(demos: any, identities: any, args: string[]): Promise<any> {
    const platform = args[0];
    const username = args[1];
    const userId = args[2]; // optional

    let result;
    switch (platform.toLowerCase()) {
      case 'github':
        result = await identities.getDemosIdsByGithub(demos, username, userId);
        break;
      case 'twitter':
        result = await identities.getDemosIdsByTwitter(demos, username, userId);
        break;
      case 'discord':
        result = await identities.getDemosIdsByDiscord(demos, username, userId);
        break;
      case 'telegram':
        result = await identities.getDemosIdsByTelegram(demos, username, userId);
        break;
      case 'web3':
        const chain = username; // reuse username param for chain
        const address = userId; // reuse userId param for address
        result = await identities.getDemosIdsByWeb3Identity(demos, chain, address);
        break;
      default:
        throw new Error(`Unsupported lookup platform: ${platform}`);
    }

    return {
      operation: 'lookup',
      platform,
      username,
      userId,
      result,
      timestamp: new Date().toISOString()
    };
  }

  private async handleValidateReferral(demos: any, identities: any, args: string[]): Promise<any> {
    const referralCode = args[0];
    const result = await identities.validateReferralCode(demos, referralCode);
    
    return {
      operation: 'validate-referral',
      code: referralCode,
      result,
      timestamp: new Date().toISOString()
    };
  }

  private async handleCreateProof(demos: any, identities: any, args: string[]): Promise<any> {
    // Connect wallet for creating proof
    const privateKey = await this.loadPrivateKey();
    await demos.connectWallet(privateKey);
    
    const proof = await identities.createWeb2ProofPayload(demos);
    
    return {
      operation: 'create-proof',
      proof,
      timestamp: new Date().toISOString()
    };
  }

  private displayResult(subcommand: string, data: any): void {
    switch (subcommand) {
      case 'list':
        this.displayIdentitiesList(data);
        break;
      case 'web2':
        this.displayWeb2Identities(data);
        break;
      case 'web3':
        this.displayWeb3Identities(data);
        break;
      case 'points':
        this.displayPoints(data);
        break;
      case 'referral':
        this.displayReferral(data);
        break;
      case 'add':
      case 'remove':
      case 'infer':
        this.displayOperationResult(data);
        break;
      case 'lookup':
        this.displayLookupResult(data);
        break;
      case 'validate-referral':
        this.displayReferralValidation(data);
        break;
      case 'create-proof':
        this.displayProofCreation(data);
        break;
      default:
        console.log(JSON.stringify(data, null, 2));
    }
  }

  private displayIdentitiesList(data: any): void {
    console.log('🆔 All Identities');
    console.log(`📍 Address: ${data.address}`);
    console.log('');
    
    if (data.identities?.result) {
      const identities = data.identities.result;
      
      if (identities.web2 && Object.keys(identities.web2).length > 0) {
        console.log('🌐 Web2 Identities:');
        Object.entries(identities.web2).forEach(([platform, accounts]) => {
          if (Array.isArray(accounts) && accounts.length > 0) {
            console.log(`   ${platform}: ${accounts.join(', ')}`);
          }
        });
        console.log('');
      }
      
      if (identities.web3 && Object.keys(identities.web3).length > 0) {
        console.log('⛓️  Web3 Identities:');
        Object.entries(identities.web3).forEach(([chain, addresses]) => {
          if (Array.isArray(addresses) && addresses.length > 0) {
            console.log(`   ${chain}: ${addresses.join(', ')}`);
          }
        });
        console.log('');
      }
      
      if (identities.pqc && identities.pqc.length > 0) {
        console.log('🔐 Post-Quantum Crypto Identities:');
        identities.pqc.forEach((pqc: any) => {
          console.log(`   ${pqc.algorithm}: ${pqc.publicKey}`);
        });
      }
    } else {
      console.log('No identities found for this address.');
    }
    
    console.log(`⏰ Retrieved: ${new Date(data.timestamp).toLocaleString()}`);
  }

  private displayWeb2Identities(data: any): void {
    console.log('🌐 Web2 Social Identities');
    console.log(`📍 Address: ${data.address}`);
    console.log('');
    
    if (data.web2Identities?.result && Object.keys(data.web2Identities.result).length > 0) {
      Object.entries(data.web2Identities.result).forEach(([platform, accounts]) => {
        if (Array.isArray(accounts) && accounts.length > 0) {
          const emoji = this.getPlatformEmoji(platform);
          console.log(`${emoji} ${platform}: ${accounts.join(', ')}`);
        }
      });
    } else {
      console.log('No Web2 identities found.');
    }
    
    console.log('');
    console.log(`⏰ Retrieved: ${new Date(data.timestamp).toLocaleString()}`);
  }

  private displayWeb3Identities(data: any): void {
    console.log('⛓️  Web3 Cross-chain Identities');
    console.log(`📍 Address: ${data.address}`);
    console.log('');
    
    if (data.web3Identities?.result && Object.keys(data.web3Identities.result).length > 0) {
      Object.entries(data.web3Identities.result).forEach(([chain, addresses]) => {
        if (Array.isArray(addresses) && addresses.length > 0) {
          console.log(`🔗 ${chain}:`);
          addresses.forEach((addr: string) => {
            console.log(`   ${addr}`);
          });
        }
      });
    } else {
      console.log('No Web3 identities found.');
    }
    
    console.log('');
    console.log(`⏰ Retrieved: ${new Date(data.timestamp).toLocaleString()}`);
  }

  private displayPoints(data: any): void {
    console.log('🎯 Points & Rewards');
    console.log(`📍 Address: ${data.address}`);
    console.log('');
    
    if (data.points?.result) {
      const points = data.points.result;
      console.log(`💰 Total Points: ${points.total || 0}`);
      
      if (points.breakdown) {
        console.log('');
        console.log('📊 Breakdown:');
        Object.entries(points.breakdown).forEach(([source, amount]) => {
          console.log(`   ${source}: ${amount}`);
        });
      }
    } else {
      console.log('No points information available.');
    }
    
    console.log('');
    console.log(`⏰ Retrieved: ${new Date(data.timestamp).toLocaleString()}`);
  }

  private displayReferral(data: any): void {
    console.log('👥 Referral Information');
    console.log(`📍 Address: ${data.address}`);
    console.log('');
    
    if (data.referral?.result) {
      const referral = data.referral.result;
      console.log(`🔗 Your Code: ${referral.code || 'Not set'}`);
      console.log(`👥 Referred Users: ${referral.referredCount || 0}`);
      console.log(`💰 Earned Points: ${referral.totalEarned || 0}`);
      
      if (referral.recentReferrals && referral.recentReferrals.length > 0) {
        console.log('');
        console.log('🕒 Recent Referrals:');
        referral.recentReferrals.slice(-5).forEach((ref: any) => {
          console.log(`   ${ref.address} (${new Date(ref.timestamp).toLocaleDateString()})`);
        });
      }
    } else {
      console.log('No referral information available.');
    }
    
    console.log('');
    console.log(`⏰ Retrieved: ${new Date(data.timestamp).toLocaleString()}`);
  }

  private displayOperationResult(data: any): void {
    console.log(`✅ Identity ${data.operation} completed`);
    console.log('');
    console.log('📋 Operation Details:');
    console.log(`   Operation: ${data.operation}`);
    
    if (data.platform) console.log(`   Platform: ${data.platform}`);
    if (data.type) console.log(`   Type: ${data.type}`);
    if (data.context) console.log(`   Context: ${data.context}`);
    
    if (data.result?.hash) {
      console.log(`   Transaction Hash: ${data.result.hash}`);
    }
    
    if (data.result?.message) {
      console.log(`   Message: ${data.result.message}`);
    }
    
    console.log(`   Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
  }

  private displayLookupResult(data: any): void {
    console.log(`🔍 Identity Lookup Results`);
    console.log(`🎯 Platform: ${data.platform}`);
    console.log(`👤 Username: ${data.username}`);
    if (data.userId) console.log(`🆔 User ID: ${data.userId}`);
    console.log('');
    
    if (data.result && data.result.length > 0) {
      console.log(`📍 Found ${data.result.length} Demos address(es):`);
      data.result.forEach((account: any, index: number) => {
        console.log(`${index + 1}. ${account.pubkey || account.address}`);
        if (account.balance) console.log(`   Balance: ${account.balance} DEM`);
        if (account.createdAt) console.log(`   Created: ${new Date(account.createdAt).toLocaleDateString()}`);
      });
    } else {
      console.log('❌ No Demos addresses found for this identity.');
    }
    
    console.log('');
    console.log(`⏰ Retrieved: ${new Date(data.timestamp).toLocaleString()}`);
  }

  private displayReferralValidation(data: any): void {
    console.log('🔍 Referral Code Validation');
    console.log(`🔗 Code: ${data.code}`);
    console.log('');
    
    if (data.result?.valid) {
      console.log('✅ Referral code is valid');
      console.log(`👤 Referrer: ${data.result.referrer}`);
      if (data.result.reward) {
        console.log(`🎁 Reward: ${data.result.reward} points`);
      }
    } else {
      console.log('❌ Referral code is invalid or expired');
      if (data.result?.message) {
        console.log(`💬 Message: ${data.result.message}`);
      }
    }
    
    console.log('');
    console.log(`⏰ Checked: ${new Date(data.timestamp).toLocaleString()}`);
  }

  private displayProofCreation(data: any): void {
    console.log('🔐 Web2 Proof Payload Created');
    console.log('');
    console.log('📋 Use this payload for Web2 identity verification:');
    console.log('');
    console.log(data.proof);
    console.log('');
    console.log('💡 Copy this payload and use it in your Web2 platform proof');
    console.log('   (e.g., in a GitHub Gist, Twitter bio, etc.)');
    console.log('');
    console.log(`⏰ Created: ${new Date(data.timestamp).toLocaleString()}`);
  }

  private getPlatformEmoji(platform: string): string {
    const emojis: Record<string, string> = {
      github: '🐙',
      twitter: '🐦',
      discord: '💬',
      telegram: '📱',
      linkedin: '💼',
      reddit: '🤖'
    };
    return emojis[platform.toLowerCase()] || '🔗';
  }
}

// Export tool instance for use in demostools.ts  
export const identityTool = new IdentityTool();