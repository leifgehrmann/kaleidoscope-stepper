<script setup lang="ts">

import SegmentedControl from './components/SegmentedControl.vue';
import {ref} from 'vue';

const options = [
    'No Bounces',
    '1st Bounce',
    '2nd Bounce',
    '3rd Bounce',
    '4th Bounce',
];

const selectedIndex = ref(0);

</script>

<template>
  <canvas
    id="maincanvas"
    ref="canvas"
    class="bg-gray-900"
    style="width:100dvw;height:100dvh;object-fit:cover"
  />
  <div
    class="absolute w-full flex flex-col justify-end gap-1 px-2 py-2 items-center"
    style="bottom:calc(env(safe-area-inset-bottom))"
  >
    <div
      ref="controls-bar"
      class="
        w-full flex flex-row
        items-center
        p-1
        relative
        bg-neutral-300
        bg-opacity-50
        dark:bg-neutral-800
        dark:bg-opacity-70
        shadow-lg
        dark:shadow-none
        backdrop-blur-xl
        rounded-xl
        text-sm
        overflow-hidden
        justify-between
      "
    >
      <SegmentedControl
        class="w-full"
        :options="options"
        :selected-index="selectedIndex"
        @update:selected-index="selectedIndex = $event"
      />
    </div>
  </div>
</template>

<style scoped>
</style>
