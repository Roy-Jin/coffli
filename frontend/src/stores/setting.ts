import { defineStore } from "pinia";

export const useSettingStore = defineStore("setting", {
    state: () => ({
        apiBaseUrl: import.meta.env.DEV
            ? "http://localhost:8787"
            : "https://coffli.yiiy.dpdns.org",
    }),

    getters: {
        getApiBaseUrl: (state) => state.apiBaseUrl,
    },

    actions: {},

    persist: {
        key: "coffli-setting",
        storage: localStorage,
    },
});
