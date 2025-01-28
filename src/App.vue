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
    '4th+ Bounce',
];

const optionValues = [
    0,
    1,
    2,
    3,
    100
];

const scale = ref(9.0);
const sides = ref(5);
const rotationOffset = ref(Math.PI / 2.0);
const selectedIndex = ref(0);
const showBounces = ref(true);

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
  />
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

        dark:shadow-none
        backdrop-blur-xl
        rounded-xl
        text-sm
        overflow-hidden
        justify-between
        gap-2

        w-full flex flex-row
        items-center
        p-1
        relative
        bg-neutral-200/80
        shadow
        dark:bg-black/80
        dark:shadow-none
        backdrop-blur-xl
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
</template>

<style scoped>
</style>
