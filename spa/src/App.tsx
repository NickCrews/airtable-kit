import { createSignal, For, Show } from 'solid-js'
import './App.css'

interface BaseInfo {
  id: string
  name: string
  permissionLevel: string
}

interface TableSchema {
  id: string
  name: string
  primaryFieldId?: string
  description?: string
  fields: FieldSchema[]
}

interface FieldSchema {
  id: string
  name: string
  type: string
  description?: string
  options?: Record<string, unknown>
}

interface BaseSchema {
  id: string
  name: string
  tables: TableSchema[]
}

// Simple camelCase converter for identifiers (matches library behavior)
function toIdentifier(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase()) // Convert to camelCase
    .replace(/\s/g, '')
    .replace(/^[0-9]+/, '') // Remove leading numbers
    .replace(/^(.)/, (c) => c.toLowerCase()) // Ensure starts with lowercase
}

// Convert all names to identifiers (like the library's generateCode does)
function namesToIdentifiers(schema: BaseSchema): BaseSchema {
  return {
    ...schema,
    name: toIdentifier(schema.name),
    tables: schema.tables.map((table) => ({
      ...table,
      name: toIdentifier(table.name),
      fields: table.fields.map((field) => ({
        ...field,
        name: toIdentifier(field.name),
      })),
    })),
  }
}

// Generate TypeScript/JavaScript code from schema
function generateCode(schema: BaseSchema, format: 'ts' | 'js'): string {
  const safeSchema = namesToIdentifiers(schema)
  const asConstModifier = format === 'ts' ? ' as const' : ''
  return `/**
 * Auto-generated from Airtable schema
 * Do not edit manually
 */

export default ${JSON.stringify(safeSchema, null, 2)}${asConstModifier};
`
}

// Airtable API functions (browser-compatible)
async function listBases(apiKey: string): Promise<BaseInfo[]> {
  const allBases: BaseInfo[] = []
  let offset: string | undefined

  do {
    const url = offset
      ? `https://api.airtable.com/v0/meta/bases?offset=${offset}`
      : 'https://api.airtable.com/v0/meta/bases'

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `Failed to list bases: ${response.status}`)
    }

    const data = await response.json()
    allBases.push(...data.bases)
    offset = data.offset
  } while (offset)

  return allBases
}

async function getBaseSchema(apiKey: string, baseId: string, baseName: string): Promise<BaseSchema> {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `Failed to get base schema: ${response.status}`)
  }

  const data = await response.json()
  return {
    id: baseId,
    name: baseName,
    tables: data.tables,
  }
}

function App() {
  const [apiKey, setApiKey] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [bases, setBases] = createSignal<BaseInfo[]>([])
  const [selectedBaseId, setSelectedBaseId] = createSignal<string>('')
  const [format, setFormat] = createSignal<'ts' | 'js'>('ts')
  const [generatedCode, setGeneratedCode] = createSignal<string>('')
  const [copied, setCopied] = createSignal(false)

  const fetchBases = async () => {
    if (!apiKey().trim()) {
      setError('Please enter an API key')
      return
    }

    setLoading(true)
    setError(null)
    setBases([])
    setSelectedBaseId('')
    setGeneratedCode('')

    try {
      const fetchedBases = await listBases(apiKey())
      setBases(fetchedBases)
      if (fetchedBases.length === 0) {
        setError('No bases found. Make sure your API key has access to at least one base.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bases')
    } finally {
      setLoading(false)
    }
  }

  const generateSchema = async () => {
    const baseId = selectedBaseId()
    if (!baseId) {
      setError('Please select a base')
      return
    }

    const base = bases().find((b) => b.id === baseId)
    if (!base) {
      setError('Selected base not found')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const schema = await getBaseSchema(apiKey(), baseId, base.name)
      const code = generateCode(schema, format())
      setGeneratedCode(code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schema')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  const downloadFile = () => {
    const base = bases().find((b) => b.id === selectedBaseId())
    const baseName = base ? toIdentifier(base.name) : 'schema'
    const ext = format()
    const filename = `${baseName}.${ext}`
    
    const blob = new Blob([generatedCode()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div class="container">
      <header>
        <h1>Airtable Schema Generator</h1>
        <p class="subtitle">
          Generate TypeScript/JavaScript schema files from your Airtable bases
        </p>
      </header>

      <section class="step">
        <h2>1. Enter your API Key</h2>
        <p class="hint">
          Create a personal access token at{' '}
          <a href="https://airtable.com/create/tokens" target="_blank" rel="noopener noreferrer">
            airtable.com/create/tokens
          </a>
          . Grant at least <code>schema.bases:read</code> permission for the bases you want to access.
        </p>
        <div class="input-group">
          <input
            type="password"
            value={apiKey()}
            onInput={(e) => setApiKey(e.currentTarget.value)}
            placeholder="pat..."
            class="api-key-input"
          />
          <button onClick={fetchBases} disabled={loading() || !apiKey().trim()}>
            {loading() ? 'Loading...' : 'Fetch Bases'}
          </button>
        </div>
      </section>

      <Show when={error()}>
        <div class="error">{error()}</div>
      </Show>

      <Show when={bases().length > 0}>
        <section class="step">
          <h2>2. Select a Base</h2>
          <select
            value={selectedBaseId()}
            onChange={(e) => setSelectedBaseId(e.currentTarget.value)}
            class="base-select"
          >
            <option value="">Select a base...</option>
            <For each={bases()}>
              {(base) => (
                <option value={base.id}>
                  {base.name} ({base.id})
                </option>
              )}
            </For>
          </select>
        </section>

        <section class="step">
          <h2>3. Choose Format</h2>
          <div class="format-options">
            <label class="radio-label">
              <input
                type="radio"
                name="format"
                value="ts"
                checked={format() === 'ts'}
                onChange={() => setFormat('ts')}
              />
              TypeScript (.ts) with <code>as const</code>
            </label>
            <label class="radio-label">
              <input
                type="radio"
                name="format"
                value="js"
                checked={format() === 'js'}
                onChange={() => setFormat('js')}
              />
              JavaScript (.js)
            </label>
          </div>
        </section>

        <section class="step">
          <button
            onClick={generateSchema}
            disabled={loading() || !selectedBaseId()}
            class="generate-btn"
          >
            {loading() ? 'Generating...' : 'Generate Schema'}
          </button>
        </section>
      </Show>

      <Show when={generatedCode()}>
        <section class="step">
          <h2>4. Your Schema</h2>
          <div class="code-actions">
            <button onClick={copyToClipboard} class="action-btn">
              {copied() ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
            <button onClick={downloadFile} class="action-btn">
              Download File
            </button>
          </div>
          <pre class="code-block">
            <code>{generatedCode()}</code>
          </pre>
        </section>
      </Show>

      <footer>
        <p>
          Part of{' '}
          <a href="https://github.com/NickCrews/airtable-kit" target="_blank" rel="noopener noreferrer">
            airtable-kit
          </a>
          {' '}— A type-safe Airtable API client for TypeScript and JavaScript.
        </p>
      </footer>
    </div>
  )
}

export default App
