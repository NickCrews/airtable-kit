import { createSignal, For, Show, onMount, createEffect } from 'solid-js'
import * as atk from 'airtable-kit'
import './App.css'

const STORAGE_KEY = 'airtable-kit:saved-api-keys'
const STORAGE_ENABLED_KEY = 'airtable-kit:storage-enabled'

interface SelectedItems {
  baseId: string
  tableIds: Set<string>
  fieldIdsByTable: Map<string, Set<string>>
}

interface KeyValidation {
  [key: string]: boolean | undefined
}

function App() {
  const [showKeyDialog, setShowKeyDialog] = createSignal(false)
  const [apiKey, setApiKey] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [bases, setBases] = createSignal<atk.types.BaseSchema[]>([])
  const [selectedBaseId, setSelectedBaseId] = createSignal<string>('')
  const [expandedTables, setExpandedTables] = createSignal<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = createSignal<SelectedItems>({
    baseId: '',
    tableIds: new Set(),
    fieldIdsByTable: new Map(),
  })
  const [format, setFormat] = createSignal<'ts' | 'js'>('ts')
  const [generatedCode, setGeneratedCode] = createSignal<string>('')
  const [copied, setCopied] = createSignal(false)
  const [savedKeys, setSavedKeys] = createSignal<string[]>([])
  const [keyValidation, setKeyValidation] = createSignal<KeyValidation>({})
  const [storageEnabled, setStorageEnabled] = createSignal(true)

  onMount(() => {
    try {
      const storageEnabledRaw = localStorage.getItem(STORAGE_ENABLED_KEY)
      const storageEnabledValue = storageEnabledRaw === null ? true : storageEnabledRaw === 'true'
      setStorageEnabled(storageEnabledValue)

      if (!storageEnabledValue) return

      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const keys = parsed.filter((k): k is string => typeof k === 'string')
        setSavedKeys(keys)
        if (keys.length > 0) {
          setApiKey(keys[0])
          autoFetchBase(keys[0])
        }
      }
    } catch {
      setSavedKeys([])
    }
  })

  const autoFetchBase = async (key: string) => {
    try {
      const fetchedBases = await atk.bases.fetchAllSchemas({ fetcher: key })
      if (fetchedBases.length > 0) {
        setBases(fetchedBases)
        setSelectedBaseId(fetchedBases[0].id)
        setKeyValidation((prev) => ({ ...prev, [key]: true }))
        setSelectedItems({
          baseId: fetchedBases[0].id,
          tableIds: new Set(fetchedBases[0].tables.map((t) => t.id)),
          fieldIdsByTable: new Map(
            fetchedBases[0].tables.map((t) => [t.id, new Set(t.fields.map((f) => f.id))])
          ),
        })
      }
    } catch {
      setKeyValidation((prev) => ({ ...prev, [key]: false }))
    }
  }

  const persistKeys = (keys: string[]) => {
    try {
      if (storageEnabled()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
      }
    } catch { }
  }

  const rememberKey = (key: string) => {
    if (!key) return
    setSavedKeys((prev) => {
      if (prev.includes(key)) return prev
      const next = [key, ...prev]
      persistKeys(next)
      return next
    })
  }

  const deleteKey = (key: string) => {
    setSavedKeys((prev) => {
      const next = prev.filter((k) => k !== key)
      persistKeys(next)
      if (apiKey() === key) {
        setApiKey('')
        setBases([])
        setSelectedBaseId('')
        setGeneratedCode('')
      }
      return next
    })
  }

  const displayKey = (key: string) => (key.length <= 17 ? key : `${key.slice(0, 17)}...`)

  const fetchBases = async () => {
    const key = apiKey().trim()
    if (!key) {
      setError('Please enter an API key')
      return
    }

    setLoading(true)
    setError(null)
    setBases([])
    setSelectedBaseId('')
    setGeneratedCode('')

    try {
      const fetchedBases = await atk.bases.fetchAllSchemas({ fetcher: key })
      if (fetchedBases.length === 0) {
        setError('No bases found. Make sure your API key has access to at least one base.')
        setKeyValidation((prev) => ({ ...prev, [key]: false }))
      } else {
        rememberKey(key)
        setBases(fetchedBases)
        setSelectedBaseId(fetchedBases[0].id)
        setKeyValidation((prev) => ({ ...prev, [key]: true }))
        setSelectedItems({
          baseId: fetchedBases[0].id,
          tableIds: new Set(fetchedBases[0].tables.map((t) => t.id)),
          fieldIdsByTable: new Map(
            fetchedBases[0].tables.map((t) => [t.id, new Set(t.fields.map((f) => f.id))])
          ),
        })
        setApiKey('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bases')
      setKeyValidation((prev) => ({ ...prev, [key]: false }))
    } finally {
      setLoading(false)
    }
  }

  const toggleStorageEnabled = (enabled: boolean) => {
    setStorageEnabled(enabled)
    try {
      localStorage.setItem(STORAGE_ENABLED_KEY, String(enabled))
      if (!enabled) {
        localStorage.removeItem(STORAGE_KEY)
        setSavedKeys([])
      }
    } catch { }
  }

  const toggleTable = (tableId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      tableIds: new Set(
        prev.tableIds.has(tableId)
          ? Array.from(prev.tableIds).filter((id) => id !== tableId)
          : [...prev.tableIds, tableId]
      ),
    }))
  }

  const toggleField = (tableId: string, fieldId: string) => {
    setSelectedItems((prev) => {
      const fieldIds = new Set(prev.fieldIdsByTable.get(tableId) || [])
      if (fieldIds.has(fieldId)) {
        fieldIds.delete(fieldId)
      } else {
        fieldIds.add(fieldId)
      }
      return {
        ...prev,
        fieldIdsByTable: new Map(prev.fieldIdsByTable).set(tableId, fieldIds),
      }
    })
  }

  const toggleTableExpanded = (tableId: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev)
      if (next.has(tableId)) {
        next.delete(tableId)
      } else {
        next.add(tableId)
      }
      return next
    })
  }

  const generateSchema = async () => {
    const baseId = selectedItems().baseId
    if (!baseId) {
      setError('Please select a base')
      return
    }

    const base = bases().find((b) => b.id === baseId)
    if (!base) {
      setError('Selected base not found')
      return
    }

    const selected = selectedItems()
    const filteredBase: atk.types.BaseSchema = {
      ...base,
      tables: base.tables
        .filter((t) => selected.tableIds.has(t.id))
        .map((t) => ({
          ...t,
          fields: t.fields.filter((f) => selected.fieldIdsByTable.get(t.id)?.has(f.id)),
        })),
    }

    setLoading(true)
    setError(null)

    try {
      const code = await atk.codegen.generateCode(filteredBase, { format: format() })
      setGeneratedCode(code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schema')
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    if (selectedItems().baseId && selectedItems().tableIds.size > 0) {
      generateSchema()
    }
  })

  const copyToClipboard = async () => {
    const text = generatedCode()
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      } catch { }
    }

    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard. Try using the download button instead.')
    }
  }

  const downloadFile = () => {
    const base = bases().find((b) => b.id === selectedBaseId())
    const baseName = base ? atk.codegen.toIdentifier(base.name) : 'schema'
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

  const currentBase = () => bases().find((b) => b.id === selectedItems().baseId)

  return (
    <div class="app">
      <Show when={showKeyDialog()}>
        <div class="dialog-overlay" onClick={() => setShowKeyDialog(false)}>
          <div class="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div class="dialog-header">
              <h2>Manage API Keys</h2>
              <button class="close-btn" onClick={() => setShowKeyDialog(false)}>×</button>
            </div>
            <div class="dialog-body">
              <div class="key-input-section">
                <label>Add or select an API key</label>
                <div class="input-group">
                  <input
                    value={apiKey()}
                    onInput={(e) => setApiKey(e.currentTarget.value)}
                    placeholder="patJOweymLYMmBpd2..."
                    class="api-key-input"
                  />
                  <button onClick={fetchBases} disabled={loading() || !apiKey().trim()} class="fetch-btn">
                    {loading() ? 'Loading...' : 'Add'}
                  </button>
                </div>
                <p class="hint">
                  Create a personal access token at{' '}
                  <a href="https://airtable.com/create/tokens" target="_blank" rel="noopener noreferrer">
                    airtable.com/create/tokens
                  </a>
                </p>
              </div>

              <Show when={savedKeys().length > 0}>
                <div class="saved-keys">
                  <h3>Saved Keys</h3>
                  <ul class="saved-key-list">
                    <For each={savedKeys()}>
                      {(key) => (
                        <li class="saved-key-row">
                          <div class="key-info">
                            <span class="saved-key-value">{displayKey(key)}</span>
                            <Show when={keyValidation()[key] === false}>
                              <span class="invalid-icon" title="Invalid key">⚠️</span>
                            </Show>
                          </div>
                          <div class="saved-key-actions">
                            <button class="mini-btn" onClick={() => setApiKey(key)}>
                              Use
                            </button>
                            <button class="mini-btn danger" onClick={() => deleteKey(key)}>
                              Delete
                            </button>
                          </div>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>

              <div class="storage-settings">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    checked={storageEnabled()}
                    onChange={(e) => toggleStorageEnabled(e.currentTarget.checked)}
                  />
                  Store API keys in local storage
                </label>
                <p class="hint">Keys are stored only in this browser and never sent to any server.</p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <div class="layout">
        <header class="header">
          <div class="header-left">
            <h1>Airtable Schema Generator</h1>
          </div>
          <div class="header-right">
            <div class="format-options">
              <label class="radio-label">
                <input
                  type="radio"
                  name="format"
                  value="ts"
                  checked={format() === 'ts'}
                  onChange={() => setFormat('ts')}
                />
                TypeScript
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  name="format"
                  value="js"
                  checked={format() === 'js'}
                  onChange={() => setFormat('js')}
                />
                JavaScript
              </label>
            </div>
            <button onClick={copyToClipboard} class="action-btn" disabled={!generatedCode()}>
              {copied() ? '✓ Copied' : 'Copy'}
            </button>
            <button onClick={downloadFile} class="action-btn" disabled={!generatedCode()}>
              Download
            </button>
          </div>
        </header>

        <Show when={error()}>
          <div class="error-bar">{error()}</div>
        </Show>

        <div class="main">
          <aside class="sidebar">
            <button onClick={() => setShowKeyDialog(true)} class="sidebar-key-btn">
              🔑 Manage API Keys
            </button>
            <div class="sidebar-header">
              <h3>Schema</h3>
            </div>

            <Show when={bases().length === 0}>
              <div class="sidebar-empty">
                <p>Click the 🔑 Keys button to add an API key and fetch your bases.</p>
              </div>
            </Show>

            <Show when={bases().length > 0}>
              <div class="tree-view">
                <div class="tree-item">
                  <div class="tree-label">
                    <span class="tree-name">{currentBase()?.name}</span>
                  </div>

                  <div class="tree-children">
                    <For each={currentBase()?.tables || []}>
                      {(table) => {
                        const isExpanded = () => expandedTables().has(table.id)
                        const isSelected = () => selectedItems().tableIds.has(table.id)
                        return (
                          <div class="tree-item nested">
                            <div class="tree-label">
                              <button
                                class="expand-btn"
                                onClick={() => toggleTableExpanded(table.id)}
                              >
                                {isExpanded() ? '▼' : '▶'}
                              </button>
                              <input
                                type="checkbox"
                                checked={isSelected()}
                                onChange={() => toggleTable(table.id)}
                              />
                              <span class="tree-name">{table.name}</span>
                            </div>

                            <Show when={isExpanded() && isSelected()}>
                              <div class="tree-children">
                                <For each={table.fields}>
                                  {(field) => {
                                    const fieldIds = selectedItems().fieldIdsByTable.get(table.id) || new Set()
                                    const isFieldSelected = () => fieldIds.has(field.id)
                                    return (
                                      <div class="tree-item nested nested-field">
                                        <div class="tree-label">
                                          <input
                                            type="checkbox"
                                            checked={isFieldSelected()}
                                            onChange={() => toggleField(table.id, field.id)}
                                          />
                                          <span class="tree-name">{field.name}</span>
                                        </div>
                                      </div>
                                    )
                                  }}
                                </For>
                              </div>
                            </Show>
                          </div>
                        )
                      }}
                    </For>
                  </div>
                </div>
              </div>
            </Show>
          </aside>

          <section class="content">
            <Show when={generatedCode()}>
              <pre class="code-block">
                <code>{generatedCode()}</code>
              </pre>
            </Show>
            <Show when={!generatedCode() && bases().length > 0}>
              <div class="content-empty">
                <p>Select tables and fields to generate schema</p>
              </div>
            </Show>
            <Show when={bases().length === 0}>
              <div class="content-empty">
                <div class="empty-state">
                  <p>No bases loaded</p>
                  <button onClick={() => setShowKeyDialog(true)} class="add-key-btn">
                    🔑 Add API Key
                  </button>
                </div>
              </div>
            </Show>
          </section>
        </div>
      </div>

      <footer>
        <p>
          Part of{' '}
          <a href="https://github.com/NickCrews/airtable-kit" target="_blank" rel="noopener noreferrer">
            airtable-kit
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
