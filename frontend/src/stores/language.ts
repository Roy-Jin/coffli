import { defineStore } from 'pinia'

export const useLanguageStore = defineStore('language', {
  state: () => ({
    currentLanguage: 'zh'
  }),
  
  getters: {
    getCurrentLanguage: (state) => state.currentLanguage,
    isChinese: (state) => state.currentLanguage === 'zh',
    isEnglish: (state) => state.currentLanguage === 'en'
  },
  
  actions: {
    setLanguage(lang: string) {
      this.currentLanguage = lang
    },
    
    toggleLanguage() {
      this.currentLanguage = this.currentLanguage === 'zh' ? 'en' : 'zh'
    }
  },
  
  persist: {
    key: 'coffli-language',
    storage: localStorage
  }
})
