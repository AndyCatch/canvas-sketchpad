const canvasSketch = require('canvas-sketch')
const createShader = require('canvas-sketch-util/shader')
const glsl = require('glslify')
const Tweakpane = require('tweakpane')
const math = require('canvas-sketch-util/math')
const loadAsset = require('load-asset')

const settings = {
	context: 'webgl',
	animate: true,
	// dimensions: [1080, 1080],
}

// TV glitch-like
const frag = glsl(`
	#pragma glslify: fbm = require('./shader-utils.glsl').fbm
	// #pragma glslify: dither = require(glsl-dither)
	#pragma glslify: dither = require(glsl-dither/8x8) 

	precision mediump float;

  varying vec2 vUv;

  uniform sampler2D uTexture;
  uniform vec2 uOffset;
	uniform float uTimeOffset;
  uniform float uTime;

  void main() {
    vec2 uv = vUv;
    uv.y = 1.0 - uv.y;

    vec2 distortion = vec2(cos(uv.y * uOffset.x + uTime * 0.1) * uOffset.y, sin(uv.y * uOffset.x + uTime) * uOffset.y);

    float slides = uv.x * uOffset.x + uTime * uTimeOffset;
    slides = fract(slides);

		vec4 tex = texture2D(uTexture, uv + fbm(vec2(slides*0.5,slides)) * uOffset.y);

		gl_FragColor = dither(gl_FragCoord.xy, tex);
    // gl_FragColor = tex;
  }
`)

let offsetX
let offsetY

const params = {
	multiplier: 100,
	rangeEnd: 100,
	timeOffset: 0.4,
}

const sketch = async ({ gl, width, height }) => {
	const image = await loadAsset('images/test-input-02.png')
	const mouse = [0, 0]

	// Initial offset
	offsetX =
		math.mapRange(mouse[0], 0, width, 0, params.rangeEnd) * params.multiplier
	offsetY = math.mapRange(mouse[1], 0, height, 0.001, 0.05) * params.multiplier

	// Create a mouse listener
	const move = (ev) => {
		mouse[0] = ev.clientX / window.innerWidth
		mouse[1] = (window.innerHeight - ev.clientY - 1) / window.innerHeight

		offsetX =
			math.mapRange(mouse[0], 0, width, 0, params.rangeEnd) * params.multiplier
		offsetY =
			math.mapRange(mouse[1], 0, window.innerHeight, 0.001, 0.05) *
			params.multiplier
	}
	window.addEventListener('mousemove', move)

	// Create the shader and return it
	const shader = createShader({
		// Pass along WebGL context
		gl,
		// Specify fragment and/or vertex shader strings
		frag,
		// Specify additional uniforms to pass down to the shaders
		attributes: {
			position: [-2, 0, 0, -2, 2, 2],
		},
		uniforms: {
			// Pass down a sampler2D image
			uTexture: () => image,
			// Expose props from canvas-sketch
			uTime: ({ time }) => time,
			// Expose additional mouse uniform
			// Use an array here to ensure it picks up the new values each render
			mouse: () => mouse,
			uOffset: () => [offsetX, offsetY],
			uTimeOffset: () => params.timeOffset,
		},
	})

	return {
		render(props) {
			// Render shader
			shader.render(props)
		},
		unload() {
			// Cleanup shader and mouse event
			shader.unload()
			window.removeEventListener('mousemove', move)
		},
	}
}

const createPane = () => {
	const pane = new Tweakpane.Pane()

	pane.addInput(params, 'multiplier', {
		min: 50,
		max: 1000,
		step: 1,
	})

	pane.addInput(params, 'rangeEnd', {
		min: -50,
		max: 1000,
		step: 1,
	})

	pane.addInput(params, 'timeOffset', {
		min: 0.1,
		max: 2.0,
		step: 0.01,
	})
}

createPane()
canvasSketch(sketch, settings)
