# Demos SDK Toolkit - Windows PowerShell Installer

param(
    [string]$InstallDir = "$env:USERPROFILE\.demos-toolkit",
    [string]$BinDir = "$env:USERPROFILE\.local\bin"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Demos SDK Toolkit - Windows Installer" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Configuration
$RepoUrl = "https://github.com/kynesyslabs/demostoolkit"
$ReleaseUrl = "https://api.github.com/repos/kynesyslabs/demostoolkit/releases/latest"

# Utility functions
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Blue }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Install Chocolatey if not present
function Install-Chocolatey {
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Info "Installing Chocolatey package manager..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:PATH = [Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH","User")
        Write-Success "Chocolatey installed"
    } else {
        Write-Success "Chocolatey already installed"
    }
}

# Install system dependencies
function Install-Dependencies {
    Write-Info "Installing system dependencies..."
    
    # Install Git if not present
    if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        choco install git -y
    }
    
    # Install 7zip for extraction
    if (!(Get-Command 7z -ErrorAction SilentlyContinue)) {
        choco install 7zip -y
    }
    
    # Refresh PATH
    $env:PATH = [Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH","User")
}

# Install Bun runtime
function Install-Bun {
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        Write-Success "Bun already installed"
        return
    }
    
    Write-Info "Installing Bun runtime..."
    
    # Download and install Bun for Windows
    $BunInstaller = "$env:TEMP\install-bun.ps1"
    Invoke-WebRequest -Uri "https://bun.sh/install.ps1" -OutFile $BunInstaller
    & $BunInstaller
    
    # Add Bun to PATH
    $BunPath = "$env:USERPROFILE\.bun\bin"
    $CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($CurrentPath -notlike "*$BunPath*") {
        [Environment]::SetEnvironmentVariable("PATH", "$CurrentPath;$BunPath", "User")
        $env:PATH += ";$BunPath"
    }
    
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        Write-Success "Bun installed successfully"
    } else {
        Write-Error "Failed to install Bun"
        exit 1
    }
}

# Setup directories
function Setup-Directories {
    Write-Info "Setting up directories..."
    
    if (!(Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }
    
    if (!(Test-Path $BinDir)) {
        New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
    }
    
    # Add BinDir to PATH
    $CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($CurrentPath -notlike "*$BinDir*") {
        [Environment]::SetEnvironmentVariable("PATH", "$CurrentPath;$BinDir", "User")
        $env:PATH += ";$BinDir"
        Write-Info "Added $BinDir to PATH"
    }
}

# Download CLI tools
function Download-CliTools {
    Write-Info "Downloading CLI tools..."
    
    try {
        # Try to get latest release
        $LatestRelease = Invoke-RestMethod -Uri $ReleaseUrl
        $DownloadUrl = $LatestRelease.assets | Where-Object { $_.name -like "*.zip" } | Select-Object -First 1 -ExpandProperty browser_download_url
        
        if ($DownloadUrl) {
            $ZipFile = "$InstallDir\demos-toolkit.zip"
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipFile
            Expand-Archive -Path $ZipFile -DestinationPath $InstallDir -Force
            Remove-Item $ZipFile
            Write-Success "Downloaded from release"
            return
        }
    } catch {
        Write-Warning "Could not download from releases, cloning repository..."
    }
    
    # Fallback: Clone repository
    if (Test-Path "$InstallDir\.git") {
        Set-Location $InstallDir
        git pull
    } else {
        git clone $RepoUrl $InstallDir
    }
    
    Write-Success "CLI tools downloaded"
}

# Install CLI dependencies
function Install-CliDependencies {
    Write-Info "Installing CLI dependencies..."
    
    Set-Location $InstallDir
    bun install
    
    # Create batch file wrapper for Windows
    $BatchWrapper = @"
@echo off
bun "$InstallDir\demostools_file.ts" %*
"@
    
    $BatchFile = "$BinDir\demostools.bat"
    $BatchWrapper | Out-File -FilePath $BatchFile -Encoding ASCII
    
    Write-Success "CLI tools installed"
}

# Install UI binary
function Install-UiBinary {
    Write-Info "Installing desktop UI..."
    
    $MsiFile = Get-ChildItem "$InstallDir\ui-binaries\msi\*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($MsiFile) {
        Write-Info "Found MSI installer: $($MsiFile.Name)"
        Write-Info "Installing UI application..."
        
        # Install MSI silently
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$($MsiFile.FullName)`" /quiet /norestart" -Wait
        
        Write-Success "UI application installed"
    } else {
        Write-Warning "MSI installer not found. UI installation skipped."
        Write-Info "You can manually install the UI later from: $InstallDir\ui-binaries\"
    }
}

# Test installation
function Test-Installation {
    Write-Info "Testing installation..."
    
    # Test CLI
    if (Get-Command demostools -ErrorAction SilentlyContinue) {
        Write-Success "CLI tools: OK"
    } else {
        Write-Warning "CLI tools: Not found in PATH"
    }
    
    # Test UI (check if installed via Programs)
    $UiInstalled = Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -like "*Demos*SDK*Toolkit*" }
    if ($UiInstalled) {
        Write-Success "Desktop UI: OK"
    } else {
        Write-Warning "Desktop UI: Not detected in installed programs"
    }
}

# Show usage instructions
function Show-Usage {
    Write-Host ""
    Write-Host "🎉 Installation Complete!" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 What was installed:"
    Write-Host "  • CLI Tools: $InstallDir"
    Write-Host "  • Desktop UI: Installed via MSI"
    Write-Host "  • Commands: $BinDir"
    Write-Host ""
    Write-Host "🚀 Usage:"
    Write-Host "  CLI: demostools help"
    Write-Host "       demostools generate-wallet"
    Write-Host "       demostools check-balance <address>"
    Write-Host ""
    Write-Host "  UI:  Search for 'Demos SDK Toolkit' in Start Menu"
    Write-Host ""
    Write-Host "📖 Documentation:"
    Write-Host "  • README: $InstallDir\README.md"
    Write-Host "  • UI Guide: $InstallDir\UI_GUIDE.md"
    Write-Host ""
    Write-Host "🔧 Configuration:"
    Write-Host "  Run: demostools config init"
    Write-Host ""
    Write-Host "⚠️  If 'demostools' command not found:"
    Write-Host "  1. Restart PowerShell/Command Prompt"
    Write-Host "  2. Or run: `$env:PATH += ';$BinDir'"
    Write-Host "  3. Or use full path: $BinDir\demostools.bat"
}

# Main installation function
function Main {
    try {
        Write-Host ""
        
        # Check admin rights for some operations
        if (!(Test-Administrator)) {
            Write-Warning "Not running as Administrator. Some features may need manual installation."
            $Response = Read-Host "Continue anyway? (y/N)"
            if ($Response -notmatch '^[Yy]$') {
                exit 1
            }
        }
        
        # Installation steps
        Install-Chocolatey
        Install-Dependencies
        Install-Bun
        Setup-Directories
        Download-CliTools
        Install-CliDependencies
        Install-UiBinary
        
        # Post-installation
        Test-Installation
        Show-Usage
        
        Write-Host ""
        Write-Success "🚀 Ready to use Demos SDK Toolkit!"
        
    } catch {
        Write-Error "Installation failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main installation
Main