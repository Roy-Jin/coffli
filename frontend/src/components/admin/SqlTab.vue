<template>
  <div class="sql-tab">
    <div class="editor-card">
      <textarea
        v-model="sql"
        class="sql-input"
        :placeholder="$t('admin.sqlPlaceholder')"
        spellcheck="false"
      ></textarea>

      <div class="actions">
        <button class="btn-primary" :disabled="executing || !sql.trim()" @click="execute">
          <Loader2 v-if="executing" class="spin" />
          <span>{{ executing ? $t('admin.executing') : $t('admin.execute') }}</span>
        </button>
        <button class="btn-secondary" :disabled="executing" @click="clear">{{ $t('common.clear') }}</button>
      </div>
    </div>

    <div v-if="error" class="error-box">
      <AlertTriangle />
      <span>{{ error }}</span>
    </div>

    <div v-if="resultBlocks.length" class="results">
      <div v-for="(block, idx) in resultBlocks" :key="idx" class="result-block">
        <div class="result-header">
          <span class="result-index">{{ $t('admin.statement', { n: idx + 1 }) }}</span>
          <span v-if="block.type" class="result-tag" :class="`result-tag--${block.type}`">{{ block.typeLabel }}</span>
        </div>

        <div v-if="block.rows && block.rows.length" class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="col in block.columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rIdx) in block.rows" :key="rIdx">
                <td v-for="col in block.columns" :key="col">{{ formatCell(row[col]) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="block.rows && !block.rows.length" class="empty-hint">{{ $t('admin.noRowsReturned') }}</div>

        <div v-if="block.success !== undefined" class="status-line" :class="block.success ? 'status-line--ok' : 'status-line--err'">
          <CheckCircle v-if="block.success" />
          <XCircle v-else />
          <span>{{ block.success ? $t('admin.executedSuccessfully') : $t('admin.executionFailed') }}</span>
        </div>

        <div v-if="block.meta" class="meta-line">
          <span v-for="(v, k) in block.meta" :key="k" class="meta-item">
            <span class="meta-key">{{ k }}:</span>
            <span class="meta-val">{{ v }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-vue-next'
import adminApi from '@/utils/adminApi'

interface ResultBlock {
  type?: string
  typeLabel?: string
  rows?: Record<string, unknown>[]
  columns: string[]
  success?: boolean
  meta?: Record<string, unknown>
}

const { t } = useI18n()
const sql = ref('')
const executing = ref(false)
const error = ref('')
const rawBlocks = ref<ResultBlock[]>([])

const resultBlocks = computed(() => rawBlocks.value.map((block) => ({
  ...block,
  typeLabel: block.type ? t(`admin.resultTypes.${block.type}`) : undefined,
})))

const execute = async () => {
  if (!sql.value.trim() || executing.value) return
  executing.value = true
  error.value = ''
  rawBlocks.value = []
  try {
    const res = await adminApi.post<{ results: unknown[] }>('/admin/sql', { sql: sql.value })
    if (res.status >= 400) {
      throw new Error(res.error?.message || t('admin.executeFailed'))
    }
    const results = res.data?.results ?? []
    rawBlocks.value = results.map((item) => {
      const obj = (item ?? {}) as Record<string, unknown>
      const rows = Array.isArray(obj.results) ? obj.results as Record<string, unknown>[] : undefined
      const columns = rows && rows.length ? Object.keys(rows[0]!) : []
      const type = typeof obj.type === 'string' ? obj.type : undefined
      return {
        type,
        rows,
        columns,
        success: typeof obj.success === 'boolean' ? obj.success : undefined,
        meta: obj.meta && typeof obj.meta === 'object' ? obj.meta as Record<string, unknown> : undefined,
      }
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('admin.executeFailed')
  } finally {
    executing.value = false
  }
}

const clear = () => {
  sql.value = ''
  error.value = ''
  rawBlocks.value = []
}

const formatCell = (val: unknown): string => {
  if (val === null || val === undefined) return t('common.notAvailable')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
</script>

<style scoped>
.sql-tab {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.editor-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 1.25rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sql-input {
  width: 100%;
  min-height: 180px;
  resize: vertical;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: var(--border-light);
  border-radius: 0.75rem;
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.sql-input:focus {
  outline: none;
  border-color: var(--theme-color);
  box-shadow: 0 0 0 3px var(--theme-focus);
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.25s ease;
}

.btn-primary {
  background: var(--theme-color);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 8px 20px var(--theme-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: var(--border-light);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-box {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--error-color);
  border-radius: 0.75rem;
  color: var(--error-color);
}

.results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-block {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.result-index {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.result-tag {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.result-tag--query {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.result-tag--command {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning-color);
}

.table-wrap {
  overflow-x: auto;
  border: var(--border-light);
  border-radius: 0.625rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table thead th {
  text-align: left;
  padding: 0.625rem 0.875rem;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: var(--border-light);
  white-space: nowrap;
  background: var(--bg-secondary);
}

.data-table tbody td {
  padding: 0.625rem 0.875rem;
  color: var(--text-primary);
  border-bottom: var(--border-light);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.82rem;
  word-break: break-all;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.empty-hint {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  padding: 0.5rem 0;
}

.status-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-line--ok {
  color: var(--success-color);
}

.status-line--err {
  color: var(--error-color);
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  font-size: 0.78rem;
  color: var(--text-tertiary);
}

.meta-item {
  display: inline-flex;
  gap: 0.25rem;
}

.meta-key {
  color: var(--text-secondary);
}
</style>
