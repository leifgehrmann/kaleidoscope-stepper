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
    int maxReflections = 3;
    float sides = 5.0;

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

    vec2 reflect(vec2 pos, float rotationOffset) {
      float theta = atan(pos.y, pos.x) + rotationOffset;
      float sector = floor((theta) / (2.0 * PI) * sides);
      float sectorThetaSize = (1.0 / sides) * PI * 2.0;
      float sectorStartAngle = (sector - 0.0) * sectorThetaSize - rotationOffset;
      float sectorEndAngle = (sector + 1.0) * sectorThetaSize - rotationOffset;
      vec2 sectorStartPoint = vec2(
        cos(sectorStartAngle),
        sin(sectorStartAngle)
      );
      vec2 sectorEndPoint = vec2(
        cos(sectorEndAngle),
        sin(sectorEndAngle)
      );
      vec2 closestPointFromPointToSectorLine = closestPointFromPointToLine(
        sectorStartPoint,
        sectorEndPoint,
        pos
      );
      float distanceFromPointToSectorLine = distanceFromPointToLine(
        sectorStartPoint,
        sectorEndPoint,
        pos
      );
      if (pythagoras(closestPointFromPointToSectorLine, vec2(0.0,0.0)) < pythagoras(pos, vec2(0.0, 0.0))) {
        float angleToPerpendicular = atan(pos.y - closestPointFromPointToSectorLine.y, pos.x - closestPointFromPointToSectorLine.x);
        // k.x -= cos(angleToPerpendicular) * distanceFromPointToSectorLine * 0.1;
        // k.y -= sin(angleToPerpendicular) * distanceFromPointToSectorLine * 0.1;
        return vec2(
          pos.x - cos(angleToPerpendicular) * distanceFromPointToSectorLine * 2.0,
          pos.y - sin(angleToPerpendicular) * distanceFromPointToSectorLine * 2.0
        );
        // return vec2(
        //   pos.x + (closestPointFromPointToSectorLine.x - pos.x) * 2.0,
        //   pos.y + (closestPointFromPointToSectorLine.y - pos.y) * 2.0
        // );
      } else {
        return pos;
      }
    }

    vec3 pixelToVector(vec2 pos) {
      return vec3(
        sqrt(1.0 + pos.x * pos.x) * sign(pos.x),
        sqrt(1.0 + pos.y * pos.y) * sign(pos.y),
        1.0
      );
    }

    bool rayPlaneIntersects(
      vec3 rayPos,
      vec3 rayDir,
      vec3 planeOrigin,
      vec3 planeNormal
    ) {
      return true;
    }

    vec3 rayPlaneIntersection(
      vec3 rayPos,
      vec3 rayDir,
      vec3 planeOrigin,
      vec3 planeNormal
    ) {
      return vec3(
        0.0,
        0.0,
        0.0
      );
    }

    bool onMirror(vec2 pos, float rotationOffset) {
      float theta = atan(pos.y, pos.x) + rotationOffset;
      float sector = floor((theta) / (2.0 * PI) * sides);
      float sectorThetaSize = (1.0 / sides) * PI * 2.0;
      float sectorStartAngle = (sector - 0.0) * sectorThetaSize - rotationOffset;
      float sectorEndAngle = (sector + 1.0) * sectorThetaSize - rotationOffset;
      vec2 sectorStartPoint = vec2(
        cos(sectorStartAngle),
        sin(sectorStartAngle)
      );
      vec2 sectorEndPoint = vec2(
        cos(sectorEndAngle),
        sin(sectorEndAngle)
      );
      vec2 closestPointFromPointToSectorLine = closestPointFromPointToLine(
        sectorStartPoint,
        sectorEndPoint,
        pos
      );
      float distanceFromPointToSectorLine = distanceFromPointToLine(
        sectorStartPoint,
        sectorEndPoint,
        pos
      );
      return pythagoras(closestPointFromPointToSectorLine, vec2(0.0,0.0)) < pythagoras(pos, vec2(0.0, 0.0));
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
      float scale = 10.0;
      k.x *= scale;
      k.y *= scale;

      // Todo: Control the rotation of the image.
      float rotationOffset = -PI / 10.0;
      if (sides < 5.0) {
        rotationOffset = -PI / 4.0;
      }
      if (sides < 4.0) {
        rotationOffset = -PI / 2.0;
      }
      // k = vec2(
      //   k.x * cos(rotationOffset) - k.y * sin(rotationOffset),
      //   k.x * sin(rotationOffset) + k.y * cos(rotationOffset)
      // );

      // Debug: Draw a circle.
      // if (sqrt(k.x * k.x + k.y * k.y) > 1.0) {
      //   gl_FragColor=vec4(k.x, k.y, 0.5, 0.001);
      //   return;
      // }

      // Debug: Draw a triangle.
      float offset2 = rotationOffset;
      float theta = atan(k.y, k.x) + offset2;
      float sector = floor((theta) / (2.0 * PI) * sides);
      float sectorThetaSize = (1.0 / sides) * PI * 2.0;
      float sectorStartAngle = (sector - 0.0) * sectorThetaSize - offset2;
      float sectorEndAngle = (sector + 1.0) * sectorThetaSize - offset2;
      vec2 sectorStartPoint = vec2(
        cos(sectorStartAngle),
        sin(sectorStartAngle)
      );
      vec2 sectorEndPoint = vec2(
        cos(sectorEndAngle),
        sin(sectorEndAngle)
      );

      // Debug: Highlight sectorPoints
      if (
        k.x < sectorStartPoint.x + 0.1 && k.x > sectorStartPoint.x - 0.1 &&
        k.y < sectorStartPoint.y + 0.1 && k.y > sectorStartPoint.y - 0.1
      ) {
        gl_FragColor=vec4(0.0, 1.0, 1.0, 1.0);
        return;
      }
      if (
        k.x < sectorEndPoint.x + 0.1 && k.x > sectorEndPoint.x - 0.1 &&
        k.y < sectorEndPoint.y + 0.1 && k.y > sectorEndPoint.y - 0.1
      ) {
        gl_FragColor=vec4(1.0, 0.0, 1.0, 1.0);
        return;
      }

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
      if (pythagoras(closestPointFromPointToSectorLine, vec2(0.0,0.0)) < pythagoras(k, vec2(0.0, 0.0))) {
        for(int i = 0; i < 1; i ++) {
          if (i > maxReflections) {
            break;
          }
          // float angleToPerpendicular = atan(k.y - closestPointFromPointToSectorLine.y, k.x - closestPointFromPointToSectorLine.x);
          // k.x -= cos(angleToPerpendicular) * distanceFromPointToSectorLine * 0.1;
          // k.y -= sin(angleToPerpendicular) * distanceFromPointToSectorLine * 0.1;

          k = reflect(k, rotationOffset);
          k = reflect(k, rotationOffset);
          // k = reflect(k, rotationOffset);
          // k = reflect(k, rotationOffset);
          // k.x += (closestPointFromPointToSectorLine.x - k.x) * 2.0;
          // k.y += (closestPointFromPointToSectorLine.y - k.y) * 2.0;
          // k.x = 0.0;
          // k.x = 0.0;
        }

      } else {
        // gl_FragColor=vec4(abs(k.x), abs(k.y), 0.0, 1.0);
      }

      // Are we still
      if (onMirror(k, rotationOffset)) {
        gl_FragColor=vec4(0.0, 0.0, 0.0, 0.0);
        return;
      }

      //gl_FragColor=vec4((k.x), (k.y), 0.0, 1.0);
      gl_FragColor=vec4((k.x + 1.0) / 2.0, (k.y + 1.0) / 2.0, 0.0, 1.0);
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
  <canvas
    ref="outlines"
    class="absolute left-0 top-0"
    style="width:100dvw;height:100dvh;"
  />
</template>

<style scoped>

</style>
