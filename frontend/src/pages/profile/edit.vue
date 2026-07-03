<template>
  <div class="edit-profile-page">
    <main class="main-content">
      <div class="container">
        <div class="edit-card">
          <h1 class="page-title text-gradient">{{ $t('editProfile.title') }}</h1>

          <form @submit.prevent="handleSubmit" class="edit-form">
            <!-- Avatar URL -->
            <div class="form-section">
              <h2 class="section-title">{{ $t('editProfile.avatar') }}</h2>
              <div class="avatar-preview-section">
                <div class="avatar-preview">
                  <img :src="avatarPreview" :alt="$t('editProfile.avatarPreviewAlt')" class="avatar-image" />
                </div>
                <div class="avatar-url-control">
                  <input v-model="formData.avatar_url" type="url" class="form-input"
                    :placeholder="$t('editProfile.avatarUrlPlaceholder')" />
                  <p class="form-hint">{{ $t('editProfile.avatarUrlHint') }}</p>
                </div>
              </div>
            </div>

            <!-- Basic info -->
            <div class="form-section">
              <h2 class="section-title">{{ $t('editProfile.basicInfo') }}</h2>

              <div class="form-group">
                <label for="display_name" class="form-label">{{ $t('editProfile.displayName') }}</label>
                <input id="display_name" v-model="formData.display_name" type="text" class="form-input"
                  :placeholder="$t('editProfile.displayNamePlaceholder')" />
              </div>

              <div class="form-group">
                <label for="email" class="form-label">{{ $t('editProfile.email') }}</label>
                <input id="email" v-model="formData.email" type="email" class="form-input"
                  :placeholder="$t('editProfile.emailPlaceholderExample')" />
              </div>
            </div>

            <!-- Bio -->
            <div class="form-section">
              <h2 class="section-title">{{ $t('editProfile.bio') }}</h2>
              <div class="form-group">
                <label for="bio" class="form-label">{{ $t('editProfile.aboutYou') }}</label>
                <textarea id="bio" v-model="formData.bio" class="form-textarea"
                  :placeholder="$t('editProfile.aboutYouPlaceholder')" rows="4"></textarea>
              </div>
            </div>

            <!-- Actions -->
            <div class="action-section">
              <button type="button" class="btn btn-cancel" @click="handleCancel" :disabled="loading">
                <X /> {{ $t('editProfile.cancel') }}
              </button>
              <button type="submit" class="btn btn-save" :disabled="loading">
                <Save />
                {{ loading ? $t('editProfile.saving') : $t('editProfile.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, Save } from 'lucide-vue-next'
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

const formData = ref({
  display_name: '',
  email: '',
  bio: '',
  avatar_url: ''
})

const avatarPreview = computed(() => formData.value.avatar_url.trim() || defaultAvatar)

const initializeForm = () => {
  const user = userStore.getUser
  formData.value = {
    display_name: user?.display_name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || ''
  }
}

const handleCancel = () => {
  router.push('/profile')
}

const handleSubmit = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const payload = {
      display_name: formData.value.display_name.trim(),
      email: formData.value.email.trim(),
      bio: formData.value.bio.trim(),
      avatar_url: formData.value.avatar_url.trim()
    }

    const res = await apiClient.updateProfile(payload)
    if (res.status === 200) {
      modal?.showToast({ type: 'success', message: t('editProfile.updateSuccess') })
      router.push('/profile')
    } else {
      modal?.showToast({ type: 'error', message: res.error?.message || t('editProfile.updateFailed') })
    }
  } catch (error) {
    console.error(error)
    modal?.showToast({ type: 'error', message: t('editProfile.networkError') })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.replace('/login')
    return
  }
  try {
    const ok = await apiClient.checkAuth()
    if (!ok) {
      modal?.showToast({ type: 'error', message: t('editProfile.sessionExpired') })
      router.replace('/login')
      return
    }
    initializeForm()
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
  min-height: calc(100vh - 80px);
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

.edit-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.page-title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 700;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.2rem;
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
  height: 1.2rem;
  background: var(--theme-color);
  border-radius: 2px;
}

.avatar-preview-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-preview {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--theme-color);
  flex-shrink: 0;
  background: var(--bg-tertiary);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-url-control {
  flex: 1;
  min-width: 0;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: var(--border-light);
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--theme-color);
  box-shadow: 0 0 0 3px var(--theme-focus);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.form-hint {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-top: 0.4rem;
}

.action-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1.5rem;
  border-top: var(--border-light);
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: var(--border-light);
}

.btn-cancel:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: var(--shadow-md);
}

.btn-save {
  background: var(--theme-color);
  color: var(--text-primary);
}

.btn-save:hover:not(:disabled) {
  box-shadow: var(--shadow-md);
  filter: brightness(1.05);
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem 0;
  }

  .edit-card {
    padding: 1.75rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .avatar-preview-section {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .avatar-url-control {
    width: 100%;
  }

  .action-section {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .edit-card {
    padding: 1.25rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .avatar-preview {
    width: 80px;
    height: 80px;
  }
}
</style>
