import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";
import { useUserStore } from "@/stores/user";

declare module "vue-router" {
  interface RouteMeta {
    requireAuth?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  if (to.meta.requireAuth) {
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) {
      return {
        path: "/login",
        query: { redirect: to.fullPath },
      };
    }
  }
});

export default router;
