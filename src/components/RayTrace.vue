<script setup lang="ts">

import {onMounted, ref, useTemplateRef, watch} from 'vue';

const props = defineProps<{
  maxReflections: number
}>();

interface Point {
  x: number;
  y: number;
}

const canvasRef = useTemplateRef('canvas');
const canvasSize =  Math.max(1024, window.innerWidth, window.innerHeight) * window.devicePixelRatio;
const ctxRef = ref(null as null|CanvasRenderingContext2D);

function render(rayPos: Point|null) {
  const canvas = canvasRef.value as null | HTMLCanvasElement;
  const ctx = ctxRef.value;
  if (canvas === null || ctx === null) {
    return;
  }

  if (rayPos === null) {
    ctx.clearRect(0,0, canvas.width, canvas.height)
    return;
  }

  ctx.beginPath();
  ctx.fillStyle = 'blue';
  ctx.moveTo(20, 20);
  ctx.lineTo(180, 20);
  ctx.lineTo(rayPos.x, rayPos.y);
  ctx.closePath();
  ctx.fill();

  // ctx.clearRect(0,0, canvas.width, canvas.height)
}

watch(() => (props.maxReflections), () => {
  render(null);
});

onMounted(() => {
  const canvas = canvasRef.value as HTMLCanvasElement;
  ctxRef.value = canvas.getContext('2d')!;
  canvas.width = canvas.height = canvasSize;

  render(null);

  canvas.addEventListener('mousemove', (e) => {
    render({x: e.clientX, y: e.clientY});
  });
});

window.addEventListener('resize', () => {
  requestAnimationFrame(() => {
    render(null);
  });
});

</script>

<template>
  <canvas
    ref="canvas"
    class="absolute left-0 top-0"
    style="width:100dvw;height:100dvh;"
  />
</template>

<style scoped>

</style>
