import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";
import { useUserStore } from "@/stores/user";
import { useUiStore } from "@/stores/ui";

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
  useUiStore().setRouting(true);

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

router.afterEach(() => {
  useUiStore().setRouting(false);
});

router.onError(() => {
  useUiStore().setRouting(false);
});

export default router;
