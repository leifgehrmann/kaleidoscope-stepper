<script setup lang="ts">

import {onMounted, ref, useTemplateRef, watch} from 'vue';

const props = defineProps<{
  maxReflections: number,
  sides: number,
  scale: number,
  rotationOffset: number,
}>();

interface Point {
  x: number;
  y: number;
}

const viewbox = ref('0 0 100 100');
const rayD = ref(null as string|null);
const mouseD = ref(null as string|null);
const mirrorD = ref(null as string|null);
const circleXDebug = ref(0);
const circleYDebug = ref(0);
const circleRDebug = ref(0);
const svgRef = useTemplateRef('svg');

function screenToCanvas(screen: DOMRect, p: Point) {
  const elementDimensionsRatio = screen.width / screen.height;
  const newPoint = {x: p.x, y: p.y};

  newPoint.x /= screen.width;
  newPoint.y /= screen.height;

  if (elementDimensionsRatio > 1.0) {
    newPoint.x *= elementDimensionsRatio;
    newPoint.x -= (elementDimensionsRatio - 1.0) * 0.5;
  } else {
    newPoint.y /= elementDimensionsRatio;
    newPoint.y -= 0.5 / elementDimensionsRatio - 0.5;
  }

  newPoint.x -= 0.5;
  newPoint.y -= 0.5;

  newPoint.x *= props.scale;
  newPoint.y *= props.scale;

  newPoint.y *= -1;

  return newPoint;
}

function canvasToScreen(screen: DOMRect, p: Point) {
  const elementDimensionsRatio = screen.width / screen.height;
  const newPoint = {x: p.x, y: p.y};

  newPoint.y *= -1;

  newPoint.x /= props.scale;
  newPoint.y /= props.scale;

  newPoint.x += 0.5;
  newPoint.y += 0.5;

  if (elementDimensionsRatio > 1.0) {
    newPoint.x += (elementDimensionsRatio - 1.0) * 0.5;
    newPoint.x /= elementDimensionsRatio;
  } else {
    newPoint.y += 0.5 / elementDimensionsRatio - 0.5;
    newPoint.y *= elementDimensionsRatio;
  }

  newPoint.x *= screen.width;
  newPoint.y *= screen.height;

  return newPoint;
}

function length(p: Point): number {
  return Math.sqrt(p.x * p.x + p.y * p.y);
}

function normalize(p: Point): Point {
  const l = length(p);
  return {
    x: p.x / l,
    y: p.y / l,
  };
}

function addPoint(a: Point, b: Point): Point {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}
function subPoint(a: Point, b: Point): Point {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

function multScalar(a: Point, b: number): Point {
  return {
    x: a.x * b,
    y: a.y * b,
  };
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function distanceFromRayToMirror(
  rayPos: Point,
  rayDir: Point,
  mirrorPointA: Point,
  mirrorPointB: Point
) {
  // https://stackoverflow.com/questions/53893292/how-to-calculate-ray-line-segment-intersection-preferably-in-opencv-and-get-its
  const v1 = subPoint(rayPos, mirrorPointA);
  const v2 = subPoint(mirrorPointB, mirrorPointA);
  const v3 = normalize({
    x: -rayDir.y,
    y: rayDir.x,
  });

  const dotProd = dot(v2, v3);
  if (Math.abs(dotProd) < 0.000001) {
    return -1.0;
  }

  const t1 = (v2.x * v1.y - v2.y * v1.x) / dotProd;
  const t2 = dot(v1, v3) / dotProd;

  if (t1 >= 0.0 && (t2 >= 0.0 && t2 <= 1.0)) {
    return t1;
  }

  return -1.0;
}

function reflectRayOnMirror(
  rayDir: Point,
  mirrorPointA: Point,
  mirrorPointB: Point,
): Point {
  // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
  const n = normalize({
    x: -subPoint(mirrorPointB, mirrorPointA).y,
    y: subPoint(mirrorPointB, mirrorPointA).x
  });

  return addPoint(rayDir, multScalar(n, -2.0 * dot(rayDir, n)));
}

function computeMirrors(maxReflections: number, sides: number, rotationOffset: number) {
  const points = [];
  for (let side = 0; side < sides; side++) {
    const mirrorPointA = {
      x: Math.cos((side - 1.0) * 2.0 * Math.PI / sides + rotationOffset),
      y: Math.sin((side - 1.0) * 2.0 * Math.PI / sides + rotationOffset)
    };
    const mirrorPointB = {
      x: Math.cos((side) * 2.0 * Math.PI / sides + rotationOffset),
      y: Math.sin((side) * 2.0 * Math.PI / sides + rotationOffset)
    };
    points.push(mirrorPointA);
    points.push(mirrorPointB);
  }
  return points;
}


function computeReflections(rayStartDir: Point, maxReflections: number, sides: number, rotationOffset: number) {
  const rayPos = {x: 0, y: 0};
  const rayDir = {x: rayStartDir.x, y: rayStartDir.y};
  const reflectionPoints = [];

  let reflections;
  for (reflections = 0; reflections < maxReflections; reflections++) {
    let nearestMirrorPointA = {x: 0, y: 0};
    let nearestMirrorPointB = {x: 0, y: 0};
    let nearestIntersectionDistance = -1.0;
    for (let side = 0; side < sides; side++) {
      const mirrorPointA = {
        x: Math.cos((side - 1.0) * 2.0 * Math.PI / sides + rotationOffset),
        y: Math.sin((side - 1.0) * 2.0 * Math.PI / sides + rotationOffset)
      };
      const mirrorPointB = {
        x: Math.cos((side) * 2.0 * Math.PI / sides + rotationOffset),
        y: Math.sin((side) * 2.0 * Math.PI / sides + rotationOffset)
      };
      const intersectionDistance = distanceFromRayToMirror(
          rayPos,
          rayDir,
          mirrorPointA,
          mirrorPointB
      );
      if (intersectionDistance >= 0.0 && (intersectionDistance < nearestIntersectionDistance || nearestIntersectionDistance < 0.0)) {
        nearestIntersectionDistance = intersectionDistance;
        nearestMirrorPointA = mirrorPointA;
        nearestMirrorPointB = mirrorPointB;
      }
    }
    const rayLength = length(rayDir);
    if (nearestIntersectionDistance >= rayLength) {
      rayPos.x += rayDir.x;
      rayPos.y += rayDir.y;
      reflectionPoints.push({x: rayPos.x, y: rayPos.y});
      break;
    }
    const rayDirN = normalize(rayDir);
    rayPos.x += rayDirN.x * nearestIntersectionDistance * 0.999;
    rayPos.y += rayDirN.y * nearestIntersectionDistance * 0.999;
    rayDir.x = rayDirN.x * (rayLength - nearestIntersectionDistance);
    rayDir.y = rayDirN.y * (rayLength - nearestIntersectionDistance);

    reflectionPoints.push({x: rayPos.x, y: rayPos.y});

    // Reflect the ray off of the mirror
    const xy = reflectRayOnMirror(
        rayDir,
        nearestMirrorPointA,
        nearestMirrorPointB
    );
    rayDir.x = xy.x;
    rayDir.y = xy.y;
  }
  return reflectionPoints;
}

function render(rayPos: Point|null) {
  if (svgRef.value === null) {
    return;
  }
  const svg = svgRef.value as SVGElement;
  const svgRect = svg.getBoundingClientRect();
  viewbox.value = `0 0 ${svgRect.width} ${svgRect.height}`;

  const testPoint = screenToCanvas(svgRect, {x: svgRect.width/2, y: svgRect.height/2});
  const circlePoint = canvasToScreen(svgRect, testPoint);
  circleXDebug.value = circlePoint.x;
  circleYDebug.value = circlePoint.y;
  circleRDebug.value = Math.min(svgRect.width/2, svgRect.height/2);

  if (rayPos === null) {
    rayD.value = null;
    mouseD.value = null;
    mirrorD.value = null;
    return;
  }

  const reflectionPoints = computeReflections(
    screenToCanvas(svgRect, rayPos),
    props.maxReflections + 1,
    props.sides,
    props.rotationOffset,
  )
      .map((p) => canvasToScreen(svgRect, p));
  const reflectionPath = reflectionPoints
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ');
  rayD.value = `M ${svgRect.width/2} ${svgRect.height/2} ` + reflectionPath;
  if (reflectionPoints.length > 0) {
    mouseD.value = `M ${reflectionPoints[0].x} ${reflectionPoints[0].y} L ${rayPos.x} ${rayPos.y}`;
  } else {
    mouseD.value = null;
  }

  const mirrorPath = computeMirrors(
      props.maxReflections,
      props.sides,
      props.rotationOffset,
  ).map((p) => canvasToScreen(svgRect, p))
    .map((p) => `L ${p.x} ${p.y}`)
      .join(' ').replace('L', 'M');
  mirrorD.value = mirrorPath;
}

watch(() => (props.maxReflections), () => {
  render(null);
});

onMounted(() => {
  render(null);

  svgRef.value.addEventListener('mousedown', (e) => {
    render({x: e.clientX, y: e.clientY});
  });
  svgRef.value.addEventListener('mousemove', (e) => {
    if (e.buttons) {
      render({x: e.clientX, y: e.clientY});
    }
  });
  svgRef.value.addEventListener('mouseup', (e) => {
    render(null);
  });
});

window.addEventListener('resize', () => {
  render(null);
});

</script>

<template>
  <svg
    ref="svg"
    class="absolute left-0 top-0 active:cursor-crosshair"
    style="width:100dvw;height:100dvh;"
    :viewBox="viewbox"
  >
<!--    <circle-->
<!--      :cx="circleXDebug"-->
<!--      :cy="circleYDebug"-->
<!--      :r="circleRDebug"-->
<!--      fill="none"-->
<!--      stroke="#FFF"-->
<!--      stroke-width="3"-->
<!--      stroke-opacity="1"-->
<!--      stroke-linecap="round"-->
<!--    />-->
    <path
      v-if="rayD !== null"
      :d="rayD"
      fill="none"
      stroke="#FFF"
      stroke-width="2"
      stroke-opacity="1"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      v-if="mouseD !== null"
      :d="mouseD"
      fill="none"
      stroke="#0FF"
      stroke-width="2"
      stroke-opacity="0.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      v-if="mirrorD !== null"
      :d="mirrorD"
      fill="none"
      stroke="#FFF"
      stroke-dasharray="1, 4"
      stroke-width="2"
      stroke-opacity="1"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>

</style>
