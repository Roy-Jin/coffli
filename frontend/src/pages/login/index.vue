<template>
  <div class="login-page">
    <!-- 登录内容区域 -->
    <div class="login-content">
      <div class="login-container">
        <!-- 登录卡片 -->
        <div class="login-card">
          <div class="login-card-header">
            <h1 class="login-title">{{ $t('login.title') }}</h1>
            <p class="login-subtitle">{{ $t('login.subtitle') }}</p>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <!-- 用户名输入 -->
            <div class="form-group">
              <label for="username" class="form-label">
                <i class="form-icon fas fa-user"></i>
                {{ $t('login.username') }}
              </label>
              <input id="username" v-model="form.username" type="text" class="form-input"
                :placeholder="$t('login.usernamePlaceholder')" autocomplete="username" />
            </div>

            <!-- 密码输入 -->
            <div class="form-group">
              <label for="password" class="form-label">
                <i class="form-icon fas fa-lock"></i>
                {{ $t('login.password') }}
              </label>
              <input id="password" v-model="form.password" type="password" class="form-input"
                :placeholder="$t('login.passwordPlaceholder')" autocomplete="current-password" />
            </div>

            <!-- 登录按钮 -->
            <button type="submit" class="login-btn" :disabled="isLoading">
              <i class="btn-icon fas fa-sign-in-alt"></i>
              {{ isLoading ? $t('login.loginLoading') : $t('login.loginButton') }}
            </button>

            <!-- 注册链接 -->
            <div class="register-section">
              <p class="register-text">{{ $t('login.noAccount') }}</p>
              <a @click="navigateToRegister" class="register-link" style="cursor: pointer;">{{ $t('login.registerLink')
              }}</a>
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
import { useUserStore } from '@/stores/user'

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
  password: ''
})

const isLoading = ref(false)

const showError = (message: string, type: string = 'error') => {
  modal?.showToast({
    type,
    message
  })
}

const handleLogin = async () => {
  if (!form.value.username.trim()) {
    showError(t('login.validation.usernameRequired'), 'warning')
    return
  }

  if (!form.value.password.trim()) {
    showError(t('login.validation.passwordRequired'), 'warning')
    return
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/.test(form.value.username.trim())) {
    showError(t('login.validation.usernameFormat'), 'warning')
    return
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/.test(form.value.password.trim())) {
    showError(t('login.validation.passwordFormat'), 'warning')
    return
  }

  isLoading.value = true

  try {
    const response = await apiClient.login({
      username: form.value.username.trim(),
      password: form.value.password.trim()
    })

    if (response.status === 200) {
      modal?.showToast({
        type: 'success',
        message: t('login.successMessage')
      })

      const response = await apiClient.getUserInfo()
      if (response.status === 200 && response.data) {
        useUserStore().setUser(response.data)
      }
      router.replace('/')
    } else {
      // 根据状态码显示对应的错误信息
      let errorMessage = t('login.validation.loginFailed')

      switch (response.status) {
        case 400:
          errorMessage = t('login.validation.missingFields')
          break
        case 401:
          errorMessage = t('login.validation.incorrectPassword')
          break
        case 404:
          errorMessage = t('login.validation.userNotFound')
          break
        case 500:
          errorMessage = t('login.validation.serverError')
          break
        default:
          errorMessage = response.error?.message || t('login.validation.loginFailed')
      }

      showError(errorMessage)
    }
  } catch (error) {
    console.error(error)
    showError(t('login.validation.networkError'))
  } finally {
    isLoading.value = false
  }
}

const navigateToRegister = () => {
  router.replace('/register')
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex: 1;
}

.login-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: safe center;
  padding: 2rem 1rem;
  width: 100dvw;
}

.login-container {
  width: 100%;
  max-width: 440px;
}

.login-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
  border-color: rgba(255, 255, 255, 0.2);
}

.login-card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-title {
  font-size: 2.25rem;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--theme-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.login-form {
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

.register-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 2rem;
}

.register-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.error-message i {
  font-size: 0.8rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-content {
    padding: 1.5rem 1rem;
  }

  .login-card {
    padding: 2rem;
    margin: 0;
  }

  .login-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .login-subtitle {
    font-size: 1rem;
  }
}
</style>
