<template>
  <div class="auth-page">
    <div class="auth-content">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-card-header">
            <div class="auth-logo">
              <img :src="logo" :alt="$t('header.appName')" class="logo-image" />
            </div>
            <h1 class="auth-title">{{ $t('register.createAccount') }}</h1>
            <p class="auth-subtitle">{{ $t('register.githubSubtitle') }}</p>
          </div>

          <div class="auth-form">
            <button type="button" class="github-btn" @click="handleGithubLogin">
              <Github />
              {{ $t('register.githubSignup') }}
            </button>

            <div class="switch-section">
              <span class="switch-text">{{ $t('register.haveAccount') }}</span>
              <a class="switch-link" @click="router.push('/login')">{{ $t('register.signIn') }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Github } from 'lucide-vue-next'
import apiClient from '@/api'
import { useUserStore } from '@/stores/user'
import logo from '@/assets/icon.png'

const router = useRouter()
const userStore = useUserStore()

const header = inject('header') as {
  show: () => void
  hide: () => void
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

.github-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: var(--border-light);
  border-radius: 0.75rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
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
