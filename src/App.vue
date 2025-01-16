<script setup lang="ts">

import SegmentedControl from './components/SegmentedControl.vue';
import {ref} from 'vue';

const options = [
    'None',
    '1',
    '2',
    '3',
    '4+',
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
      for="mirrorEdges"
      class="
        flex flex-row
        gap-2
        items-center
        p-2
        cursor-pointer
        relative
        bg-white

        dark:bg-black
        dark:shadow-none

        backdrop-blur-xl
        rounded-xl
        text-sm
        overflow-hidden
        justify-between
        shadow-md
      "
    >
      <span class="pl-2">Show mirror edges:</span>
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
        bg-white

        dark:bg-black
        dark:shadow-none
        backdrop-blur-xl
        rounded-xl
        text-sm
        overflow-hidden
        justify-between
        gap-2
        shadow-md
      "
    >
      <span
        class="pl-2 flex basis-1/6 text-center items-center justify-center"
      >
        Reflections:
      </span>
      <div
        class="
          w-full flex flex-row
          basis-5/6
          items-center
          p-1
          relative
          bg-neutral-200
          dark:bg-gray-900
          dark:shadow-none
          backdrop-blur-xl
          rounded-lg
          text-sm
          overflow-hidden
          justify-between
          gap-2
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
  </div>
</template>

<style scoped>
</style>
