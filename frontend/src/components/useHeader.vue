<template>
  <header class="header" v-if="isVisible" ref="headerRef">
    <div class="header-container">
      <!-- Logo区域 -->
      <div class="logo-section" @click="navigateToHome">
        <img src="@/assets/icon.png" class="logo" />
        <h1 class="app-name text-gradient">{{ $t('header.appName') }}</h1>
      </div>

      <!-- 右侧功能区 -->
      <div class="right-section">
        <!-- 语言切换器 -->
        <div class="language-switcher">
          <div class="language-dropdown" :class="{ 'language-dropdown--open': isDropdownOpen }">
            <div class="language-dropdown__trigger" @click="toggleDropdown" :title="$t('language.switchLanguage')">
              <i class="language-dropdown__icon fa-solid fa-language"></i>
              <span class="language-dropdown__selected">
                {{ currentLanguageName }}
              </span>
              <i class="language-dropdown__icon fa-solid"
                :class="isDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </div>

            <div v-if="isDropdownOpen" class="language-dropdown__menu">
              <div v-for="lang in availableLanguages" :key="lang.code" class="language-dropdown__item"
                :class="{ 'language-dropdown__item--active': lang.code === currentLanguage }"
                @click="selectLanguage(lang.code)">
                {{ lang.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- 用户信息区域 -->
        <div class="user-section">
          <!-- 已登录状态 -->
          <div v-if="isLoggedIn" class="user-info" @click="navigateToProfile">
            <div class="user-avatar">
              <img :src="userAvatar" alt="User Avatar" class="avatar" />
            </div>
            <div class="user-details">
              <span class="nickname">{{ nickname }}</span>
              <span class="username">{{ username }}</span>
            </div>
          </div>

          <!-- 未登录状态 -->
          <div v-else class="user-info">
            <div class="user-details">
              <span class="nickname">{{ $t('header.unloggedUser') }}</span>
              <span class="login-prompt">{{ $t('header.loginPrompt') }}</span>
            </div>
            <button class="login-btn" @click="navigateToLogin">{{ $t('header.login') }}</button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import defaultAvatar from '@/assets/defaultAvatar.svg'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLanguageStore } from '@/stores/language'
import { useUserStore } from '@/stores/user'
import { setI18nLanguage } from '@/i18n'
import { useSettingStore } from '@/stores/setting'

const router = useRouter()
const { t, availableLocales } = useI18n()
const languageStore = useLanguageStore()
const userStore = useUserStore()

const currentLanguage = computed(() => languageStore.getCurrentLanguage)

const currentLanguageName = computed(() => {
  const lang = availableLanguages.value.find(lang => lang.code === currentLanguage.value)
  return lang ? lang.name : availableLanguages.value[0]?.name || ''
})

const availableLanguages = computed(() => {
  return availableLocales.map(locale => ({
    code: locale,
    name: t(`language.${locale}`)
  }))
})

const isLoggedIn = computed(() => userStore.isLoggedIn)

const nickname = computed(() => userStore.user?.nickname || userStore.user?.username || t('header.unloggedUser'))

const username = computed(() => "@" + userStore.user?.username)

const userAvatar = computed(() => {
  if (userStore.user?.avatar) {
    return useSettingStore().getApiBaseUrl + `/api/v1/users/${userStore.user.username}/avatar`;
  } else {
    return defaultAvatar;
  }
})

const isDropdownOpen = ref(false)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const selectLanguage = (langCode: string) => {
  languageStore.setLanguage(langCode)
  setI18nLanguage(langCode)
  isDropdownOpen.value = false
}

const navigateToHome = () => {
  router.replace('/')
}

const navigateToLogin = () => {
  router.push('/login')
}

const navigateToProfile = () => {
  router.push('/profile')
}

const closeDropdown = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.language-dropdown')) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
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
  hide,
})
</script>

<style scoped>
.header {
  border-bottom: 1px solid var(--border-color);
  padding: .5rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(30px);
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
  gap: .5rem;
}

.language-switcher {
  position: relative;
  display: flex;
  align-items: center;
}

.language-dropdown {
  position: relative;
}

.language-dropdown__trigger {
  border: solid 1px var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-width: 120px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
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
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  margin-top: 0.25rem;
  box-shadow: 0 4px 12px var(--theme-focus);
  z-index: 1000;
  overflow: hidden;
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

.language-dropdown__item--active {
  background-color: var(--theme-color);
  color: white;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.user-avatar .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
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
  max-width: 200px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.login-prompt,
.username {
  font-size: 0.75rem;
  color: var(--text-secondary);
  overflow: hidden;
  max-width: 200px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.login-btn {
  background-color: var(--theme-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.login-btn:hover {
  background-color: var(--theme-hover);
}

.logout-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background-color: var(--border-color);
  border-color: var(--theme-color);
}

/* 响应式设计 */
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
    gap: 0;
  }

  .language-dropdown__trigger {
    padding: 0.4rem 0.6rem;
    min-width: 60px;
    font-size: 0.8rem;
  }

  .language-dropdown__selected {
    display: none;
  }

  .language-dropdown__item {
    padding: 0.3rem 0.4rem;
    font-size: 0.8rem;
  }

  .user-details {
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
    gap: 0.75rem;
  }

  .user-info {
    gap: 0.5rem;
  }

  .user-avatar .avatar {
    width: 32px;
    height: 32px;
  }

  .language-dropdown__trigger {
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
  }

  .language-dropdown__item {
    font-size: 0.75rem;
  }

  .login-btn {
    padding: 0.35rem 0.7rem;
    font-size: 0.75rem;
  }
}
</style>
