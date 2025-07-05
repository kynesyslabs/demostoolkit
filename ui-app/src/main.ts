import { invoke } from '@tauri-apps/api/core'

interface ToolDefinition {
  name: string
  args: Array<{
    name: string
    type: 'text' | 'number' | 'select' | 'textarea'
    required?: boolean
    options?: string[]
    placeholder?: string
    help?: string
  }>
}

const toolDefinitions: Record<string, ToolDefinition> = {
  'config': {
    name: 'Configuration Manager',
    args: [
      { name: 'action', type: 'select', required: true, options: ['show', 'init', 'apply-env', 'use-config'], help: 'Configuration action to perform' }
    ]
  },
  'generate-wallet': {
    name: 'Generate Wallet',
    args: [
      { name: 'entropy', type: 'select', options: ['128', '256'], help: 'Entropy bits for wallet generation (optional)' }
    ]
  },
  'check-balance': {
    name: 'Check Balance',
    args: [
      { name: 'address', type: 'text', required: true, placeholder: 'demo1...', help: 'Address to check balance for' }
    ]
  },
  'send': {
    name: 'Send Tokens',
    args: [
      { name: 'amount', type: 'number', required: true, placeholder: '10.5', help: 'Amount to send' },
      { name: 'address', type: 'text', required: true, placeholder: 'demo1...', help: 'Recipient address' }
    ]
  },
  'sign': {
    name: 'Sign Message',
    args: [
      { name: 'message', type: 'text', required: true, placeholder: 'Hello World', help: 'Message to sign' },
      { name: 'algorithm', type: 'select', options: ['ed25519', 'ml-dsa', 'falcon'], help: 'Signing algorithm (default: ed25519)' }
    ]
  },
  'verify': {
    name: 'Verify Signature',
    args: [
      { name: 'message', type: 'text', required: true, placeholder: 'Hello World', help: 'Original message' },
      { name: 'signature', type: 'text', required: true, placeholder: 'signature_hex', help: 'Signature to verify' },
      { name: 'pubkey', type: 'text', required: true, placeholder: 'public_key_hex', help: 'Public key' },
      { name: 'algorithm', type: 'select', options: ['ed25519', 'ml-dsa', 'falcon'], help: 'Verification algorithm' }
    ]
  },
  'encrypt': {
    name: 'Encrypt/Decrypt Data',
    args: [
      { name: 'operation', type: 'select', required: true, options: ['encrypt', 'decrypt'], help: 'Operation to perform' },
      { name: 'data', type: 'textarea', required: true, placeholder: 'Data to encrypt/decrypt', help: 'Input data' },
      { name: 'algorithm', type: 'select', required: true, options: ['ml-kem-aes', 'rsa'], help: 'Encryption algorithm' }
    ]
  },
  'hash': {
    name: 'Hash Data',
    args: [
      { name: 'operation', type: 'select', required: true, options: ['hash', 'verify'], help: 'Operation to perform' },
      { name: 'data', type: 'textarea', required: true, placeholder: 'Data to hash', help: 'Input data' },
      { name: 'algorithm', type: 'select', required: true, options: ['sha256', 'sha3_512'], help: 'Hash algorithm' }
    ]
  },
  'multichain': {
    name: 'Multichain Operations',
    args: [
      { name: 'operation', type: 'select', required: true, options: ['balance', 'wrapped'], help: 'Multichain operation' },
      { name: 'address', type: 'text', required: true, placeholder: '0x...', help: 'Address to check' },
      { name: 'chains', type: 'text', placeholder: 'ethereum_mainnet,bitcoin_mainnet', help: 'Comma-separated chain names (optional)' }
    ]
  },
  'web2-identity': {
    name: 'Web2 Identity',
    args: [
      { name: 'operation', type: 'select', required: true, options: ['proof', 'github', 'twitter', 'get'], help: 'Identity operation' },
      { name: 'username', type: 'text', placeholder: 'username', help: 'Username (for github/twitter)' },
      { name: 'id', type: 'text', placeholder: 'user_id', help: 'User ID (for github/twitter)' }
    ]
  },
  'web2-proxy': {
    name: 'Web2 Proxy',
    args: [
      { name: 'operation', type: 'select', required: true, options: ['proxy', 'tweet'], help: 'Proxy operation' },
      { name: 'url', type: 'text', required: true, placeholder: 'https://api.example.com', help: 'URL to proxy' },
      { name: 'method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], help: 'HTTP method (default: GET)' }
    ]
  },
  'network-info': {
    name: 'Network Information',
    args: []
  },
  'get-block': {
    name: 'Get Block',
    args: []
  },
  'get-mempool': {
    name: 'Get Mempool',
    args: []
  },
  'get-transaction': {
    name: 'Get Transaction',
    args: [
      { name: 'hash', type: 'text', required: true, placeholder: 'transaction_hash', help: 'Transaction hash' }
    ]
  },
  'get-nonce': {
    name: 'Get Nonce',
    args: [
      { name: 'address', type: 'text', required: true, placeholder: 'demo1...', help: 'Address to get nonce for' }
    ]
  },
  'batch-sign': {
    name: 'Batch Sign',
    args: [
      { name: 'messages', type: 'textarea', required: true, placeholder: 'message1\\nmessage2\\nmessage3', help: 'Messages to sign (one per line)' },
      { name: 'algorithm', type: 'select', options: ['ed25519', 'ml-dsa', 'falcon'], help: 'Signing algorithm (default: ed25519)' }
    ]
  },
  'bridge': {
    name: 'Bridge Assets',
    args: [
      { name: 'operation', type: 'select', required: true, options: ['rubic', 'native', 'options'], help: 'Bridge operation' }
    ]
  }
}

let currentTool: string | null = null

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners()
  checkStatus()
})

function setupEventListeners() {
  // Tool button clicks
  document.querySelectorAll('.tool-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const tool = (e.target as HTMLElement).dataset.tool
      if (tool) {
        selectTool(tool)
      }
    })
  })
}

function selectTool(toolName: string) {
  currentTool = toolName
  
  // Update active button
  document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'))
  document.querySelector(`[data-tool="${toolName}"]`)?.classList.add('active')
  
  // Hide welcome message
  document.getElementById('welcome')?.classList.remove('active')
  
  // Show tool form
  showToolForm(toolName)
}

function showToolForm(toolName: string) {
  const content = document.querySelector('.content')
  const tool = toolDefinitions[toolName]
  
  if (!tool) {
    content!.innerHTML = `<div class="tool-form active"><h2>Tool not found</h2><p>Tool "${toolName}" is not defined.</p></div>`
    return
  }
  
  const formHtml = `
    <div class="tool-form active">
      <h2>${tool.name}</h2>
      <form id="tool-form">
        ${tool.args.map(arg => createFormField(arg)).join('')}
        <button type="submit" class="btn">Execute</button>
      </form>
      <div id="output-container"></div>
    </div>
  `
  
  content!.innerHTML = formHtml
  
  // Add form submit handler
  document.getElementById('tool-form')?.addEventListener('submit', handleFormSubmit)
}

function createFormField(arg: any): string {
  const isRequired = arg.required ? 'required' : ''
  const placeholder = arg.placeholder ? `placeholder="${arg.placeholder}"` : ''
  
  let inputHtml = ''
  
  switch (arg.type) {
    case 'select':
      const options = arg.options || []
      inputHtml = `
        <select name="${arg.name}" ${isRequired}>
          <option value="">Select ${arg.name}...</option>
          ${options.map((opt: string) => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      `
      break
    case 'textarea':
      inputHtml = `<textarea name="${arg.name}" rows="4" ${placeholder} ${isRequired}></textarea>`
      break
    case 'number':
      inputHtml = `<input type="number" name="${arg.name}" step="any" ${placeholder} ${isRequired}>`
      break
    default:
      inputHtml = `<input type="text" name="${arg.name}" ${placeholder} ${isRequired}>`
      break
  }
  
  return `
    <div class="form-group">
      <label>${arg.name}${arg.required ? ' *' : ''}</label>
      ${inputHtml}
      ${arg.help ? `<div class="help-text">${arg.help}</div>` : ''}
    </div>
  `
}

async function handleFormSubmit(e: Event) {
  e.preventDefault()
  
  if (!currentTool) return
  
  const formData = new FormData(e.target as HTMLFormElement)
  const args: string[] = []
  
  // Build arguments array
  for (const [, value] of formData.entries()) {
    if (value && value.toString().trim()) {
      args.push(value.toString().trim())
    }
  }
  
  // Clear previous output and show loading immediately
  clearOutput()
  showLoading(true)
  disableForm(true)
  
  try {
    const result = await invoke('run_demostool', {
      command: currentTool,
      args: args
    })
    
    showOutput(result as string, 'success')
  } catch (error) {
    showOutput(error as string, 'error')
  } finally {
    showLoading(false)
    disableForm(false)
  }
}

function showLoading(show: boolean) {
  const loading = document.getElementById('loading')
  if (loading) {
    loading.classList.toggle('active', show)
  }
}

function showOutput(output: string, type: 'success' | 'error') {
  const container = document.getElementById('output-container')
  if (!container) return
  
  const outputDiv = document.createElement('div')
  outputDiv.className = `output ${type}`
  outputDiv.textContent = output
  
  container.innerHTML = ''
  container.appendChild(outputDiv)
  
  // Add copy button for output
  const copyBtn = document.createElement('button')
  copyBtn.textContent = 'Copy Output'
  copyBtn.className = 'btn'
  copyBtn.style.marginTop = '10px'
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(output)
    copyBtn.textContent = 'Copied!'
    setTimeout(() => copyBtn.textContent = 'Copy Output', 2000)
  }
  container.appendChild(copyBtn)
}

function clearOutput() {
  const container = document.getElementById('output-container')
  if (container) {
    container.innerHTML = ''
  }
}

function disableForm(disabled: boolean) {
  const form = document.getElementById('tool-form') as HTMLFormElement
  if (form) {
    const inputs = form.querySelectorAll('input, select, textarea, button')
    inputs.forEach(input => {
      (input as HTMLInputElement).disabled = disabled
    })
  }
}

async function checkStatus() {
  const statusText = document.getElementById('status-text')
  const statusDot = document.getElementById('status-dot')
  
  if (!statusText || !statusDot) return
  
  try {
    // Try to run config show to check if configuration is working
    await invoke('run_demostool', {
      command: 'config',
      args: ['show']
    })
    
    statusText.textContent = 'Configuration OK'
    statusDot.className = 'status-dot connected'
  } catch (error) {
    statusText.textContent = 'Configuration needed'
    statusDot.className = 'status-dot error'
    
    // Show configuration helper
    showConfigurationHelper()
  }
}

function showConfigurationHelper() {
  const content = document.querySelector('.content')
  if (!content) return
  
  content.innerHTML = `
    <div class="tool-form active">
      <h2>⚙️ Configuration Required</h2>
      <p>It looks like the Demos SDK Toolkit needs to be configured first.</p>
      <br>
      <h3>Setup Options:</h3>
      <ol>
        <li><strong>Interactive Setup:</strong> Use the Configuration Manager to set up encrypted config</li>
        <li><strong>Environment File:</strong> Create a .env file in the parent directory</li>
        <li><strong>Command Line:</strong> Pass configuration via command line arguments</li>
      </ol>
      <br>
      <button class="btn" onclick="selectTool('config')">Open Configuration Manager</button>
    </div>
  `
}