<script setup lang="ts">
import { ref, computed } from "vue";

const props = withDefaults(
  defineProps<{
    src?: string | null;
    name?: string;
    size?: number;
    rounded?: string;
  }>(),
  {
    src: null,
    name: "",
    size: 36,
    rounded: "rounded-full",
  },
);

const failed = ref(false);

const showImage = computed(() => props.src && !failed.value);

const initial = computed(() => {
  const n = (props.name || "").trim();
  return n ? n[0].toUpperCase() : "?";
});

function onError() {
  failed.value = true;
}
</script>

<template>
  <div
    :class="[
      'flex items-center justify-center overflow-hidden shrink-0',
      showImage ? 'bg-transparent' : 'bg-gradient-to-br from-primary to-primary-soft text-white font-display font-semibold',
      props.rounded,
    ]"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.42}px` }"
  >
    <img
      v-if="showImage"
      :src="props.src!"
      :alt="props.name"
      loading="lazy"
      class="w-full h-full object-cover"
      @error="onError"
    />
    <span v-else aria-hidden="true">{{ initial }}</span>
  </div>
</template>
