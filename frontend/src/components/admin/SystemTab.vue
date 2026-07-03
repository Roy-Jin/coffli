<template>
  <div class="system-tab">
    <div class="warning-box">
      <AlertTriangle />
      <span>{{ $t('admin.initWarning') }}</span>
    </div>

    <div class="action-card">
      <button class="btn-primary" :disabled="initializing" @click="initialize">
        <Loader2 v-if="initializing" class="spin" />
        <Rocket v-else />
        <span>{{ initializing ? $t('admin.initializing') : $t('admin.initializeSystem') }}</span>
      </button>
    </div>

    <div v-if="error" class="error-box">
      <AlertTriangle />
      <span>{{ error }}</span>
    </div>

    <div v-if="info" class="info-box">
      <Info />
      <span>{{ info }}</span>
    </div>

    <div v-if="result" class="result-card">
      <div class="result-message">
        <CheckCircle />
        <span>{{ result.message }}</span>
      </div>

      <div v-if="result.kv" class="section">
        <h4 class="section-title">
          <Database />
          {{ $t('admin.kvDefaultsTitle', { count: kvEntries.length }) }}
        </h4>
        <ul class="kv-list">
          <li v-for="entry in kvEntries" :key="entry[0]" class="kv-item">
            <span class="kv-name">{{ entry[0] }}</span>
            <span class="kv-value">{{ entry[1] }}</span>
          </li>
        </ul>
      </div>

      <div v-if="result.d1" class="section">
        <h4 class="section-title">
          <Table />
          {{ $t('admin.d1TableInit') }}
        </h4>
        <div class="d1-status">
          <div class="status-line" :class="result.d1.success === false ? 'status-line--err' : 'status-line--ok'">
            <XCircle v-if="result.d1.success === false" />
            <CheckCircle v-else />
            <span>{{ result.d1.success === false ? $t('admin.executionFailed') : $t('admin.tablesCreated') }}</span>
          </div>
          <div v-if="result.d1.meta" class="meta-line">
            <span v-for="(v, k) in result.d1.meta" :key="k" class="meta-item">
              <span class="meta-key">{{ k }}:</span>
              <span class="meta-val">{{ v }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Loader2,
  Rocket,
  AlertTriangle,
  Info,
  CheckCircle,
  Database,
  Table,
  XCircle,
} from 'lucide-vue-next'
import adminApi from '@/utils/adminApi'

interface InitResult {
  message: string
  kv?: Record<string, string>
  d1?: { results?: unknown[]; success?: boolean; meta?: Record<string, unknown> }
}

const { t } = useI18n()
const initializing = ref(false)
const result = ref<InitResult | null>(null)
const kvEntries = ref<Array<[string, string]>>([])
const error = ref('')
const info = ref('')

const initialize = async () => {
  if (initializing.value) return
  initializing.value = true
  error.value = ''
  info.value = ''
  result.value = null
  kvEntries.value = []
  try {
    const res = await adminApi.post<{ message: string; data?: { kv: Record<string, string>; d1: InitResult['d1'] } }>('/admin/init')
    if (res.status >= 400) {
      throw new Error(res.error?.message || t('admin.initializeFailed'))
    }
    const payload = res.data
    if (!payload) {
      throw new Error(t('admin.emptyResponse'))
    }
    if (payload.data) {
      result.value = {
        message: payload.message,
        kv: payload.data.kv,
        d1: payload.data.d1,
      }
      kvEntries.value = payload.data.kv ? Object.entries(payload.data.kv) : []
    } else {
      info.value = payload.message || t('admin.alreadyInitialized')
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('admin.initializeFailed')
  } finally {
    initializing.value = false
  }
}
</script>

<style scoped>
.system-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.warning-box {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.125rem;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid var(--warning-color);
  border-radius: 0.75rem;
  color: var(--warning-color);
  font-size: 0.9rem;
}

.action-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 1.25rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.625rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--theme-color);
  color: #fff;
  transition: all 0.25s ease;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 8px 20px var(--theme-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-box {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.125rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid var(--error-color);
  border-radius: 0.75rem;
  color: var(--error-color);
  font-size: 0.9rem;
}

.info-box {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.125rem;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid var(--theme-color);
  border-radius: 0.75rem;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.info-box :deep(.lucide) {
  color: var(--theme-color);
}

.result-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 1.25rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.result-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--success-color);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.section-title :deep(.lucide) {
  color: var(--theme-color);
}

.kv-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.kv-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  font-size: 0.82rem;
}

.kv-name {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: var(--text-primary);
  min-width: 200px;
  flex-shrink: 0;
}

.kv-value {
  color: var(--text-tertiary);
  word-break: break-all;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.d1-status {
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
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
  gap: 0.5rem 1rem;
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

@media (max-width: 768px) {
  .kv-name {
    min-width: 140px;
  }
}
</style>
