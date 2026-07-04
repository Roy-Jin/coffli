<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string;
    active?: boolean;
    clickable?: boolean;
  }>(),
  {
    active: false,
    clickable: false,
  },
);

const emit = defineEmits<{
  click: [];
}>();

function onClick() {
  if (props.clickable) emit("click");
}
</script>

<template>
  <component
    :is="clickable ? 'button' : 'span'"
    :type="clickable ? 'button' : undefined"
    :class="[
      'inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full border transition-colors',
      active
        ? 'bg-primary text-white border-primary'
        : 'bg-primary/10 text-primary border-transparent hover:bg-primary/20',
      clickable ? 'cursor-pointer' : '',
    ]"
    @click="onClick"
  >
    {{ name }}
  </component>
</template>
