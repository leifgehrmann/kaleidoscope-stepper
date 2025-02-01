<script setup lang="ts">

import {onMounted, ref, useTemplateRef, watch} from 'vue';

const emit = defineEmits(['update:showRayTrace']);

const props = defineProps<{
  showRayTrace: boolean,
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
const mouseDownStartedOnSvg = ref(false);
const touchStartedOnSvg = ref(null as null|number);
const rayPos = ref(null as Point|null);
const rayD = ref(null as string|null);
const mouseD = ref(null as string|null);
const mirrorD = ref(null as string|null);
const rayEnd = ref(null as Point|null);
const mouseEnd = ref(null as Point|null);
const touchStart = ref(null as Point|null);
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

function render() {
  if (svgRef.value === null) {
    return;
  }
  const svg = svgRef.value as SVGElement;
  const svgRect = svg.getBoundingClientRect();
  viewbox.value = `0 0 ${svgRect.width} ${svgRect.height}`;

  if (rayPos.value === null) {
    rayD.value = null;
    mouseD.value = null;
    mirrorD.value = null;
    rayEnd.value = null;
    mouseEnd.value = null;
    return;
  }

  const reflectionPoints = computeReflections(
    screenToCanvas(svgRect, rayPos.value),
    props.maxReflections + 1,
    props.sides,
    props.rotationOffset,
  )
      .map((p) => canvasToScreen(svgRect, p));
  const reflectionPath = reflectionPoints
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ');
  rayD.value = `M ${svgRect.width/2} ${svgRect.height/2} ` + reflectionPath;
  rayEnd.value = {
    x: reflectionPoints[reflectionPoints.length - 1].x,
    y: reflectionPoints[reflectionPoints.length - 1].y
  };
  mouseD.value = `M ${reflectionPoints[0].x} ${reflectionPoints[0].y} L ${rayPos.value.x} ${rayPos.value.y}`;
  mouseEnd.value = rayPos.value;

  const mirrorPath = computeMirrors(
      props.maxReflections,
      props.sides,
      props.rotationOffset,
  ).map((p) => canvasToScreen(svgRect, p))
    .map((p) => `L ${p.x} ${p.y}`)
      .join(' ').replace('L', 'M');
  mirrorD.value = mirrorPath;
}

function getTouchById(touches: TouchList, id: number): Touch | null {
  for (let i = 0; i < touches.length; i += 1) {
    if (touches[i].identifier === id) {
      return touches[i];
    }
  }
  return null;
}

watch(() => (props.maxReflections), () => {
  render();
});

watch(() => (props.showRayTrace), (v) => {
  if (!v) {
    rayPos.value = null;
    render();
  }
});

onMounted(() => {
  render();

  svgRef.value.addEventListener('mousedown', (e) => {
    mouseDownStartedOnSvg.value = true;
    rayPos.value = {x: e.clientX, y: e.clientY};
    emit('update:showRayTrace', true);
    render();
  });
  window.addEventListener('mousemove', (e) => {
    if (mouseDownStartedOnSvg.value) {
      rayPos.value = {x: e.clientX, y: e.clientY};
      emit('update:showRayTrace', true);
      render();
    }
  });
  window.addEventListener('mouseup', (e) => {
    mouseDownStartedOnSvg.value = false;
  });

  svgRef.value.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (touchStartedOnSvg.value !== null) {
      return;
    }
    const touch = e.changedTouches[0];
    touchStartedOnSvg.value = touch.identifier;
    touchStart.value = {x: touch.clientX, y: touch.clientY};
    if (rayPos.value === null) {
      const svg = svgRef.value as SVGElement;
      const svgRect = svg.getBoundingClientRect();
      rayPos.value = {
        x: svgRect.width / 2,
        y: svgRect.height / 2
      };
    }
    emit('update:showRayTrace', true);
    render();
  });
  window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (touchStartedOnSvg.value === null) {
      return;
    }
    const touch = getTouchById(e.changedTouches, touchStartedOnSvg.value);
    if (touch === null || rayPos.value === null || touchStart.value === null) {
      return;
    }

    rayPos.value = {
      x: rayPos.value.x + touch.clientX - touchStart.value.x,
      y: rayPos.value.y + touch.clientY - touchStart.value.y
    };
    touchStart.value = {x: touch.clientX, y: touch.clientY};
    emit('update:showRayTrace', true);
    render();
  });
  const touchEnd = (e: TouchEvent) => {
    if (touchStartedOnSvg.value === null) {
      return;
    }
    const touch = getTouchById(e.changedTouches, touchStartedOnSvg.value);
    if (touch === null) {
      return;
    }
    touchStartedOnSvg.value = null;
  }
  window.addEventListener('touchend', touchEnd);
  window.addEventListener('touchcancel', touchEnd);
});

window.addEventListener('resize', () => {
  emit('update:showRayTrace', false);
  rayPos.value = null;
  render();
});

</script>

<template>
  <svg
    ref="svg"
    class="absolute left-0 top-0 cursor-pointer active:cursor-grabbing"
    style="width:100dvw;height:100dvh;"
    :viewBox="viewbox"
  >
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
    <circle
      v-if="rayEnd !== null"
      :cx="rayEnd.x"
      :cy="rayEnd.y"
      r="4"
      fill="#FFF"
    />
    <circle
      v-if="mouseEnd !== null"
      :cx="mouseEnd.x"
      :cy="mouseEnd.y"
      r="4"
      fill="#0FF"
    />
  </svg>
</template>

<style scoped>

svg {
  filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.7));
}
</style>
