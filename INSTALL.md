# 🚀 Demos SDK Toolkit - Installation Guide

## One-Command Install (Recommended)

### Linux / macOS
```bash
curl -fsSL https://raw.githubusercontent.com/kynesyslabs/demostoolkit/main/install-demos-toolkit.sh | bash
```

### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/kynesyslabs/demostoolkit/main/install-demos-toolkit.ps1 | iex
```

### Windows (Git Bash / WSL)
```bash
curl -fsSL https://raw.githubusercontent.com/kynesyslabs/demostoolkit/main/install-demos-toolkit.sh | bash
```

---

## What Gets Installed

✅ **Bun Runtime** (if not present)  
✅ **CLI Tools** (demostools command)  
✅ **Desktop UI** (native app for your platform)  
✅ **Dependencies** (all required packages)  
✅ **PATH Setup** (commands work from anywhere)  

---

## After Installation

### CLI Usage
```bash
demostools help
demostools generate-wallet
demostools check-balance <address>
demostools config init
```

### Desktop UI
- **Linux**: Search for "Demos SDK Toolkit" or run `demostools-ui`
- **macOS**: Open from Applications folder
- **Windows**: Search for "Demos SDK Toolkit" in Start Menu

---

## Manual Installation (Power Users)

If you prefer manual control:

```bash
git clone https://github.com/kynesyslabs/demostoolkit.git
cd demostoolkit

# For CLI + UI development
./power-user-scripts/launch-ui.sh

# For production builds
./power-user-scripts/build-ui.sh

# For distribution packages
./power-user-scripts/package-distribution.sh
```

---

## Troubleshooting

**Command not found?**
- Restart your terminal
- Or run: `source ~/.bashrc` (Linux/macOS)
- Or add to PATH manually

**Need help?**
- Check [README.md](README.md) for CLI usage
- Check [UI_GUIDE.md](UI_GUIDE.md) for desktop app
- Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for development

---

**Built with ❤️ by Kynesys Labs**