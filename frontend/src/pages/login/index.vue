<template>
  <div class="auth-page">
    <div class="auth-content">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-card-header">
            <div class="auth-logo">
              <img :src="logo" :alt="$t('header.appName')" class="logo-image" />
            </div>
            <h1 class="auth-title">{{ $t('login.welcomeBack') }}</h1>
            <p class="auth-subtitle">{{ $t('login.signInSubtitle') }}</p>
          </div>

          <form class="auth-form" @submit.prevent="handleLogin" novalidate>
            <div class="form-group">
              <label for="username" class="form-label">{{ $t('login.username') }}</label>
              <div class="input-wrapper">
                <User class="input-icon" />
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  class="form-input"
                  :class="{ 'has-error': errors.username }"
                  :placeholder="$t('login.usernamePlaceholder')"
                  autocomplete="username"
                  @input="errors.username = ''"
                />
              </div>
              <span v-if="errors.username" class="error-text">
                <AlertCircle />
                {{ errors.username }}
              </span>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">{{ $t('login.password') }}</label>
              <div class="input-wrapper">
                <Lock class="input-icon" />
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ 'has-error': errors.password }"
                  :placeholder="$t('login.passwordPlaceholder')"
                  autocomplete="current-password"
                  @input="errors.password = ''"
                />
                <button
                  type="button"
                  class="toggle-password"
                  :aria-label="$t(showPassword ? 'login.hidePassword' : 'login.showPassword')"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" />
                  <Eye v-else />
                </button>
              </div>
              <span v-if="errors.password" class="error-text">
                <AlertCircle />
                {{ errors.password }}
              </span>
            </div>

            <button type="submit" class="submit-btn" :disabled="isLoading">
              <Loader2 v-if="isLoading" class="spin" />
              <LogIn v-else />
              {{ isLoading ? $t('login.loginLoading') : $t('login.loginButton') }}
            </button>

            <div class="divider">
              <span class="divider-text">{{ $t('common.or') }}</span>
            </div>

            <button type="button" class="github-btn" @click="handleGithubLogin">
              <Github />
              {{ $t('login.githubLogin') }}
            </button>

            <div class="switch-section">
              <span class="switch-text">{{ $t('login.noAccount') }}</span>
              <a class="switch-link" @click="router.push('/register')">{{ $t('login.signUp') }}</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  User,
  Lock,
  AlertCircle,
  EyeOff,
  Eye,
  Loader2,
  LogIn,
  Github,
} from 'lucide-vue-next'
import apiClient from '@/api'
import { useUserStore } from '@/stores/user'
import logo from '@/assets/icon.png'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const modal = inject('modal') as {
  showToast: (options: { type?: string; message: string; duration?: number }) => void
  showModal: (options: any) => void
}

const header = inject('header') as {
  show: () => void
  hide: () => void
}

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errors = ref({
  username: '',
  password: ''
})

const validate = (): boolean => {
  let valid = true
  errors.value.username = ''
  errors.value.password = ''

  if (username.value.trim().length < 3) {
    errors.value.username = t('login.validation.usernameMinLength')
    valid = false
  }

  if (password.value.length < 6) {
    errors.value.password = t('login.validation.passwordMinLength')
    valid = false
  }

  return valid
}

const handleLogin = async () => {
  if (!validate()) return

  isLoading.value = true
  try {
    const res = await apiClient.login(username.value.trim(), password.value)

    if (res.status === 200) {
      modal?.showToast({ type: 'success', message: t('login.welcomeBackMessage') })
      router.push('/')
    } else if (res.status === 401) {
      modal?.showToast({ type: 'error', message: t('login.validation.invalidCredentials') })
    } else {
      modal?.showToast({ type: 'error', message: res.error?.message || t('login.validation.loginFailed') })
    }
  } catch (err) {
    console.error(err)
    modal?.showToast({ type: 'error', message: t('login.validation.networkError') })
  } finally {
    isLoading.value = false
  }
}

const handleGithubLogin = () => {
  window.location.href = apiClient.getGithubLoginUrl()
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    router.push('/')
    return
  }
  header?.hide()
})

onUnmounted(() => {
  header?.show()
})
</script>

<style scoped>
.auth-page {
  display: flex;
  flex: 1;
}

.auth-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: safe center;
  padding: 2rem 1rem;
  width: 100dvw;
}

.auth-container {
  width: 100%;
  max-width: 440px;
}

.auth-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: rgba(255, 255, 255, 0.2);
}

.auth-card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.auth-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-tertiary);
  border: var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-title {
  font-size: 2.25rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--theme-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-tertiary);
  font-size: 0.95rem;
  pointer-events: none;
  transition: color 0.3s ease;
}

.input-wrapper:focus-within .input-icon {
  color: var(--theme-color);
}

.form-input {
  width: 100%;
  padding: 1rem 1.25rem 1rem 2.75rem;
  font-size: 1rem;
}

.form-input.has-error {
  border-color: var(--error-color);
}

.form-input.has-error:focus {
  border-color: var(--error-color);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.toggle-password::before {
  display: none;
}

.toggle-password:hover {
  color: var(--theme-color);
  box-shadow: none;
}

.error-text {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--error-color);
  font-size: 0.85rem;
}

.error-text :deep(.lucide) {
  width: 0.8rem;
  height: 0.8rem;
}

.submit-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.25rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-light);
}

.divider-text {
  padding: 0 1rem;
  color: var(--text-tertiary);
  font-size: 0.85rem;
}

.github-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: var(--border-light);
}

.github-btn:hover {
  background: var(--bg-secondary);
  box-shadow: var(--shadow-md);
}

.switch-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 0.5rem;
}

.switch-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.switch-link {
  color: var(--theme-color);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
}

.switch-link::after {
  bottom: -1px;
}

@media (max-width: 768px) {
  .auth-content {
    padding: 1.5rem 1rem;
  }

  .auth-card {
    padding: 2rem;
  }

  .auth-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }

  .auth-title {
    font-size: 1.75rem;
  }

  .auth-subtitle {
    font-size: 1rem;
  }
}
</style>
