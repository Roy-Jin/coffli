import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import "katex/dist/katex.min.css";
import App from "./App.vue";
import router from "./router";
import { useUserStore } from "./stores/user";
import "./style.css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);

app.mount("#app");

const userStore = useUserStore();
userStore.fetchUser().catch(() => {});
