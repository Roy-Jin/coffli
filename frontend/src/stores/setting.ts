import { defineStore } from "pinia";

export const useSettingStore = defineStore("setting", {
    state: () => ({
        apiBaseUrl: import.meta.env.DEV
            ? "http://localhost:8787"
            : window.location.origin,
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
