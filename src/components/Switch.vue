<script setup lang="ts">

defineProps<{
  checked: boolean
}>();

defineEmits(['update']);

</script>

<template>
  <div
    class="
      h-7 w-12
      bg-gray-400/70 bg-gray-500 flex rounded-full p-1
      transition-all
      overflow-hidden
      relative
"
    :class="{
      'bg-green-400 dark:bg-green-500': checked,
    }"
    @click="$emit('update', !checked)"
  >
    <div
      class="
      h-5 w-5
      active:w-6
      transition-all
      bg-white shadow-md rounded-full
      "
      :class="{
        'translate-x-5 active:translate-x-4': checked,
        'translate-x-0': !checked
      }"
    />
  </div>
</template>

<style scoped>

</style>
