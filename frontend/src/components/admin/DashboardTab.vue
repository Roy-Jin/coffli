<template>
  <div class="dashboard-tab">
    <div v-if="loading" class="state-block">
      <Loader2 class="spin" />
      <span>{{ $t('admin.loadingDashboard') }}</span>
    </div>

    <div v-else-if="error" class="state-block state-block--error">
      <AlertTriangle />
      <span>{{ error }}</span>
    </div>

    <section v-else class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon--blue">
          <Key />
        </div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('admin.kvKeyCount') }}</div>
          <div class="stat-value">{{ kvKeyCount }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" :class="systemOk ? 'stat-icon--green' : 'stat-icon--red'">
          <Activity v-if="systemOk" />
          <AlertCircle v-else />
        </div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('admin.systemStatus') }}</div>
          <div class="stat-value" :class="systemOk ? 'stat-value--ok' : 'stat-value--err'">
            {{ systemOk ? $t('admin.systemOk') : $t('admin.systemError') }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, AlertTriangle, Key, Activity, AlertCircle } from 'lucide-vue-next'
import adminApi from '@/utils/adminApi'

interface KvKey { name: string }

const { t } = useI18n()
const kvKeyCount = ref(0)
const systemOk = ref(false)
const loading = ref(true)
const error = ref('')

const fetchDashboard = async () => {
  loading.value = true
  error.value = ''
  try {
    const [kvRes, okRes] = await Promise.all([
      adminApi.get<{ keys: KvKey[] }>('/admin/kv/list'),
      adminApi.get<{ message: string }>('/admin/ok'),
    ])

    if (kvRes.status >= 400) {
      throw new Error(kvRes.error?.message || `Failed to load KV keys (${kvRes.status})`)
    }
    if (okRes.status >= 400) {
      throw new Error(okRes.error?.message || `Health check failed (${okRes.status})`)
    }

    kvKeyCount.value = kvRes.data?.keys?.length ?? 0
    systemOk.value = okRes.data?.message === 'OK'
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('admin.dashboardLoadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>

<style scoped>
.dashboard-tab {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.state-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  color: var(--text-secondary);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);
}

.state-block :deep(.lucide) {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--theme-color);
}

.state-block--error {
  border-color: var(--error-color);
  color: var(--error-color);
}

.state-block--error :deep(.lucide) {
  color: var(--error-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-md);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-icon--blue {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.stat-icon--green {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-color);
}

.stat-icon--red {
  background: rgba(239, 68, 68, 0.15);
  color: var(--error-color);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-value--ok {
  color: var(--success-color);
}

.stat-value--err {
  color: var(--error-color);
}
</style>
