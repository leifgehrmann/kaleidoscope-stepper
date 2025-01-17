<script setup lang="ts">

import {onMounted, ref, useTemplateRef} from 'vue';

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
  gl.uniform2f(canvasDimensionsBind, canvasSize, canvasSize);
  gl.uniform2f(elementDimensionsBind, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

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

    float pythagoras(vec2 a, vec2 b) {
      return sqrt((b.y - a.y) * (b.y - a.y) + (b.x - a.x) * (b.x - a.x));
    }

    // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
    float distanceFromPointToLine(vec2 a, vec2 b, vec2 p) {
      return abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x) / pythagoras(a, b);
    }

    // https://stackoverflow.com/questions/65282981/get-perpendicular-to-line-from-point
    vec2 closestPointFromPointToLine(vec2 a, vec2 b, vec2 p) {
      float dx = b.x - a.x;
      float dy = b.y - a.y;
      float dotp = dx * (p.x - a.x) + dy * (p.y - a.y);
      float dot12 = dx * dx + dy * dy;
      float coeff = dotp / dot12;

      return vec2(
        a.x + dx * coeff,
        a.y + dy * coeff
      );
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
      k.x *= 2.0;
      k.y *= 2.0;

      // Todo: Control the scale of the image at this stage.
      float scale = 2.0;
      k.x *= scale;
      k.y *= scale;

      // Debug: Draw a circle.
      if (sqrt(k.x * k.x + k.y * k.y) > 1.0) {
        gl_FragColor=vec4(k.x, k.y, 0.5, 0.001);
        return;
      }

      float sides = 3.0;

      // Debug: Draw a triangle.
      float theta = atan(k.x, k.y);
      float csc = 1.0 / sin(theta - 0.1);
      // Split the theta into thirds
      // if (sqrt(k.x * k.x + k.y * k.y) > csc * 0.5) {
      //    gl_FragColor=vec4(k.x, k.y, 0.0, 0.001);
      //    return;
      // }
      // sector
      float sector = floor((theta) / (2.0 * PI) * sides);
      // if (theta % sides)
      float sectorThetaSize = (1.0 / sides) * PI * 2.0;
      float sectorStartAngle = sector * sectorThetaSize;
      float sectorEndAngle = (sector + 1.0) * sectorThetaSize;
      vec2 sectorStartPoint = vec2(
        sin(sectorStartAngle),
        cos(sectorStartAngle)
      );
      vec2 sectorEndPoint = vec2(
        sin(sectorEndAngle),
        cos(sectorEndAngle)
      );
      vec2 closestPointFromPointToSectorLine = closestPointFromPointToLine(
        sectorStartPoint,
        sectorEndPoint,
        k
      );
      float distanceFromPointToSectorLine = distanceFromPointToLine(
        sectorStartPoint,
        sectorEndPoint,
        k
      );
      if (pythagoras(closestPointFromPointToSectorLine, vec2(0.0,0.0)) > pythagoras(k, vec2(0.0))) {
        gl_FragColor=vec4(abs(k.x), abs(k.y), 0.0, 1.0);
      }
      // if (distanceFromPointToSectorLine < pythagoras(k, vec2(0.0))) {
      //   gl_FragColor=vec4(abs(k.x), abs(k.y), 0.0, 1.0);
      //   return;
      // }
      // if (distanceFromPointToSectorLine < 0.2) {
        // gl_FragColor=vec4(abs(k.x), abs(k.y), distanceFromPointToSectorLine * 100.0, 1.0);
      // }

      // gl_FragColor=vec4(abs(k.x), abs(k.y), sector / sides, 1.0);
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
    id="maincanvas"
    ref="canvas"
    class="bg-gray-200 dark:bg-gray-900"
    style="width:100dvw;height:100dvh;"
  />
</template>

<style scoped>

</style>
