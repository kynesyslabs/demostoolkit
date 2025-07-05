# 🔧 Power User Scripts

These scripts are for developers and advanced users who want more control over the build and development process.

## Scripts

### `launch-ui.sh`
**Development Mode**: Launches the UI in development mode with hot reloading
```bash
./launch-ui.sh
```

### `build-ui.sh`  
**Production Build**: Builds optimized binaries for distribution
```bash
./build-ui.sh
```

### `package-distribution.sh`
**Distribution Package**: Creates complete distribution packages with installers
```bash
./package-distribution.sh
```

## Usage

1. **For Development**: Use `launch-ui.sh` while working on the UI
2. **For Building**: Use `build-ui.sh` to create production binaries  
3. **For Distribution**: Use `package-distribution.sh` to create release packages

## Requirements

- Rust (for Tauri)
- Bun (for frontend dependencies)
- Standard build tools for your platform

---

**Most users should use the main installer instead**: See [../INSTALL.md](../INSTALL.md)