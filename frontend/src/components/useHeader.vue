<template>
  <header v-if="isVisible" ref="headerRef" class="header">
    <div class="header-container">
      <!-- Logo -->
      <div class="logo-section" @click="navigateToHome">
        <img src="@/assets/icon.png" class="logo" />
        <h1 class="app-name text-gradient">{{ $t('header.appName') }}</h1>
      </div>

      <!-- Right section -->
      <div class="right-section">
        <!-- Language switcher -->
        <div class="language-dropdown" :class="{ 'language-dropdown--open': isLangOpen }">
          <div class="language-dropdown__trigger" @click="toggleLangDropdown" :title="$t('language.switchLanguage')">
            <Languages class="language-dropdown__icon" />
            <span class="language-dropdown__selected">{{ currentLanguageName }}</span>
            <ChevronDown class="language-dropdown__icon" :class="{ 'rotate-180': isLangOpen }" />
          </div>

          <div v-if="isLangOpen" class="language-dropdown__menu">
            <div v-for="lang in availableLanguages" :key="lang.code" class="language-dropdown__item"
              :class="{ 'language-dropdown__item--active': lang.code === currentLanguage }"
              @click="selectLanguage(lang.code)">
              {{ lang.name }}
            </div>
          </div>
        </div>

        <!-- User area -->
        <div v-if="isLoggedIn" class="user-section" ref="userSectionRef">
          <div class="user-trigger" @click="toggleUserDropdown">
            <img :src="userAvatar" :alt="$t('header.avatarAlt')" class="avatar" />
            <div class="user-details">
              <span class="nickname">{{ displayName }}</span>
              <span class="username">@{{ username }}</span>
            </div>
            <ChevronDown class="dropdown-arrow" :class="{ 'dropdown-arrow--open': isUserOpen }" />
          </div>

          <div v-if="isUserOpen" class="user-menu">
            <div class="menu-item" @click="navigateToProfile">
              <User />
              <span>{{ $t('header.profile') }}</span>
            </div>
            <div v-if="isAdmin" class="menu-item" @click="navigateToAdmin">
              <Shield />
              <span>{{ $t('header.admin') }}</span>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item menu-item--danger" @click="handleLogout">
              <LogOut />
              <span>{{ $t('header.logout') }}</span>
            </div>
          </div>
        </div>

        <!-- Not logged in -->
        <div v-else class="user-section">
          <button class="login-btn" @click="navigateToLogin">
            <LogIn /> {{ $t('header.login') }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Languages, ChevronDown, User, Shield, LogOut, LogIn } from 'lucide-vue-next'
import { useLanguageStore } from '@/stores/language'
import { useUserStore } from '@/stores/user'
import { setI18nLanguage } from '@/i18n'
import apiClient from '@/api'
import defaultAvatar from '@/assets/defaultAvatar.svg'

const router = useRouter()
const { t } = useI18n()
const languageStore = useLanguageStore()
const userStore = useUserStore()

const availableLanguages = computed(() => [
  { code: 'zh', name: t('language.zh') },
  { code: 'en', name: t('language.en') }
])

const currentLanguage = computed(() => languageStore.getCurrentLanguage)

const currentLanguageName = computed(() => {
  const lang = availableLanguages.value.find(l => l.code === currentLanguage.value)
  return lang ? lang.name : availableLanguages.value[0]?.name ?? t('language.en')
})

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.isAdmin)
const displayName = computed(() => userStore.getDisplayName || t('profile.unknownUser'))
const username = computed(() => userStore.getUsername || '')
const userAvatar = computed(() => userStore.getAvatar || defaultAvatar)

const isLangOpen = ref(false)
const isUserOpen = ref(false)
const userSectionRef = ref<HTMLElement>()

const toggleLangDropdown = () => {
  isLangOpen.value = !isLangOpen.value
  isUserOpen.value = false
}

const toggleUserDropdown = () => {
  isUserOpen.value = !isUserOpen.value
  isLangOpen.value = false
}

const selectLanguage = (langCode: string) => {
  languageStore.setLanguage(langCode)
  setI18nLanguage(langCode)
  isLangOpen.value = false
}

const closeDropdowns = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.language-dropdown')) {
    isLangOpen.value = false
  }
  if (!target.closest('.user-section')) {
    isUserOpen.value = false
  }
}

const navigateToHome = () => {
  router.push('/')
}

const navigateToLogin = () => {
  router.push('/login')
}

const navigateToProfile = () => {
  isUserOpen.value = false
  router.push('/profile')
}

const navigateToAdmin = () => {
  isUserOpen.value = false
  router.push('/admin')
}

const handleLogout = async () => {
  isUserOpen.value = false
  try {
    await apiClient.logout()
  } catch (error) {
    console.error(error)
  }
  router.push('/')
}

onMounted(() => {
  document.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})

const headerRef = ref<HTMLElement>()
const isVisible = ref(true)

const show = () => {
  isVisible.value = true
}

const hide = () => {
  isVisible.value = false
}

defineExpose({
  show,
  hide
})
</script>

<style scoped>
.header {
  border-bottom: var(--border-light);
  padding: 0.5rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(30px);
  background: rgba(25, 31, 43, 0.6);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.app-name {
  font-family: "Pacifico", cursive;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.right-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

/* Language dropdown */
.language-dropdown {
  position: relative;
}

.language-dropdown__trigger {
  border: var(--border-light);
  color: var(--text-primary);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-width: 120px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  background: var(--bg-secondary);
}

.language-dropdown__trigger:hover {
  border-color: var(--theme-color);
  box-shadow: 0 2px 8px var(--theme-focus);
}

.language-dropdown__selected {
  flex: 1;
  text-align: center;
}

.language-dropdown__icon {
  font-size: 0.8rem;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.language-dropdown__menu {
  background: var(--bg-secondary);
  border: var(--border-light);
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  box-shadow: var(--shadow-md);
  z-index: 1000;
  overflow: hidden;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  backdrop-filter: blur(20px);
}

.language-dropdown__item {
  width: 100%;
  border: none;
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.language-dropdown__item:hover {
  background: var(--bg-tertiary);
}

.language-dropdown__item--active {
  background-color: var(--theme-color);
  color: var(--text-primary);
}

/* User section */
.user-section {
  display: flex;
  align-items: center;
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  padding: 0.4rem 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.user-trigger:hover {
  background: var(--bg-tertiary);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: var(--border-light);
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.nickname {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
  overflow: hidden;
  max-width: 180px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.username {
  font-size: 0.75rem;
  color: var(--text-secondary);
  overflow: hidden;
  max-width: 180px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  font-size: 0.7rem;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.dropdown-arrow--open {
  transform: rotate(180deg);
}

.user-menu {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  min-width: 180px;
  background: var(--bg-secondary);
  border: var(--border-light);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(20px);
  overflow: hidden;
  z-index: 1000;
  padding: 0.4rem 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background: var(--bg-tertiary);
}

.menu-item :deep(.lucide) {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.menu-item--danger {
  color: var(--error-color);
}

.menu-item--danger :deep(.lucide) {
  color: var(--error-color);
}

.rotate-180 {
  transform: rotate(180deg);
}

.menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: 0.3rem 0;
}

.login-btn {
  background: var(--theme-color);
  color: var(--text-primary);
  border: none;
  padding: 0.5rem 1.1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.login-btn:hover {
  filter: brightness(1.05);
  box-shadow: var(--shadow-md);
}

/* Responsive */
@media (max-width: 768px) {
  .logo {
    display: none;
  }

  .header-container {
    padding: 0 0.75rem;
  }

  .app-name {
    font-size: 1.25rem;
  }

  .right-section {
    gap: 0.5rem;
  }

  .language-dropdown__trigger {
    padding: 0.4rem 0.6rem;
    min-width: 60px;
    font-size: 0.8rem;
  }

  .language-dropdown__selected {
    display: none;
  }

  .user-details {
    display: none;
  }

  .dropdown-arrow {
    display: none;
  }

  .login-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .logo-section {
    gap: 0.5rem;
  }

  .logo {
    width: 32px;
    height: 32px;
  }

  .app-name {
    font-size: 1.1rem;
  }

  .right-section {
    gap: 0.4rem;
  }

  .avatar {
    width: 32px;
    height: 32px;
  }

  .language-dropdown__trigger {
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
  }

  .login-btn {
    padding: 0.35rem 0.7rem;
    font-size: 0.75rem;
  }
}
</style>
