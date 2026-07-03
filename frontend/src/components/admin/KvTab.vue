<template>
  <div class="kv-tab">
    <div class="top-bar">
      <span class="key-count">{{ $t('admin.keyCount', { count: keys.length }) }}</span>
      <button class="btn-secondary" :disabled="loadingKeys" @click="refresh">
        <Loader2 v-if="loadingKeys" class="spin" />
        <RotateCcw v-else />
        <span>{{ $t('common.refresh') }}</span>
      </button>
    </div>

    <div class="kv-layout">
      <aside class="key-list">
        <div v-if="loadingKeys" class="hint">{{ $t('admin.loadingKeys') }}</div>
        <div v-else-if="!keys.length" class="hint">{{ $t('admin.noKeysFound') }}</div>
        <ul v-else class="keys">
          <li
            v-for="key in keys"
            :key="key.name"
            class="key-item"
            :class="{ 'key-item--active': selectedKey === key.name }"
            @click="selectKey(key.name)"
          >
            <Key />
            <span class="key-name">{{ key.name }}</span>
          </li>
        </ul>
      </aside>

      <section class="editor">
        <div v-if="!selectedKey" class="hint hint--center">{{ $t('admin.selectKeyHint') }}</div>
        <template v-else>
          <div class="editor-header">
            <span class="editor-key">{{ selectedKey }}</span>
            <div class="editor-actions">
              <button class="btn-primary" :disabled="saving || deleting" @click="save">
                <Loader2 v-if="saving" class="spin" />
                <Save v-else />
                <span>{{ $t('common.save') }}</span>
              </button>
              <button class="btn-danger" :disabled="saving || deleting" @click="remove">
                <Loader2 v-if="deleting" class="spin" />
                <Trash2 v-else />
                <span>{{ $t('common.delete') }}</span>
              </button>
            </div>
          </div>
          <textarea
            v-model="currentValue"
            class="value-input"
            :placeholder="$t('admin.keyValuePlaceholder')"
            spellcheck="false"
          ></textarea>

          <div class="defaults">
            <h4 class="defaults-title">
              <Bookmark />
              {{ $t('admin.managedDefaultKeys') }}
            </h4>
            <ul class="defaults-list">
              <li v-for="d in defaults" :key="d.name" class="defaults-item">
                <span class="defaults-name">{{ d.name }}</span>
                <span class="defaults-value">{{ d.value }}</span>
              </li>
              <li v-if="!defaults.length" class="hint">{{ $t('admin.noDefaults') }}</li>
            </ul>
          </div>
        </template>
      </section>
    </div>

    <div v-if="statusMsg" class="status-bar" :class="`status-bar--${statusType}`">
      <CheckCircle v-if="statusType === 'success'" />
      <AlertCircle v-else />
      <span>{{ statusMsg }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Loader2,
  RotateCcw,
  Key,
  Save,
  Trash2,
  Bookmark,
  CheckCircle,
  AlertCircle,
} from 'lucide-vue-next'
import adminApi from '@/utils/adminApi'

interface KvKey { name: string }
interface KvDefault { name: string; value: string }

const { t } = useI18n()
const keys = ref<KvKey[]>([])
const defaults = ref<KvDefault[]>([])
const selectedKey = ref('')
const currentValue = ref('')
const loadingKeys = ref(false)
const saving = ref(false)
const deleting = ref(false)
const statusMsg = ref('')
const statusType = ref<'success' | 'error'>('success')
let statusTimer: ReturnType<typeof setTimeout> | undefined

const showStatus = (type: 'success' | 'error', msg: string) => {
  statusMsg.value = msg
  statusType.value = type
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => { statusMsg.value = '' }, 3000)
}

const fetchKeys = async () => {
  loadingKeys.value = true
  try {
    const res = await adminApi.get<{ keys: KvKey[] }>('/admin/kv/list')
    if (res.status >= 400) throw new Error(res.error?.message || t('admin.loadKeysFailed'))
    keys.value = res.data?.keys ?? []
  } catch (e) {
    showStatus('error', e instanceof Error ? e.message : t('admin.loadKeysFailed'))
  } finally {
    loadingKeys.value = false
  }
}

const fetchDefaults = async () => {
  try {
    const res = await adminApi.get<{ keys: KvDefault[] }>('/admin/kv/defaults')
    if (res.status >= 400) return
    defaults.value = res.data?.keys ?? []
  } catch {
    // defaults are informational; ignore failures
  }
}

const selectKey = async (key: string) => {
  selectedKey.value = key
  currentValue.value = ''
  try {
    const res = await adminApi.get<{ key: string; value: string }>(`/admin/kv/${encodeURIComponent(key)}`)
    if (res.status >= 400) {
      showStatus('error', res.error?.message || t('admin.loadKeyValueFailed'))
      return
    }
    currentValue.value = res.data?.value ?? ''
  } catch (e) {
    showStatus('error', e instanceof Error ? e.message : t('admin.loadKeyValueFailed'))
  }
}

const save = async () => {
  if (!selectedKey.value || saving.value) return
  saving.value = true
  try {
    const res = await adminApi.put<{ key: string; value: string }>(
      `/admin/kv/${encodeURIComponent(selectedKey.value)}`,
      { value: currentValue.value },
    )
    if (res.status >= 400) {
      showStatus('error', res.error?.message || t('admin.saveKeyFailed'))
      return
    }
    showStatus('success', t('admin.keySaved', { key: selectedKey.value }))
    await fetchKeys()
  } catch (e) {
    showStatus('error', e instanceof Error ? e.message : t('admin.saveKeyFailed'))
  } finally {
    saving.value = false
  }
}

const remove = async () => {
  if (!selectedKey.value || deleting.value) return
  if (!confirm(t('admin.deleteKeyConfirm', { key: selectedKey.value }))) return
  deleting.value = true
  try {
    const res = await adminApi.delete<{ key: string }>(`/admin/kv/${encodeURIComponent(selectedKey.value)}`)
    if (res.status >= 400) {
      showStatus('error', res.error?.message || t('admin.deleteKeyFailed'))
      return
    }
    showStatus('success', t('admin.keyDeleted', { key: selectedKey.value }))
    selectedKey.value = ''
    currentValue.value = ''
    await fetchKeys()
  } catch (e) {
    showStatus('error', e instanceof Error ? e.message : t('admin.deleteKeyFailed'))
  } finally {
    deleting.value = false
  }
}

const refresh = () => {
  fetchKeys()
}

onMounted(() => {
  fetchKeys()
  fetchDefaults()
})
</script>

<style scoped>
.kv-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);
}

.key-count {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.kv-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1rem;
  align-items: start;
}

.key-list {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);
  padding: 0.5rem;
  max-height: 480px;
  overflow-y: auto;
}

.keys {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.key-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.85rem;
  transition: background 0.2s ease, color 0.2s ease;
}

.key-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.key-item--active {
  background: var(--theme-color);
  color: #fff;
}

.key-item--active:hover {
  color: #fff;
}

.key-item :deep(.lucide) {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.key-name {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  word-break: break-all;
}

.editor {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 300px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.editor-key {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 600;
  word-break: break-all;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.value-input {
  width: 100%;
  min-height: 180px;
  resize: vertical;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.88rem;
  line-height: 1.5;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: var(--border-light);
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
}

.value-input:focus {
  outline: none;
  border-color: var(--theme-color);
  box-shadow: 0 0 0 3px var(--theme-focus);
}

.defaults {
  border-top: var(--border-light);
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.defaults-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

.defaults-title :deep(.lucide) {
  color: var(--theme-color);
}

.defaults-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.defaults-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0.625rem;
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  font-size: 0.8rem;
}

.defaults-name {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: var(--text-primary);
  min-width: 180px;
  flex-shrink: 0;
}

.defaults-value {
  color: var(--text-tertiary);
  word-break: break-all;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.hint {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
}

.hint--center {
  text-align: center;
  padding: 3rem 1rem;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.88rem;
}

.status-bar--success {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-color);
  border: 1px solid var(--success-color);
}

.status-bar--error {
  background: rgba(239, 68, 68, 0.12);
  color: var(--error-color);
  border: 1px solid var(--error-color);
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.25s ease;
}

.btn-primary {
  background: var(--theme-color);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 16px var(--theme-hover);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: var(--border-light);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
}

.btn-danger {
  background: var(--error-color);
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  box-shadow: 0 6px 16px var(--error-color);
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .kv-layout {
    grid-template-columns: 1fr;
  }

  .key-list {
    max-height: 240px;
  }

  .editor-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .defaults-name {
    min-width: 120px;
  }
}
</style>
