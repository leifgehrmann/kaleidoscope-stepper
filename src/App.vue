<script setup lang="ts">

import SegmentedControl from './components/SegmentedControl.vue';
import {ref} from 'vue';

const options = [
    'None',
    '1',
    '2',
    '3',
    '∞',
];

const selectedIndex = ref(0);

</script>

<template>
  <canvas
    id="maincanvas"
    ref="canvas"
    class="bg-gray-100 dark:bg-gray-900"
    style="width:100dvw;height:100dvh;object-fit:cover"
  />
  <div
    class="absolute w-full flex flex-col justify-end gap-1 px-2 py-2 items-center"
    style="top:calc(env(safe-area-inset-top))"
  >
    <label
      ref="controls-bar"
      for="mirrorEdges"
      class="
        flex flex-row
        gap-2
        items-center
        p-2
        cursor-pointer
        relative
        bg-neutral-300
        bg-opacity-50
        dark:bg-neutral-900
        dark:bg-opacity-70
        dark:shadow-none
        backdrop-blur-xl
        rounded-full
        text-sm
        overflow-hidden
        justify-between
      "
    >
      <span class="pl-2">Show mirror edges:</span>
<!--      <input-->
<!--        id="mirrorEdges"-->
<!--        class="p-2 cursor-pointer"-->
<!--        type="checkbox"-->
<!--      >-->
      <div
        class="h-7 w-12 bg-gray-400/70 dark:bg-green-500 flex dark:justify-end rounded-full p-1 overflow-hidden"
      >
        <div
          class="h-5 w-5 hover:w-6 transition-all bg-white shadow-md rounded-full"
        >
        </div>
      </div>
    </label>
  </div>
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
        dark:bg-neutral-900
        dark:bg-opacity-70
        dark:shadow-none
        backdrop-blur-xl
        rounded-xl
        text-sm
        overflow-hidden
        justify-between
      "
    >
      <span
          class="h-full w-full px-2 text-center basis-1/6"
      >
        Reflections:
      </span>
      <SegmentedControl
        class="w-full basis-5/6"
        :options="options"
        :selected-index="selectedIndex"
        @update:selected-index="selectedIndex = $event"
      />
    </div>
  </div>
</template>

<style scoped>
</style>
