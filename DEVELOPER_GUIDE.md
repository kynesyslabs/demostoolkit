# Developer Guide

This guide helps newcomer developers understand, contribute to, and extend the Demos SDK Toolkit.

## 🏗️ Architecture Overview

### Project Structure

```
internal_tools/
├── demostools.ts              # Main CLI entry point & router
├── tools/
│   ├── modules/               # Modular tool implementations
│   │   ├── sign-message.ts    # Example: Message signing tool
│   │   ├── check-balance.ts   # Example: Balance checking tool
│   │   ├── multichain.ts      # Example: Cross-chain operations
│   │   └── ...               # Other 16 modular tools
│   ├── utils/                 # Shared utilities & framework
│   │   ├── config.ts          # Configuration management system
│   │   ├── encryption.ts      # Portable crypto operations (crypto-js)
│   │   ├── logger.ts          # Structured logging system
│   │   └── tool-framework.ts  # Base class for all tools
│   ├── config_tool.ts         # Configuration tool (legacy)
│   └── bridge_assets.ts       # Bridge tool (legacy)
├── logs/                      # Runtime logs (gitignored)
├── package.json               # Dependencies & project config
├── tsconfig.json              # TypeScript configuration
├── README.md                  # User documentation
└── DEVELOPER_GUIDE.md         # This file
```

### Design Principles

1. **Modular Architecture**: Each tool is a self-contained module
2. **Consistent Interface**: All tools follow the same framework
3. **Configuration First**: Unified config system (env, files, CLI args)
4. **Portable**: Uses crypto-js instead of Node.js crypto for bundling
5. **Type Safe**: Full TypeScript with strict typing
6. **Logged**: Comprehensive logging for debugging and auditing

## 🛠️ Development Setup

### Prerequisites

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version  # Should be v1.0+
```

### Environment Setup

1. **Clone and install**:
```bash
git clone <repository-url>
cd internal_tools
bun install
```

2. **Create development config**:
```bash
# Option 1: Use .env file
echo 'PRIVATE_KEY="your development mnemonic"' > .env
echo 'DEMOS_RPC="https://node2.demos.sh"' >> .env

# Option 2: Use encrypted config
bun demostools.ts config init
```

3. **Test the setup**:
```bash
bun demostools.ts help
bun demostools.ts network-info
```

### IDE Configuration

**VSCode setup** (recommended):
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

**Recommended extensions**:
- TypeScript Importer
- Error Lens
- Bun for Visual Studio Code

## 🏗️ Tool Development

### Creating a New Tool

All tools follow a consistent pattern. Here's how to create a new tool:

#### 1. Create the Tool Module

```typescript
// tools/modules/my-new-tool.ts
import { DemosTool, ToolResult, ValidationHelper } from '../utils/tool-framework';

export class MyNewTool extends DemosTool {
  constructor() {
    super('my_new_tool'); // Logger name
  }

  protected showUsage(): void {
    console.error('Usage: demostools my-new-tool <required_arg> [optional_arg]');
    console.error('');
    console.error('Description: What this tool does');
    console.error('');
    console.error('Arguments:');
    console.error('  required_arg    Description of required argument');
    console.error('  optional_arg    Description of optional argument');
    console.error('');
    console.error('Examples:');
    console.error('  demostools my-new-tool example_value');
    console.error('  demostools my-new-tool example_value optional_value');
  }

  protected validateArgs(args: string[]): boolean {
    // Validate minimum argument count
    if (!ValidationHelper.requireArgs(args, 1, 'my-new-tool')) {
      return false;
    }

    // Add custom validation
    const requiredArg = args[0];
    if (!requiredArg.startsWith('expected_prefix_')) {
      console.error('❌ Required argument must start with "expected_prefix_"');
      return false;
    }

    return true;
  }

  protected async execute(args: string[]): Promise<ToolResult> {
    const requiredArg = args[0];
    const optionalArg = args[1] || 'default_value';

    this.logger.info('Starting my new tool', { requiredArg, optionalArg });

    try {
      // Your tool logic here
      const result = await this.performOperation(requiredArg, optionalArg);

      // Success output
      console.log('✅ Operation completed successfully');
      console.log('');
      console.log('📊 Results:');
      console.log(`   Required: ${result.requiredResult}`);
      console.log(`   Optional: ${result.optionalResult}`);

      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Tool execution failed', error);
      return { success: false, error: error.message };
    }
  }

  private async performOperation(required: string, optional: string) {
    // Implementation details
    return {
      requiredResult: `Processed: ${required}`,
      optionalResult: `Used: ${optional}`
    };
  }
}

// Export tool instance for demostools.ts
export const myNewTool = new MyNewTool();
```

#### 2. Register in Main CLI

```typescript
// demostools.ts - Add import
import { myNewTool } from './tools/modules/my-new-tool';

// Add to moduleTools object
const moduleTools = {
  // ... existing tools
  'my-new-tool': myNewTool
};
```

#### 3. Update Help Text

```typescript
// demostools.ts - Update showHelp() function
🔧 My Category:
  my-new-tool <arg> [opt]                  Description of what it does
```

### Tool Framework Features

#### Base Class Methods

```typescript
export abstract class DemosTool {
  protected logger: Logger;           // Automatic logging
  protected abstract showUsage(): void;     // Help text
  protected abstract validateArgs(args: string[]): boolean;  // Validation
  protected abstract execute(args: string[]): Promise<ToolResult>; // Logic
  
  // Available helper methods:
  protected async loadPrivateKey(): Promise<string>;  // Get configured key
  protected getConfig(): DemosConfig;                 // Get full config
}
```

#### Validation Helpers

```typescript
// ValidationHelper utility methods
ValidationHelper.requireArgs(args, count, toolName);        // Min arg count
ValidationHelper.isValidAddress(address);                   // Address format
ValidationHelper.isValidAlgorithm(algorithm);              // Crypto algorithm
ValidationHelper.isValidAmount(amount);                     // Numeric amount
ValidationHelper.isValidUrl(url);                          // URL format
```

#### Configuration Access

```typescript
// In your tool's execute method
const config = this.getConfig();
const privateKey = await this.loadPrivateKey();  // Handles decryption
const rpcUrl = config.DEMOS_RPC;
const referralCode = config.REFERRAL_CODE;
```

#### Logging Best Practices

```typescript
// Use structured logging with context
this.logger.info('Starting operation', { 
  operation: 'transfer',
  amount,
  recipient 
});

this.logger.success('Operation completed', {
  txHash,
  gasUsed,
  timestamp: new Date().toISOString()
});

this.logger.error('Operation failed', error);
```

### Tool Categories

#### Network Tools
- Require connection to Demos network
- Use `websdk.Demos()` for blockchain operations
- Handle network errors gracefully
- Example: `check-balance.ts`, `send.ts`

#### Crypto Tools  
- Work offline (no network required)
- Use `encryption` module from SDK
- Support multiple algorithms
- Example: `sign-message.ts`, `encrypt-data.ts`

#### Cross-chain Tools
- Interact with multiple blockchains
- Use `xmcore` for different chains
- Handle chain-specific errors
- Example: `multichain.ts`

#### Web2 Tools
- Combine blockchain with web APIs
- Use `abstraction` modules from SDK
- Handle both blockchain and HTTP errors
- Example: `web2-identity.ts`, `web2-proxy.ts`

## 🔧 Configuration System

### Configuration Priority

1. **Command line**: `--config key=value`
2. **Environment**: `.env` file
3. **Config file**: `~/.config/demos/config.json`

### Adding New Config Options

1. **Update interface**:
```typescript
// tools/utils/config.ts
export interface DemosConfig {
  PRIVATE_KEY?: string;
  DEMOS_RPC?: string;
  REFERRAL_CODE?: string;
  NEW_OPTION?: string;  // Add your new option
}
```

2. **Update validation**:
```typescript
// Add validation in ConfigManager class
private validateConfig(config: DemosConfig): string[] {
  const errors: string[] = [];
  
  // Existing validations...
  
  if (config.NEW_OPTION && !config.NEW_OPTION.startsWith('expected_')) {
    errors.push('NEW_OPTION must start with "expected_"');
  }
  
  return errors;
}
```

3. **Update help text**:
```typescript
// Update showConfig function to display new option
```

### Encryption System

The configuration system uses `crypto-js` for portable encryption:

```typescript
// Encryption is handled automatically by ConfigManager
// Tools just call this.getConfig() and decryption happens transparently

// Manual encryption/decryption (if needed):
import { encryptWithPassword, decryptWithPassword } from '../utils/encryption';

const encrypted = encryptWithPassword(sensitiveData, password);
const decrypted = decryptWithPassword(encrypted, password);
```

## 🧪 Testing

### Manual Testing

```bash
# Test your tool during development
bun demostools.ts my-new-tool test_value

# Test error handling
bun demostools.ts my-new-tool invalid_value

# Test help
bun demostools.ts my-new-tool
```

### Integration Testing

```bash
# Test with different config sources
bun demostools.ts --config private_key="test mnemonic" my-new-tool test

# Test with .env
echo 'PRIVATE_KEY="test mnemonic"' > .env
bun demostools.ts my-new-tool test

# Test with encrypted config
bun demostools.ts config init  # Set up encrypted config
bun demostools.ts my-new-tool test
```

### Error Testing

```bash
# Test network errors (disconnect internet)
bun demostools.ts network-info

# Test invalid config
bun demostools.ts --config private_key="invalid" my-new-tool test

# Test missing arguments
bun demostools.ts my-new-tool
```

## 📝 Logging & Debugging

### Log Structure

```bash
# Logs are in logs/ directory, one file per tool per day
logs/
├── my_new_tool_2025-01-15.log
├── sign_message_2025-01-15.log
└── check_balance_2025-01-15.log
```

### Log Levels

```typescript
// Available log levels in Logger class
this.logger.debug('Detailed debug info');    // Development only
this.logger.info('General information');     // Normal operations
this.logger.success('Operation succeeded');  // Success events
this.logger.warn('Warning condition');       // Warnings
this.logger.error('Error occurred', error);  // Errors with context
```

### Debug Mode

```bash
# Enable verbose logging (environment variable)
DEBUG=true bun demostools.ts my-new-tool test

# Or add to .env
echo 'DEBUG=true' >> .env
```

## 🚀 Performance Considerations

### SDK Usage

```typescript
// Good: Reuse SDK instances
const demos = new websdk.Demos();
await demos.connect(DEMOS_RPC);
await demos.connectWallet(privateKey);

// Multiple operations with same instance
const balance1 = await demos.getBalance(address1);
const balance2 = await demos.getBalance(address2);

// Bad: Creating new instances for each operation
```

### Error Handling

```typescript
// Good: Specific error handling
try {
  const result = await demos.someOperation();
  return { success: true, data: result };
} catch (error) {
  if (error.message.includes('insufficient balance')) {
    this.logger.error('Insufficient balance for operation', { 
      required: amount, 
      available: balance 
    });
    return { success: false, error: 'Insufficient balance' };
  }
  
  // Re-throw unexpected errors
  throw error;
}
```

### Memory Management

```typescript
// Clean up resources in long-running operations
try {
  const results = [];
  for (const item of largeDataSet) {
    const result = await processItem(item);
    results.push(result);
    
    // Periodic cleanup
    if (results.length % 100 === 0) {
      this.logger.info(`Processed ${results.length} items`);
    }
  }
} finally {
  // Always clean up
  await demos.disconnect();
}
```

## 🔄 Legacy Tool Migration

### Converting Legacy Tools

Some tools are still in legacy format. Here's how to convert them:

1. **Identify legacy tool**:
```typescript
// In demostools.ts - these are legacy tools
const legacyTools = {
  'bridge': { file: 'bridge_assets.ts', desc: 'Bridge assets between chains' }
};
```

2. **Create module version**:
```typescript
// Create tools/modules/bridge.ts following the framework pattern
// Move logic from tools/bridge_assets.ts to the new module class
```

3. **Update demostools.ts**:
```typescript
// Remove from legacyTools object
// Add to moduleTools object
// Update help text
```

4. **Remove old file**:
```bash
rm tools/bridge_assets.ts
```

## 📦 Dependencies

### Core Dependencies

- `@kynesyslabs/demosdk`: Blockchain operations
- `crypto-js`: Portable cryptography (replaced Node.js crypto)
- `dotenv`: Environment variable loading

### Development Dependencies

- `@types/bun`: TypeScript types for Bun
- `typescript`: TypeScript compiler

### Adding New Dependencies

```bash
# Add runtime dependency
bun add new-package

# Add development dependency  
bun add -d new-dev-package

# Remove dependency
bun remove package-name
```

**Guidelines for new dependencies**:
- Prefer pure JavaScript packages (avoid native modules)
- Check bundle size impact
- Ensure compatibility with Bun runtime
- Document any special requirements

## 🎯 Common Patterns

### Async Operation with Progress

```typescript
protected async execute(args: string[]): Promise<ToolResult> {
  const items = await this.getItemsToProcess();
  
  console.log(`Processing ${items.length} items...`);
  
  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Show progress
    process.stdout.write(`\rProgress: ${i + 1}/${items.length}`);
    
    const result = await this.processItem(item);
    results.push(result);
  }
  
  console.log('\n✅ All items processed');
  return { success: true, data: results };
}
```

### Multiple Output Formats

```typescript
protected async execute(args: string[]): Promise<ToolResult> {
  const result = await this.performOperation();
  
  // Human-readable output
  console.log('✅ Operation completed');
  console.log('📊 Summary:');
  console.log(`   Items: ${result.count}`);
  console.log(`   Total: ${result.total}`);
  
  // Machine-readable for chaining (return data)
  return { success: true, data: result };
}
```

### Configuration Validation

```typescript
protected validateArgs(args: string[]): boolean {
  // Check arguments
  if (!ValidationHelper.requireArgs(args, 1, 'tool-name')) {
    return false;
  }
  
  // Check configuration
  const config = this.getConfig();
  if (!config.REQUIRED_SETTING) {
    console.error('❌ REQUIRED_SETTING not configured');
    console.error('   Set it with: bun demostools.ts config init');
    return false;
  }
  
  return true;
}
```

## 🐛 Troubleshooting

### Common Issues

**"Tool not found"**:
1. Check tool is imported in `demostools.ts`
2. Check tool is added to `moduleTools` object
3. Check export name matches import

**"Cannot resolve module"**:
1. Check import path is correct
2. Run `bun install` to update dependencies
3. Check TypeScript configuration

**"Config not loaded"**:
1. Check `.env` file exists and has correct format
2. Check config file permissions
3. Test with `bun demostools.ts config show`

**"SDK connection failed"**:
1. Check `DEMOS_RPC` URL in config
2. Test network connectivity
3. Check private key format

### Debug Commands

```bash
# Show current configuration
bun demostools.ts config show

# Test tool with verbose logging
DEBUG=true bun demostools.ts tool-name args

# Check logs for errors
cat logs/tool_name_$(date +%Y-%m-%d).log

# Test network connectivity
bun demostools.ts network-info
```

## 🤝 Contributing Guidelines

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Use meaningful variable names
- Handle errors gracefully

### Commit Guidelines

```bash
# Format: <type>: <description>
feat: add new multichain balance tool
fix: handle network timeout errors in send tool
docs: update developer guide with new patterns
refactor: extract common validation logic
```

### Pull Request Process

1. Create feature branch from main
2. Implement changes following patterns
3. Test manually with different configurations
4. Update documentation if needed
5. Submit pull request with clear description

### Documentation Requirements

- Update `README.md` if adding user-facing features
- Update `DEVELOPER_GUIDE.md` if changing architecture
- Add inline comments for complex logic
- Include usage examples in tool help text

---

## 📚 Additional Resources

- [Demos SDK Documentation](https://github.com/kynesyslabs/demosdk)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bun Documentation](https://bun.sh/docs)
- [crypto-js Documentation](https://cryptojs.gitbook.io/docs/)

## 🆘 Getting Help

1. **Check existing issues** in the repository
2. **Search logs** for error details
3. **Test with minimal config** to isolate issues
4. **Create detailed issue** with reproduction steps
5. **Join community channels** for real-time help

---

*Happy coding! 🚀*