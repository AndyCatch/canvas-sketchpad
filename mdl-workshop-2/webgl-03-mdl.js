const canvasSketch = require('canvas-sketch')
const createShader = require('canvas-sketch-util/shader')
const glsl = require('glslify')

// Setup our sketch
const settings = {
  context: 'webgl',
  animate: true,
}

// Your glsl code
const frag = glsl(/* glsl */ `
  precision highp float;

  uniform float time;
  uniform float aspect;
  varying vec2 vUv;

  // 
  #pragma glslify: noise = require('glsl-noise/simplex/3d');
  #pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

  void main () {
    // vec3 colorA = sin(time / 2.0) + vec3(0.075,0.333,0.996); // GS Vivid Blue
    // vec3 colorB = vec3(0.361,0.925,0.784); // GS Teal

    vec2 center = vUv - 0.5;
    center.x *= aspect;

    float dist = length(center * 0.5); // length is the magnitude of a vector

    float alpha = step(dist, 0.2);
    // // the closer the min/max values are, the lesss of a falloff we get
    // float alpha = smoothstep(0.251, 0.25, dist); 
    // float alpha = smoothstep(0.255 + tan(time), 0.25, dist); 

    // vec3 color = mix(colorA, colorB, vUv.y + vUv.x * sin(time));
    // // gl_FragColor=vec4(color*sin(time) + 0.5, dist > 0.25 ? 0.0 : 1.0);
    // gl_FragColor=vec4(color, alpha);

    float n = noise(vec3(center * 2.0 , time * 0.1));

    vec3 color = hsl2rgb( 
      // Have to turn noise values into 0...1 space
      (n * 0.5 - sin(time * 0.125)),
      n / 0.5,
      0.5);

    // vec3 color = hsl2rgb(
    // 0.6 + n * 0.125,
    // 0.5,
    // 0.5);

    gl_FragColor = vec4(color, alpha);
}
`)

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  // Create the shader and return it
  return createShader({
    clearColor: 'blue', // false makes it transparent
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time,
      aspect: ({ width, height }) => width / height,
    },
  })
}

canvasSketch(sketch, settings)
