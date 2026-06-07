import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { routes } from 'vue-router/auto-routes'
import { createRouter, createWebHistory } from 'vue-router'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n, { setI18nLanguage } from './i18n'
import { useLanguageStore } from './stores/language'

import App from './App.vue'

const app = createApp(App)
const pinia = createPinia().use(piniaPluginPersistedstate)

// 使用插件
app.use(pinia)
app.use(createRouter({
    history: createWebHistory(),
    routes,
}))
app.use(i18n)

// 设置语言（必须在挂载前设置）
const languageStore = useLanguageStore()
setI18nLanguage(languageStore.getCurrentLanguage)

app.mount('#app')