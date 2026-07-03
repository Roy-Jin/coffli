<template>
  <div class="admin-page">
    <!-- Top bar -->
    <header class="top-bar">
      <div class="top-bar-left">
        <img src="@/assets/icon.png" class="top-logo" />
        <span class="top-title text-gradient">{{ $t('admin.adminPanel') }}</span>
      </div>
      <a href="/" class="back-link">
        <ArrowLeft />
        <span>{{ $t('admin.backToSite') }}</span>
      </a>
    </header>

    <!-- Tab bar -->
    <nav class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <!-- Tab content -->
    <main class="tab-content">
      <KeepAlive>
        <DashboardTab v-if="activeTab === 'dashboard'" />
        <SqlTab v-else-if="activeTab === 'sql'" />
        <KvTab v-else-if="activeTab === 'kv'" />
        <SystemTab v-else-if="activeTab === 'system'" />
      </KeepAlive>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, markRaw, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, LineChart, Database, Key, Settings } from 'lucide-vue-next'
import DashboardTab from '@/components/admin/DashboardTab.vue'
import SqlTab from '@/components/admin/SqlTab.vue'
import KvTab from '@/components/admin/KvTab.vue'
import SystemTab from '@/components/admin/SystemTab.vue'

const { t } = useI18n()

interface Tab {
  id: 'dashboard' | 'sql' | 'kv' | 'system'
  label: string
  icon: ReturnType<typeof markRaw>
}

const tabs = computed<Tab[]>(() => [
  { id: 'dashboard', label: t('admin.dashboard'), icon: markRaw(LineChart) },
  { id: 'sql', label: t('admin.sql'), icon: markRaw(Database) },
  { id: 'kv', label: t('admin.kvStore'), icon: markRaw(Key) },
  { id: 'system', label: t('admin.system'), icon: markRaw(Settings) },
])

const activeTab = ref<Tab['id']>('dashboard')

const injectHeader = inject('header') as {
  show: () => void
  hide: () => void
} | undefined

onMounted(() => {
  injectHeader?.hide()
})

onUnmounted(() => {
  injectHeader?.show()
})
</script>

<style scoped>
.admin-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* Top bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: var(--border-light);
  backdrop-filter: blur(20px);
  background: rgba(25, 31, 43, 0.8);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.top-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.top-title {
  font-family: 'Pacifico', cursive;
  font-size: 1.3rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: var(--border-light);
  transition: all 0.2s ease;
}

.back-link::after {
  display: none;
}

.back-link:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

/* Tab bar */
.tab-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-bottom: var(--border-light);
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-bar::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.tab-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.tab-item.active {
  background: var(--theme-color);
  color: white;
}

/* Tab content */
.tab-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .top-bar {
    padding: 0.75rem 1rem;
  }

  .tab-bar {
    padding: 0.5rem 0.75rem;
  }

  .tab-item {
    padding: 0.5rem 0.875rem;
    font-size: 0.85rem;
  }

  .tab-item span {
    display: none;
  }

  .tab-item :deep(.lucide) {
    width: 1.1rem;
    height: 1.1rem;
  }

  .tab-content {
    padding: 1rem;
  }

  .back-link span {
    display: none;
  }
}
</style>
