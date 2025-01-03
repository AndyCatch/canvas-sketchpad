const glsl = require('glslify')
const canvasSketch = require('canvas-sketch')
const createShader = require('canvas-sketch-util/shader')
const loadAsset = require('load-asset') // Use a library to handle image loading
const Tweakpane = require('tweakpane')

// Configuration for canvas-sketch
// Sketch parameters
const settings = {
	context: 'webgl',
	animate: true,
}

let manager

const params = {
	u_val_one: 0.1,
	u_val_two: 1.0,
}

const frag = glsl(`
  #ifdef GL_ES
  precision mediump float;
  #endif

  #pragma glslify: fbm = require('./shader-utils.glsl').fbm

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform sampler2D u_texture;
  uniform float u_val_one;
  uniform float u_val_two;
  varying vec2 vUv;

  void main() {
    // Basic slitscan effect
    vec2 uv = vUv;
    uv.y = 1.0 - uv.y;

    vec2 distortion = vec2(cos(uv.y + u_time * 0.5) * 0.174646, sin(uv.y + u_time * 0.125) * 0.3244646);

    // Offset y-coordinate based on time for slitscan effect
    uv.y = mod(uv.x + u_time * sin(u_val_one), 1.0);

    // Sample the texture
    vec4 color = texture2D(u_texture, uv + fbm(distortion));
    
    gl_FragColor = color;
  }
`)

const sketch = async ({ gl }) => {
	// Load the video asset using load-asset
	// const video = await loadAsset('images/test-video.mp4', { type: 'video' })
	const image = await loadAsset('images/test-input-02.png')

	// video.loop = true
	// video.muted = true
	// video.autoplay = true
	// await video.play() // Ensure video starts playing

	const shader = createShader({
		gl,
		frag,
		uniforms: {
			u_time: ({ time }) => time,
			u_resolution: ({ gl }) => [gl.drawingBufferWidth, gl.drawingBufferHeight],
			u_val_one: () => params.u_val_one,
			u_val_two: () => params.u_val_two,
			u_texture: () => image,
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
			gl.deleteTexture(videoTexture)
		},
	}
}

const createPane = () => {
	const pane = new Tweakpane.Pane()
	pane.addInput(params, 'u_val_one', {
		min: 0.001,
		max: 10.0,
		step: 0.001,
	})

	pane.addInput(params, 'u_val_two', {
		min: 0.001,
		max: 10.0,
		step: 0.001,
	})
}

createPane()
canvasSketch(sketch, settings)
