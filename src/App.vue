<script setup lang="ts">

import SegmentedControl from './components/SegmentedControl.vue';
import {ref} from 'vue';
import Kaleidoscope from './components/Kaleidoscope.vue';
import RayTrace from './components/RayTrace.vue';

const options = [
    'No Bounces',
    '1st Bounce',
    '2nd Bounce',
    '3rd Bounce',
    'Et Cetera…',
];

const optionValues = [
    0,
    1,
    2,
    3,
    100
];

const scale = ref(9.0);
const sides = ref(4);
const rotationOffset = ref(0);
const selectedIndex = ref(0);
const showBounces = ref(true);
const showRayTrace = ref(false);

const urlParams = new URLSearchParams(window.location.search);
const scaleParam = urlParams.get('z');
const sidesParam = urlParams.get('s');
const rotationOffsetParam = urlParams.get('r');
const hideBouncesParam = urlParams.get('h');

if (scaleParam !== null && !Number.isNaN(Number.parseFloat(scaleParam))) {
  scale.value = Number.parseFloat(scaleParam);
}
if (sidesParam !== null && !Number.isNaN(Number.parseFloat(sidesParam))) {
  sides.value = Number.parseFloat(sidesParam);
}
if (rotationOffsetParam !== null && !Number.isNaN(Number.parseFloat(rotationOffsetParam))) {
  rotationOffset.value = Number.parseFloat(rotationOffsetParam) * Math.PI / 180;
} else {
  if (sides.value % 2 === 1) {
    rotationOffset.value = Math.PI / 2.0;
  } else if ((sides.value / 2) % 2 === 1) {
    rotationOffset.value = Math.PI / (sides.value / 2);
  } else {
    rotationOffset.value = Math.PI / sides.value;
  }
}
if (hideBouncesParam !== null) {
  showBounces.value = false;
}

if (!showBounces.value) {
  selectedIndex.value = optionValues.length - 1;
}

</script>

<template>
  <Kaleidoscope
    :max-reflections="optionValues[selectedIndex]"
    :rotation-offset="rotationOffset"
    :scale="scale"
    :sides="sides"
  />
  <RayTrace
    :max-reflections="optionValues[selectedIndex]"
    :rotation-offset="rotationOffset"
    :scale="scale"
    :sides="sides"
    :show-ray-trace="showRayTrace"
    @update:show-ray-trace="showRayTrace = $event"
  />
  <transition
    enter-active-class="duration-300 ease-in"
    enter-from-class="transform opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="duration-200 ease-out"
    leave-from-class="opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      v-if="showRayTrace"
      class="absolute w-full flex flex-col justify-end gap-1 px-2 py-2 items-center pointer-events-none"
      style="top:calc(env(safe-area-inset-top))"
    >
      <button
        class="
          flex flex-row
          items-center
          p-2
          px-4
          relative
          rounded-xl
          text-sm
          overflow-hidden
          justify-between
          gap-2
          shadow-md
          dark:shadow-none
          pointer-events-auto

          bg-white
          dark:bg-gray-800

          text-black dark:text-white
          active:text-black/80 dark:active:text-white/80

          transition-colors ease-in
        "
        @click="showRayTrace = false"
      >
        <svg
          viewBox="0 0 10 10"
          class="h-3"
        >
          <line
            x1="1"
            x2="9"
            y1="1"
            y2="9"
            stroke="currentcolor"
            stroke-linecap="round"
            stroke-width="1.25"
          />
          <line
            x1="1"
            x2="9"
            y1="9"
            y2="1"
            stroke="currentcolor"
            stroke-linecap="round"
            stroke-width="1.25"
          />
        </svg>
        Clear Ray Trace
      </button>
    </div>
  </transition>
  <div
    v-if="showBounces"
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
        rounded-xl
        text-sm
        overflow-hidden
        justify-between
        gap-2

        bg-neutral-200
        dark:bg-gray-800
      "
    >
      <SegmentedControl
        class="w-full"
        :options="options"
        :selected-index="selectedIndex"
        @update:selected-index="selectedIndex = $event;"
      />
    </div>
  </div>
</template>

<style scoped>
</style>
