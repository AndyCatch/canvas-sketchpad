const canvasSketch = require('canvas-sketch')
const createShader = require('canvas-sketch-util/shader')
const Tweakpane = require('tweakpane')
const glsl = require('glslify')

// Setup our sketch
const settings = {
	context: 'webgl',
	animate: true,
}

const params = {
	brightness: 0.5,
	contrast: 0.5,
	colSpeed: 1.0,
	red: 0.0,
	green: 0.33,
	blue: 0.67,
}

let manager

// Your glsl code
const frag = glsl(`
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uBrightness;
  uniform float uContrast;
  uniform float uColSpeed;
  uniform float uRed;
  uniform float uGreen;
  uniform float uBlue;
  varying vec2 vUv;

  vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
  {
    return a + b*cos( 6.28318*(c*t+d) );
  }

  void main () {
    vec2 p = gl_FragCoord.xy / uResolution.xy;

    // animate
    p.x += 0.01*uTime;
    
    vec3 color = pal( p.x, vec3(uBrightness,uBrightness,uBrightness),vec3(uContrast,uContrast,uContrast),vec3(uColSpeed,uColSpeed,uColSpeed),vec3(uRed,uGreen,uBlue) );
    // vec3 color = pal( p.x, vec3(uBrightness,uBrightness,uBrightness),vec3(uContrast,uContrast,uContrast),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );

    // vec3 color = 0.5 + 0.5 * cos(time + vUv.xyx + vec3(0.0, 2.0, 4.0));
    gl_FragColor = vec4(color, 1.0);
  }
`)

// Your sketch, which simply returns the shader
const sketch = ({ gl, canvas }) => {
	// Create the shader and return it
	return createShader({
		// Pass along WebGL context
		gl,
		// Specify fragment and/or vertex shader strings
		frag,
		// Specify additional uniforms to pass down to the shaders
		uniforms: {
			// Expose props from canvas-sketch
			uValue: () => params.simpleVal,
			uBrightness: () => params.brightness,
			uContrast: () => params.contrast,
			uColSpeed: () => params.colSpeed,
			uRed: () => params.red,
			uGreen: () => params.green,
			uBlue: () => params.blue,
			uResolution: () => [canvas.width, canvas.height],
			uTime: ({ time }) => time,
		},
	})
}

const loadImage = async (url) => {
	return new Promise((resolve, reject) => {
		const texture = new Image()
		texture.onload = () => resolve(texture)
		texture.onerror = () => reject()
		texture.src = url
	})
}

const createPane = () => {
	const pane = new Tweakpane.Pane()

	pane.addInput(params, 'brightness', {
		min: 0.01,
		max: 1.0,
		step: 0.01,
	})

	pane.addInput(params, 'contrast', {
		min: 0.01,
		max: 1.0,
		step: 0.01,
	})

	pane.addInput(params, 'colSpeed', {
		min: 0.5,
		max: 20.0,
		step: 0.1,
	})

	pane.addInput(params, 'red', {
		min: 0.0,
		max: 1.0,
		step: 0.01,
	})

	pane.addInput(params, 'green', {
		min: 0.0,
		max: 1.0,
		step: 0.01,
	})

	pane.addInput(params, 'blue', {
		min: 0.0,
		max: 1.0,
		step: 0.01,
	})
}

const start = async () => {
	textureA = await loadImage(textureURL)
	console.log(textureA)

	manager = await canvasSketch(sketch, settings)
}

start()
createPane()
