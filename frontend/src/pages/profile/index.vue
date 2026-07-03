<template>
  <div class="profile-page">
    <main class="main-content">
      <div class="container">
        <div class="profile-card">
          <!-- Avatar + identity -->
          <div class="avatar-section">
            <div class="avatar-container">
              <img :src="userAvatar" :alt="$t('header.avatarAlt')" class="avatar" />
            </div>
            <h1 class="display-name text-gradient">{{ displayName }}</h1>
            <p class="username">@{{ githubLogin }}</p>
            <span class="role-badge" :class="{ 'role-badge--admin': isAdmin }">
              <Shield v-if="isAdmin" />
              <User v-else />
              {{ roleLabel }}
            </span>
          </div>

          <!-- Basic info -->
          <div class="info-section">
            <h2 class="section-title">{{ $t('profile.basicInfo') }}</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label"><Mail /> {{ $t('profile.email') }}</span>
                <span class="info-value">{{ userEmail }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><CalendarDays /> {{ $t('profile.registrationTime') }}</span>
                <span class="info-value">{{ memberSince }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><Clock /> {{ $t('profile.lastLogin') }}</span>
                <span class="info-value">{{ lastLogin }}</span>
              </div>
            </div>
          </div>

          <!-- Bio -->
          <div v-if="userBio" class="info-section">
            <h2 class="section-title">{{ $t('profile.bio') }}</h2>
            <p class="bio-text">{{ userBio }}</p>
          </div>

          <!-- Primary actions -->
          <div class="action-section">
            <button class="btn btn-primary" @click="handleEdit">
              <Pencil /> {{ $t('profile.edit') }}
            </button>
            <button class="btn btn-secondary" @click="handleLogout">
              <LogOut /> {{ $t('profile.logout') }}
            </button>
          </div>

          <!-- Password -->
          <div class="action-section">
            <button class="btn btn-secondary" @click="handleChangePassword">
              <Key /> {{ $t('profile.changePassword') }}
            </button>
          </div>

          <!-- Danger zone -->
          <div class="danger-zone">
            <h2 class="section-title danger-title">{{ $t('profile.dangerZone') }}</h2>
            <div class="danger-action">
              <div class="danger-text">
                <span class="danger-label">{{ $t('profile.deleteAccount') }}</span>
                <span class="danger-desc">{{ $t('profile.deleteAccountConfirm') }}</span>
              </div>
              <button class="btn btn-danger" @click="handleDeleteAccount">
                <Trash2 /> {{ $t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Shield,
  User,
  Mail,
  CalendarDays,
  Clock,
  Pencil,
  LogOut,
  Key,
  Trash2,
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import apiClient from '@/api'
import defaultAvatar from '@/assets/defaultAvatar.svg'

interface ModalApi {
  showToast: (options: { type?: string; title?: string; message: string; duration?: number }) => void
  hideToast: () => void
  showModal: (options: any) => void
  hideModal: () => void
}

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const modal = inject('modal') as ModalApi

const loading = ref(false)

const user = computed(() => userStore.getUser)

const userAvatar = computed(() => userStore.getAvatar || defaultAvatar)

const displayName = computed(() => userStore.getDisplayName || t('profile.unknownUser'))

const githubLogin = computed(() => userStore.getUsername || '')

const userEmail = computed(() => user.value?.email || t('profile.notSet'))

const userBio = computed(() => user.value?.bio || '')

const isAdmin = computed(() => userStore.isAdmin)

const roleLabel = computed(() => (userStore.isAdmin ? t('profile.admin') : t('profile.member')))

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return t('common.never')
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return t('common.unknown')
  return d.toLocaleDateString()
}

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return t('common.never')
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return t('common.unknown')
  return d.toLocaleString()
}

const memberSince = computed(() => formatDate(user.value?.created_at || null))

const lastLogin = computed(() => formatDateTime(user.value?.last_login_at || null))

const handleEdit = () => {
  router.push('/profile/edit')
}

const handleLogout = () => {
  modal?.showModal({
    type: 'confirm',
    title: t('confirmation.logoutTitle'),
    message: t('confirmation.logoutMessage'),
    confirmText: t('profile.logout'),
    cancelText: t('modal.cancel'),
    onConfirm: async () => {
      loading.value = true
      try {
        await apiClient.logout()
        modal?.showToast({ type: 'success', message: t('profile.logoutSuccess') })
        router.push('/')
      } catch (error) {
        console.error(error)
        modal?.showToast({ type: 'error', message: t('profile.logoutFailed') })
      } finally {
        loading.value = false
      }
    }
  })
}

const handleChangePassword = () => {
  modal?.showModal({
    type: 'input',
    title: t('profile.changePassword'),
    message: t('profile.newPasswordPrompt'),
    inputType: 'password',
    placeholder: t('profile.newPasswordPlaceholder'),
    confirmText: t('profile.setPassword'),
    cancelText: t('modal.cancel'),
    onConfirm: async (password: string) => {
      const pwd = (password || '').trim()
      if (pwd.length < 8) {
        modal?.showToast({ type: 'error', message: t('profile.passwordMinLength') })
        return
      }
      loading.value = true
      try {
        const res = await apiClient.setPassword(pwd)
        if (res.status === 200) {
          modal?.showToast({ type: 'success', message: t('profile.passwordUpdated') })
        } else {
          modal?.showToast({ type: 'error', message: res.error?.message || t('profile.passwordUpdateFailed') })
        }
      } catch (error) {
        console.error(error)
        modal?.showToast({ type: 'error', message: t('profile.networkError') })
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDeleteAccount = () => {
  modal?.showModal({
    type: 'confirm',
    title: t('profile.deleteAccount'),
    message: t('profile.deleteAccountConfirm'),
    confirmText: t('profile.deleteAccount'),
    cancelText: t('modal.cancel'),
    onConfirm: async () => {
      loading.value = true
      try {
        const res = await apiClient.deleteAccount()
        if (res.status === 200) {
          modal?.showToast({ type: 'success', message: t('profile.accountDeleted') })
          router.push('/')
        } else {
          modal?.showToast({ type: 'error', message: res.error?.message || t('profile.accountDeleteFailed') })
        }
      } catch (error) {
        console.error(error)
        modal?.showToast({ type: 'error', message: t('profile.networkError') })
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.replace('/login')
    return
  }
  try {
    const ok = await apiClient.checkAuth()
    if (!ok) {
      modal?.showToast({ type: 'error', message: t('profile.sessionExpired') })
      router.replace('/login')
    }
  } catch (error) {
    console.error(error)
    router.replace('/login')
  }
})
</script>

<style scoped>
.main-content {
  padding: 2rem 0;
  display: flex;
  align-items: center;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

.profile-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.avatar-section {
  text-align: center;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: var(--border-light);
}

.avatar-container {
  margin-bottom: 1.25rem;
}

.avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 4px solid var(--theme-color);
  object-fit: cover;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
}

.display-name {
  font-size: 2.25rem;
  margin-bottom: 0.25rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.username {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: var(--border-light);
}

.role-badge--admin {
  background: var(--theme-color);
  color: var(--text-primary);
  border: none;
}

.info-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  margin-bottom: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 1.25rem;
  background: var(--theme-color);
  border-radius: 2px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.25rem;
  background: var(--bg-secondary);
  border: var(--border-light);
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.info-label {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.info-label :deep(.lucide) {
  color: var(--theme-color);
}

.info-value {
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-word;
}

.bio-text {
  color: var(--text-secondary);
  line-height: 1.7;
  padding: 1rem 1.25rem;
  background: var(--bg-secondary);
  border: var(--border-light);
  border-radius: 0.75rem;
}

.action-section {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--theme-color);
  color: var(--text-primary);
}

.btn-primary:hover {
  box-shadow: var(--shadow-md);
  filter: brightness(1.05);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: var(--border-light);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  filter: brightness(1.1);
  box-shadow: var(--shadow-md);
}

.danger-zone {
  margin-top: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 1rem;
  background: rgba(239, 68, 68, 0.05);
}

.danger-title::before {
  background: var(--error-color);
}

.danger-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.danger-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.danger-label {
  font-weight: 600;
  color: var(--text-primary);
}

.danger-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-danger {
  background: var(--error-color);
  color: var(--text-primary);
}

.btn-danger:hover {
  box-shadow: var(--shadow-md);
  filter: brightness(1.05);
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem 0;
  }

  .profile-card {
    padding: 1.75rem;
  }

  .avatar {
    width: 110px;
    height: 110px;
  }

  .display-name {
    font-size: 1.85rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .profile-card {
    padding: 1.25rem;
  }

  .avatar {
    width: 90px;
    height: 90px;
  }

  .display-name {
    font-size: 1.5rem;
  }

  .action-section {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .danger-action {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
