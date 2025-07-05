import { websdk } from '@kynesyslabs/demosdk';
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class Web2ProxyTool extends DemosTool {
  constructor() {
    super('web2_proxy');
  }

  protected showUsage(): void {
    console.error('Usage: demostools web2-proxy <operation> <url> [method] [body]');
    console.error('');
    console.error('Operations:');
    console.error('  proxy    Create attested Web2 HTTP proxy');
    console.error('  tweet    Fetch tweet content');
    console.error('');
    console.error('Arguments:');
    console.error('  url      Target URL to proxy or tweet URL');
    console.error('  method   HTTP method (GET, POST) - default: GET');
    console.error('  body     Request body for POST requests');
    console.error('');
    console.error('Examples:');
    console.error('  demostools web2-proxy proxy https://api.github.com/users/octocat');
    console.error('  demostools web2-proxy proxy https://httpbin.org/post POST \'{"key":"value"}\'');
    console.error('  demostools web2-proxy tweet https://twitter.com/user/status/123456789');
  }

  protected validateArgs(args: string[]): boolean {
    if (!ValidationHelper.requireArgs(args, 2, 'web2-proxy')) {
      return false;
    }

    const operation = args[0];
    if (!['proxy', 'tweet'].includes(operation)) {
      console.error(`❌ Invalid operation: ${operation}`);
      console.error('Valid operations: proxy, tweet');
      return false;
    }

    const url = args[1];
    if (!url || !url.startsWith('http')) {
      console.error('❌ Invalid URL. Must start with http:// or https://');
      return false;
    }

    if (args.length > 2) {
      const method = args[2];
      if (!['GET', 'POST'].includes(method.toUpperCase())) {
        console.error('❌ Invalid method. Use: GET or POST');
        return false;
      }
    }

    return true;
  }

  private async createWeb2Proxy(url: string, method: 'GET' | 'POST' = 'GET', requestBody?: string): Promise<ToolResult> {
    this.logger.info('Starting Web2 proxy creation', { url, method });
    
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
    
    // Create DAHR (Decentralized Attestation HTTP Relay) instance
    const proxy = await demos.web2.createDahr();
    this.logger.info(`DAHR proxy created with session ID: ${proxy.sessionId}`);
    
    // Prepare request options
    const options: any = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Demos-SDK-Web2-Proxy/1.0'
      }
    };
    
    if (method === 'POST' && requestBody) {
      options.body = requestBody;
    }
    
    this.logger.info('Starting proxy request', { url, method, options });
    
    // Make the attested Web2 request
    const attestationResult = await proxy.startProxy({
      url,
      method,
      options
    });
    
    const result = {
      sessionId: proxy.sessionId,
      url,
      method,
      attestation: attestationResult.attestation,
      response: attestationResult.response,
      timestamp: new Date().toISOString()
    };
    
    // Stop the proxy
    await proxy.stopProxy();
    this.logger.info('Proxy stopped');
    
    // Output result
    console.log('✅ Web2 proxy request completed successfully');
    console.log('');
    console.log('🌐 Proxy Details:');
    console.log(`   Session ID: ${result.sessionId}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Method: ${result.method}`);
    console.log(`   Timestamp: ${result.timestamp}`);
    console.log('');
    console.log('🔗 Attestation:');
    console.log(JSON.stringify(result.attestation, null, 2));
    console.log('');
    console.log('📄 Response:');
    console.log(JSON.stringify(result.response, null, 2));
    
    return { success: true, data: result };
  }

  private async getTweet(tweetUrl: string): Promise<ToolResult> {
    this.logger.info('Fetching tweet', { tweetUrl });
    
    // Get RPC URL (no private key needed for tweet fetching)
    const rpcUrl = await this.getRpcUrl();
    
    // Connect to network
    const demos = new websdk.Demos();
    await demos.connect(rpcUrl);
    this.logger.info(`Connected to RPC: ${rpcUrl}`);
    
    // Fetch tweet
    const tweetResult = await demos.web2.getTweet(tweetUrl);
    
    const result = {
      tweetUrl,
      success: tweetResult.success,
      tweet: tweetResult.tweet,
      error: tweetResult.error,
      timestamp: new Date().toISOString()
    };
    
    // Output result
    if (tweetResult.success) {
      console.log('✅ Tweet fetched successfully');
      console.log('');
      console.log('🐦 Tweet Details:');
      console.log(`   URL: ${tweetUrl}`);
      console.log(`   Content:`);
      console.log(JSON.stringify(tweetResult.tweet, null, 2));
    } else {
      console.log('❌ Failed to fetch tweet');
      console.log('');
      console.log('🐦 Tweet Error:');
      console.log(`   URL: ${tweetUrl}`);
      console.log(`   Error: ${tweetResult.error}`);
    }
    
    return { success: tweetResult.success, data: result };
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const operation = args[0];
    const url = args[1];
    const method = (args[2]?.toUpperCase() || 'GET') as 'GET' | 'POST';
    const body = args[3];

    this.logger.info('Web2 proxy operation', { operation, url, method });

    switch (operation) {
      case 'proxy':
        return await this.createWeb2Proxy(url, method, body);
      
      case 'tweet':
        return await this.getTweet(url);
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}

export const web2ProxyTool = new Web2ProxyTool();