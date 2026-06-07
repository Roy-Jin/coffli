<template>
  <div class="register-page">
    <div class="register-content">
      <div class="register-container">
        <!-- 注册卡片 -->
        <div class="register-card">
          <div class="register-card-header">
            <h1 class="register-title">{{ $t('register.title') }}</h1>
            <p class="register-subtitle">{{ $t('register.subtitle') }}</p>
          </div>

          <form class="register-form" @submit.prevent="handleRegister">
            <!-- 用户ID输入 -->
            <div class="form-group">
              <label for="username" class="form-label">
                <i class="form-icon fas fa-user"></i>
                {{ $t('register.username') }}
              </label>
              <input id="username" v-model="form.username" type="text" class="form-input"
                :placeholder="$t('register.usernamePlaceholder')" autocomplete="username" />
            </div>

            <!-- 密码输入 -->
            <div class="form-group">
              <label for="password" class="form-label">
                <i class="form-icon fas fa-lock"></i>
                {{ $t('register.password') }}
              </label>
              <input id="password" v-model="form.password" type="password" class="form-input"
                :placeholder="$t('register.passwordPlaceholder')" autocomplete="new-password" />
            </div>

            <!-- 确认密码输入 -->
            <div class="form-group">
              <label for="confirmPassword" class="form-label">
                <i class="form-icon fas fa-lock"></i>
                {{ $t('register.confirmPassword') }}
              </label>
              <input id="confirmPassword" v-model="form.confirmPassword" type="password" class="form-input"
                :placeholder="$t('register.confirmPasswordPlaceholder')" autocomplete="new-password" />
            </div>

            <!-- 注册按钮 -->
            <button type="submit" class="register-btn" :disabled="isLoading">
              <i class="btn-icon fas fa-user-plus"></i>
              {{ isLoading ? $t('register.registerLoading') : $t('register.registerButton') }}
            </button>

            <!-- 登录链接 -->
            <div class="login-section">
              <p class="login-text">{{ $t('register.haveAccount') }}</p>
              <a @click="navigateToLogin" class="login-link" style="cursor: pointer;">{{ $t('register.loginLink') }}</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import apiClient from '@/api/index'

const router = useRouter()
const { t } = useI18n()

const modal = inject('modal') as {
  showToast: (options: any) => void
  hideToast: () => void
  showModal: (options: any) => void
  hideModal: () => void
}

const form = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)

const showError = (message: string, type: string = 'error') => {
  modal?.showToast({
    type,
    message
  })
}

const handleRegister = async () => {
  if (!form.value.username.trim()) {
    showError(t('register.validation.usernameRequired'), 'warning')
    return
  }

  if (!form.value.password.trim()) {
    showError(t('register.validation.passwordRequired'), 'warning')
    return
  }

  if (!form.value.confirmPassword.trim()) {
    showError(t('register.validation.confirmPasswordRequired'), 'warning')
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    showError(t('register.validation.passwordMismatch'), 'error')
    return
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/.test(form.value.username.trim())) {
    showError(t('register.validation.usernameFormat'), 'warning')
    return
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/.test(form.value.password.trim())) {
    showError(t('register.validation.passwordFormat'), 'warning')
    return
  }

  isLoading.value = true

  try {
    const response = await apiClient.register({
      username: form.value.username.trim(),
      password: form.value.password.trim()
    })

    if (response.status === 201) {
      modal?.showToast({
        type: 'success',
        message: t('register.successMessage'),
      })

      setTimeout(() => {
        router.replace('/login')
      }, 1000)
    } else {
      // 根据状态码显示对应的错误信息
      let errorMessage = t('register.validation.registerFailed')

      switch (response.status) {
        case 400:
          errorMessage = t('register.validation.missingFields')
          break
        case 409:
          errorMessage = t('register.validation.userExists')
          break
        case 500:
          errorMessage = t('register.validation.serverError')
          break
        default:
          errorMessage = response.error?.message || t('register.validation.registerFailed')
      }

      showError(errorMessage)
    }
  } catch (error) {
    console.error(error)
    showError(t('register.validation.networkError'))
  } finally {
    isLoading.value = false
  }
}

const navigateToLogin = () => {
  router.replace('/login')
}
</script>

<style scoped>
.register-page {
  display: flex;
  flex: 1;
}

.register-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: safe center;
  padding: 2rem 1rem;
  width: 100dvw;
}

.register-container {
  width: 100%;
  max-width: 440px;
}

.register-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.register-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
  border-color: rgba(255, 255, 255, 0.2);
}

.register-card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.register-title {
  font-size: 2.25rem;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--theme-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.register-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.form-icon {
  color: var(--theme-color);
  font-size: 0.9rem;
  width: 16px;
}

.btn-icon {
  font-size: 0.9rem;
}

.login-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 2rem;
}

.login-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-content {
    padding: 1.5rem 1rem;
    min-height: calc(100vh - 70px);
  }

  .register-card {
    padding: 2rem;
    margin: 0;
  }

  .register-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .register-card {
    padding: 1.5rem;
  }

  .register-title {
    font-size: 1.75rem;
  }

  .register-subtitle {
    font-size: 1rem;
  }
}
</style>
