<script setup lang="ts">

import SegmentedControl from './components/SegmentedControl.vue';
import {ref} from 'vue';
import Switch from './components/Switch.vue';
import Kaleidoscope from './components/Kaleidoscope.vue';
import RayTrace from "./components/RayTrace.vue";

const options = [
    'No Bounces',
    '1st Bounce',
    '2nd Bounce',
    '3rd Bounce',
    '4th+ Bounce',
];

const optionValues = [
    0,
    1,
    2,
    3,
    100
];

const selectedIndex = ref(0);
const showMirrorEdges = ref(false);

</script>

<template>
  <Kaleidoscope
    :max-reflections="optionValues[selectedIndex]"
  />
  <RayTrace
    :max-reflections="optionValues[selectedIndex]"
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
      @click="showMirrorEdges = !showMirrorEdges"
    >
      <span class="pl-2">Show mirror edges:</span>
      <Switch
        :checked="showMirrorEdges"
        @update="showMirrorEdges = $event"
        @click.stop
      />
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
