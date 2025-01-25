<script setup lang="ts">

import {onMounted, ref, useTemplateRef, watch} from 'vue';

const props = defineProps<{
  maxReflections: number
}>();

interface Point {
  x: number;
  y: number;
}

const viewbox = ref('0 0 100 100');
const rayD = ref(null as string|null);
const svgRef = useTemplateRef('svg');

function render(rayPos: Point|null) {
  if (svgRef.value === null) {
    return;
  }
  const svg = svgRef.value as SVGElement;
  const svgRect = svg.getBoundingClientRect();
  viewbox.value = `0 0 ${svgRect.width} ${svgRect.height}`;

  if (rayPos === null) {
    rayD.value = null;
    return;
  }

  rayD.value = `M ${svgRect.width/2} ${svgRect.height/2} L ${rayPos.x} ${rayPos.y}`
  // const canvas = canvasRef.value as null | HTMLCanvasElement;
  // const ctx = ctxRef.value;
  // if (canvas === null || ctx === null) {
  //   return;
  // }
  //
  // if (rayPos === null) {
  //   ctx.clearRect(0,0, canvas.width, canvas.height);
  //   return;
  // }
  //
  // ctx.beginPath();
  // ctx.fillStyle = 'blue';
  // ctx.moveTo(20, 20);
  // ctx.lineTo(180, 20);
  // ctx.lineTo(rayPos.x, rayPos.y);
  // ctx.closePath();
  // ctx.fill();

  // ctx.clearRect(0,0, canvas.width, canvas.height)
}

watch(() => (props.maxReflections), () => {
  // render(null);
});

onMounted(() => {
  const svg = svgRef.value as HTMLCanvasElement;

  render(null);

  window.addEventListener('mousemove', (e) => {
    render({x: e.clientX, y: e.clientY});
  });
});

window.addEventListener('resize', () => {
  render(null);
});

</script>

<template>
  <svg
    ref="svg"
    class="absolute left-0 top-0"
    style="width:100dvw;height:100dvh;"
    :viewBox="viewbox"
  >
    <path
      v-if="rayD !== null"
      :d="rayD"
      stroke="#FFF"
      stroke-width="3"
      stroke-opacity="1"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped>

</style>
