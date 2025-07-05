import { websdk, abstraction } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class Web2IdentityTool extends DemosTool {
  constructor() {
    super('web2_attestation');
  }

  protected showUsage(): void {
    console.error('Usage: demostools web2-identity <operation> [args...]');
    console.error('');
    console.error('Operations:');
    console.error('  proof            Create Web2 proof payload');
    console.error('  github           Add GitHub identity');
    console.error('  twitter          Add Twitter identity');
    console.error('  get              Get identities for address');
    console.error('');
    console.error('Arguments:');
    console.error('  proof                                        Create proof payload');
    console.error('  github <username> <gistId> [referralCode]    Add GitHub identity');
    console.error('  twitter <username> <tweetId> [referralCode]  Add Twitter identity');
    console.error('  get [address]                                Get identities (current wallet if no address)');
    console.error('');
    console.error('Examples:');
    console.error('  demostools web2-identity proof');
    console.error('  demostools web2-identity github octocat abc123def456');
    console.error('  demostools web2-identity twitter jack 1234567890123456789');
    console.error('  demostools web2-identity github octocat abc123def456 REFERRAL123');
    console.error('  demostools web2-identity get demo1abc123...');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 1, 'web2-identity')) {
      return false;
    }

    const operation = args[0];
    if (!['proof', 'github', 'twitter', 'get'].includes(operation)) {
      console.error(`❌ Invalid operation: ${operation}`);
      console.error('Valid operations: proof, github, twitter, get');
      return false;
    }

    if (operation === 'github' && args.length < 3) {
      console.error('❌ GitHub operation requires username and gistId');
      return false;
    }

    if (operation === 'twitter' && args.length < 3) {
      console.error('❌ Twitter operation requires username and tweetId');
      return false;
    }

    return true;
  }

  private async createWeb2ProofPayload(): Promise<ToolResult> {
    this.logger.info('Creating Web2 proof payload');
    
    // Load private key and RPC URL
    const privateKey = await this.loadPrivateKey();
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Connect wallet
    await demos.connectWallet(privateKey);
    const address = demos.getAddress();
    this.logger.info(`Wallet connected: ${address}`);
    
    // Create proof payload
    const identities = new abstraction.Identities();
    const proofPayload = await identities.createWeb2ProofPayload(demos);
    
    const result = {
      address,
      proofPayload,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('✅ Web2 proof payload created successfully');
    console.log('');
    console.log('🔐 Proof Payload:');
    console.log(`   Address: ${address}`);
    console.log(`   Payload:`);
    console.log(JSON.stringify(proofPayload, null, 2));
    console.log('');
    console.log('💡 Use this payload to prove your identity on Web2 platforms');
    
    return { success: true, data: result };
  }

  private async addGithubIdentity(githubUsername: string, gistId: string, referralCode?: string): Promise<ToolResult> {
    this.logger.info('Adding GitHub identity', { githubUsername, gistId, referralCode });
    
    // Load private key and RPC URL
    const privateKey = await this.loadPrivateKey();
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Connect wallet
    await demos.connectWallet(privateKey);
    const address = demos.getAddress();
    this.logger.info(`Wallet connected: ${address}`);
    
    // Add GitHub identity
    const identities = new abstraction.Identities();
    
    const githubProof = {
      username: githubUsername,
      gistId: gistId
    };
    
    const validationData = await identities.addGithubIdentity(demos, githubProof, referralCode);
    const broadcastResult = await demos.broadcast(validationData);
    
    const result = {
      address,
      githubUsername,
      gistId,
      referralCode,
      validationData,
      broadcastResult,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('✅ GitHub identity added successfully');
    console.log('');
    console.log('🐙 GitHub Identity:');
    console.log(`   Address: ${address}`);
    console.log(`   Username: ${githubUsername}`);
    console.log(`   Gist ID: ${gistId}`);
    if (referralCode) console.log(`   Referral Code: ${referralCode}`);
    console.log('');
    console.log('📡 Broadcast Result:');
    console.log(JSON.stringify(broadcastResult, null, 2));
    
    return { success: true, data: result };
  }

  private async addTwitterIdentity(twitterUsername: string, tweetId: string, referralCode?: string): Promise<ToolResult> {
    this.logger.info('Adding Twitter identity', { twitterUsername, tweetId, referralCode });
    
    // Load private key and RPC URL
    const privateKey = await this.loadPrivateKey();
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Connect wallet
    await demos.connectWallet(privateKey);
    const address = demos.getAddress();
    this.logger.info(`Wallet connected: ${address}`);
    
    // Add Twitter identity
    const identities = new abstraction.Identities();
    
    const twitterProof = {
      username: twitterUsername,
      tweetId: tweetId
    };
    
    const validationData = await identities.addTwitterIdentity(demos, twitterProof, referralCode);
    const broadcastResult = await demos.broadcast(validationData);
    
    const result = {
      address,
      twitterUsername,
      tweetId,
      referralCode,
      validationData,
      broadcastResult,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('✅ Twitter identity added successfully');
    console.log('');
    console.log('🐦 Twitter Identity:');
    console.log(`   Address: ${address}`);
    console.log(`   Username: ${twitterUsername}`);
    console.log(`   Tweet ID: ${tweetId}`);
    if (referralCode) console.log(`   Referral Code: ${referralCode}`);
    console.log('');
    console.log('📡 Broadcast Result:');
    console.log(JSON.stringify(broadcastResult, null, 2));
    
    return { success: true, data: result };
  }

  private async getIdentities(targetAddress?: string): Promise<ToolResult> {
    this.logger.info('Getting identities', { targetAddress });
    
    // Get RPC URL
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // If no target address, use wallet address
    if (!targetAddress) {
      const privateKey = await this.loadPrivateKey();
      await demos.connectWallet(privateKey);
      targetAddress = demos.getAddress();
    }
    
    // Get all identity information
    const identities = new abstraction.Identities();
    
    const allIdentities = await identities.getIdentities(demos, undefined, targetAddress);
    const xmIdentities = await identities.getXmIdentities(demos, targetAddress);
    const web2Identities = await identities.getWeb2Identities(demos, targetAddress);
    const userPoints = await identities.getUserPoints(demos, targetAddress);
    const referralInfo = await identities.getReferralInfo(demos, targetAddress);
    
    const result = {
      address: targetAddress,
      allIdentities,
      xmIdentities,
      web2Identities,
      userPoints,
      referralInfo,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    console.log('✅ Identities retrieved successfully');
    console.log('');
    console.log('👤 Identity Information:');
    console.log(`   Address: ${targetAddress}`);
    console.log('');
    console.log('🌐 All Identities:');
    console.log(JSON.stringify(allIdentities, null, 2));
    console.log('');
    console.log('🔗 Cross-chain Identities:');
    console.log(JSON.stringify(xmIdentities, null, 2));
    console.log('');
    console.log('🌍 Web2 Identities:');
    console.log(JSON.stringify(web2Identities, null, 2));
    console.log('');
    console.log('🎯 User Points:');
    console.log(JSON.stringify(userPoints, null, 2));
    console.log('');
    console.log('🔗 Referral Info:');
    console.log(JSON.stringify(referralInfo, null, 2));
    
    return { success: true, data: result };
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const operation = args[0];

    this.logger.info('Web2 identity operation', { operation, args: args.slice(1) });

    switch (operation) {
      case 'proof':
        return await this.createWeb2ProofPayload();
      
      case 'github':
        const githubUsername = args[1];
        const gistId = args[2];
        const githubReferralCode = args[3];
        return await this.addGithubIdentity(githubUsername, gistId, githubReferralCode);
      
      case 'twitter':
        const twitterUsername = args[1];
        const tweetId = args[2];
        const twitterReferralCode = args[3];
        return await this.addTwitterIdentity(twitterUsername, tweetId, twitterReferralCode);
      
      case 'get':
        const targetAddress = args[1];
        return await this.getIdentities(targetAddress);
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}

export const web2IdentityTool = new Web2IdentityTool();