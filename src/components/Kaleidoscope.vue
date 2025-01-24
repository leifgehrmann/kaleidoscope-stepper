<script setup lang="ts">

import {onMounted, ref, useTemplateRef, watch} from 'vue';

const props = defineProps<{
  maxReflections: number
}>();

const canvasRef = useTemplateRef('canvas');
const canvasSize =  Math.max(1024, window.innerWidth, window.innerHeight) * window.devicePixelRatio;
const webglRef = ref(null as null|WebGLRenderingContext);
const webglProgramRef = ref(null as null|WebGLProgram);

function render() {
  const canvas = canvasRef.value as null | HTMLCanvasElement;
  const gl = webglRef.value;
  const program = webglProgramRef.value;
  if (canvas === null || gl === null || program === null) {
    return;
  }

  const canvasDimensionsBind = gl.getUniformLocation(program, 'canvasDimensions');
  const elementDimensionsBind = gl.getUniformLocation(program, 'elementDimensions');
  const maxReflectionsBind = gl.getUniformLocation(program, 'maxReflections');
  const scaleBind = gl.getUniformLocation(program, 'scale');
  const sidesBind = gl.getUniformLocation(program, 'sides');
  const rotationOffsetBind = gl.getUniformLocation(program, 'rotationOffset');
  gl.uniform2f(canvasDimensionsBind, canvasSize, canvasSize);
  gl.uniform2f(elementDimensionsBind, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
  gl.uniform1i(maxReflectionsBind, props.maxReflections);
  gl.uniform1f(scaleBind, 9.0);
  gl.uniform1f(sidesBind, 5);
  gl.uniform1f(rotationOffsetBind, Math.PI / 2.0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

watch(() => (props.maxReflections), () => {
  render();
});

onMounted(() => {
  const canvas = canvasRef.value as HTMLCanvasElement;
  const gl = canvas.getContext('webgl')!;
  webglRef.value = gl;
  canvas.width = canvas.height = canvasSize;
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Vertex shader: Identity map
  const vshader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vshader,
      'attribute vec2 p;'+
      'void main(){'+
      '    gl_Position = vec4(p,0,1);'+
      '}');
  gl.compileShader(vshader);

  // Fragment shader: sample video texture, change colors
  const fshader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fshader,`
    precision highp float;

    float PI = 3.1415926536;

    uniform vec2 canvasDimensions;
    uniform vec2 elementDimensions;
    uniform int maxReflections;
    uniform float scale;
    uniform float sides;
    uniform float rotationOffset;

    float distanceFromRayToMirror(
      vec2 rayPos,
      vec2 rayDir,
      vec2 mirrorPointA,
      vec2 mirrorPointB
    ) {
      // https://stackoverflow.com/questions/53893292/how-to-calculate-ray-line-segment-intersection-preferably-in-opencv-and-get-its
      vec2 v1 = rayPos - mirrorPointA;
      vec2 v2 = mirrorPointB - mirrorPointA;
      vec2 v3 = normalize(vec2(
        -rayDir.y,
        rayDir.x
      ));

      float dotProd = dot(v2, v3);
      if (abs(dotProd) < 0.000001) {
        return -1.0;
      }

      float t1 = (v2.x * v1.y - v2.y * v1.x) / dotProd;
      float t2 = dot(v1, v3) / dotProd;

      if (t1 >= 0.0 && (t2 >= 0.0 && t2 <= 1.0)) {
        return t1;
      }

      return -1.0;
    }

    vec2 reflectRayOnMirror(
      vec2 rayDir,
      vec2 mirrorPointA,
      vec2 mirrorPointB
    ) {
      // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
      vec2 n = normalize(vec2(
        -(mirrorPointB - mirrorPointA).y,
        (mirrorPointB - mirrorPointA).x
      ));

      return rayDir - 2.0 * dot(rayDir, n) * n;
    }

    void main() {
      // Normalise coordinate space to be letterboxed.
      float elementDimensionsRatio = elementDimensions.x / elementDimensions.y;
      vec2 k = vec2(gl_FragCoord.x, gl_FragCoord.y);
      k /= canvasDimensions;
      if (elementDimensionsRatio > 1.0) {
        k.x *= elementDimensionsRatio;
        k.x -= (elementDimensionsRatio - 1.0) * 0.5;
      } else {
        k.y /= elementDimensionsRatio;
        k.y -= (1.0 - elementDimensionsRatio) * 0.5;
      }
      // Debug: Show outline of the letterbox.
      // if (k.x < 0.001 || k.x > 0.999 || k.y < 0.001 || k.y > 0.999) {
      //   gl_FragColor=vec4(k.x, k.y, 1.0, 0.001);
      //   return;
      // }

      // Center coordinate space around the middle of the screen.
      // A coordinate range from -1 to +1 is now shown.
      k.x -= 0.5;
      k.y -= 0.5;

      // Control the scale of the image at this stage.
      k.x *= scale;
      k.y *= scale;

      // Initialise the ray.
      vec2 rayPos = vec2(0.0);
      vec2 rayDir = k;
      float surfaceAlpha = 0.0;

      vec2 rangeBottomLeft = vec2(0.0);
      vec2 rangeTopRight = vec2(0.0);
      for (float side = 0.0; side < 100.0; side++) {
        if (side > sides) {
          continue;
        }
        float x = cos((side) * 2.0 * PI / sides + rotationOffset);
        float y = sin((side) * 2.0 * PI / sides + rotationOffset);
        rangeBottomLeft.x = min(rangeBottomLeft.x, x);
        rangeBottomLeft.y = min(rangeBottomLeft.y, y);
        rangeTopRight.x = max(rangeTopRight.x, x);
        rangeTopRight.y = max(rangeTopRight.y, y);
      }

      // Compute how light should reflect across the various mirrors.
      for (int reflections = 0; reflections < 1000; reflections++) {
        if (reflections > maxReflections) {
          break;
        }
        // Test for plane intersections. By default,
        // this is the end of the kaleidoscope, with the normal
        // facing towards the eye.
        vec2 nearestMirrorPointA = vec2(0.0);
        vec2 nearestMirrorPointB = vec2(0.0);
        float nearestIntersectionDistance = -1.0;
        for (float side = 0.0; side < 100.0; side++) {
          if (side > sides) {
            continue;
          }
          vec2 mirrorPointA = vec2(
            cos((side - 1.0) * 2.0 * PI / sides + rotationOffset),
            sin((side - 1.0) * 2.0 * PI / sides + rotationOffset)
          );
          vec2 mirrorPointB = vec2(
            cos((side) * 2.0 * PI / sides + rotationOffset),
            sin((side) * 2.0 * PI / sides + rotationOffset)
          );
          // Does the ray intersect the side/mirror?
          float intersectionDistance = distanceFromRayToMirror(
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

        // If the rayDir is not long enough to reflect light at
        // the nearest intersection, then increment the position to the final length of the ray,
        // then stop the calculation.
        float rayLength = length(rayDir);
        if (nearestIntersectionDistance >= rayLength) {
          rayPos += rayDir;
          surfaceAlpha = 1.0;
          break;
        }
        rayPos += normalize(rayDir) * nearestIntersectionDistance * 0.999;
        rayDir = normalize(rayDir) * (length(rayDir) - nearestIntersectionDistance);

        // Reflect the ray off of the mirror
        rayDir = reflectRayOnMirror(
          rayDir,
          nearestMirrorPointA,
          nearestMirrorPointB
        );
      }

      // Normalize the coordinate space so
      vec2 imagePos = rayPos;
      float rangeDx = rangeTopRight.x - rangeBottomLeft.x;
      float rangeDy = rangeTopRight.y - rangeBottomLeft.y;
      float rangeScale = 1.0 / min(rangeDx, rangeDy);
      imagePos -= rangeBottomLeft;
      imagePos *= rangeScale;

      if (surfaceAlpha > 0.5) {
        gl_FragColor=vec4(imagePos.x, imagePos.y, 0.0, surfaceAlpha);
      } else {
        gl_FragColor=vec4(0.0, 0.0, 0.0, 0.0);
      }
    }
  `);
  gl.compileShader(fshader);

  // Create and link program
  const program  = gl.createProgram()!;
  webglProgramRef.value = program;
  gl.attachShader(program,vshader);
  gl.attachShader(program,fshader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Vertices: A screen-filling quad made from two triangles
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  render();
});

window.addEventListener('resize', () => {
  requestAnimationFrame(() => {
    render();
  });
});

</script>

<template>
  <canvas
    ref="canvas"
    class="bg-gray-200 dark:bg-gray-900"
    style="width:100dvw;height:100dvh;"
  />
</template>

<style scoped>

</style>
