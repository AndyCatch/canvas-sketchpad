const canvasSketch = require('canvas-sketch')
const createShader = require('canvas-sketch-util/shader')
const Tweakpane = require('tweakpane')
const glsl = require('glslify')

// Input image texture URL
const textureURL = 'images/test-input.png'

let textureA

// Setup our sketch
const settings = {
	context: 'webgl',
	animate: true,
	dimensions: [1080, 1080], // Set explicit dimensions
	attributes: {
		alpha: false, // Disable alpha if you don't need transparency
		antialias: true, // Enable antialiasing for smoother rendering
		preserveDrawingBuffer: false, // Ensure the buffer is cleared each frame
		uv: [
			[0, 0], // Bottom-left
			[1, 0], // Bottom-right
			[0, 1], // Top-left
			[1, 1], // Top-right
		],
	},
}

const params = {
	fallOff: 0.5,
	dissipation: 0.6,
	alpha: 1.0,
	aspect: 1,
	velocity: [0.3, 0.1],
}

const vert = glsl(`
  precision highp float;

  attribute vec3 position;
  varying vec2 vUv;

  void main () {
    gl_Position = vec4(position.xyz,1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`)

// Your glsl code
const frag = glsl(`
   precision highp float;

    uniform sampler2D uTexture;
    uniform float uTime;

    uniform float uFalloff;
    uniform float uAlpha;
    uniform float uDissipation;

    uniform float uAspect;
    uniform vec2 uMouse;
    uniform vec2 uVelocity;

    varying vec2 vUv;

    void main() {
        vec4 color = texture2D(uTexture, vUv) * uDissipation;

        vec2 cursor = vUv - uMouse;
        cursor.x *= uAspect;

        vec3 stamp = vec3(uVelocity * vec2(1, -1), 1.0 - pow(1.0 - min(1.0, length(uVelocity)), 3.0));
        float falloff = smoothstep(uFalloff, 0.0, length(cursor)) * uAlpha;

        color.rgb = mix(color.rgb, stamp, vec3(falloff));

        gl_FragColor = color;
    }
`)

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
	const mouse = [0, 0]

	// Create a mouse listener
	const move = (ev) => {
		mouse[0] = ev.clientX / window.innerWidth
		mouse[1] = (window.innerHeight - ev.clientY - 1) / window.innerHeight
	}
	window.addEventListener('mousemove', move)

	// Create the shader and return it
	const shader = createShader({
		gl,
		vert,
		frag,
		uniforms: {
			uAlpha: () => params.alpha,
			uFalloff: () => params.fallOff,
			uDissipation: () => params.dissipation,
			uAspect: () => params.aspect,
			uVelocity: () => params.velocity,
			uMouse: () => mouse,
			uTime: ({ time }) => time, // Initialize with a default value
			uTexture: () => textureA,
		},
	})

	return {
		render(props) {
			// Render shader
			shader.render(props)
		},
		unload() {
			// Cleanup shader
			shader.unload()
			window.removeEventListener('mousemove', move)
		},
	}
}

const createPane = () => {
	const pane = new Tweakpane.Pane()

	pane.addInput(params, 'fallOff', {
		min: 0.01,
		max: 1.0,
		step: 0.01,
	})

	pane.addInput(params, 'dissipation', {
		min: 0.01,
		max: 1.0,
		step: 0.01,
	})

	pane.addInput(params, 'alpha', {
		min: 0.01,
		max: 1.0,
		step: 0.01,
	})

	pane.addInput(params, 'aspect', {
		min: 0.01,
		max: 1.0,
		step: 0.01,
	})
}

const start = async () => {
	textureA = await loadImage(textureURL)
	console.log(textureA)

	manager = await canvasSketch(sketch, settings)
}

const loadImage = async (url) => {
	return new Promise((resolve, reject) => {
		const texture = new Image()
		texture.onload = () => resolve(texture)
		texture.onerror = () => reject()
		texture.src = url
	})
}

start()
createPane()

// Error: (regl) missing attribute uv in command unknown

// Area 17 shader

// function c() {
//   return new bp(e,{
//       geometry: new _p(e),
//       program: new xp(e,{
//           vertex: GR,
//           fragment: VR,
//           uniforms: {
//               tMap: o.uniform,
//               uFalloff: {
//                   value: i * .5
//               },
//               uAlpha: {
//                   value: r
//               },
//               uDissipation: {
//                   value: n
//               },
//               uAspect: {
//                   value: 1
//               },
//               uMouse: {
//                   value: o.mouse
//               },
//               uVelocity: {
//                   value: o.velocity
//               }
//           },
//           depthTest: !1
//       })
//   })
// }

// Vert
// GR = `
//     attribute vec2 uv;
//     attribute vec2 position;

//     varying vec2 vUv;

//     void main() {
//         vUv = uv;
//         gl_Position = vec4(position, 0, 1);
//     }
// `

// Frag
// VR = `
//     precision highp float;

//     uniform sampler2D tMap;

//     uniform float uFalloff;
//     uniform float uAlpha;
//     uniform float uDissipation;

//     uniform float uAspect;
//     uniform vec2 uMouse;
//     uniform vec2 uVelocity;

//     varying vec2 vUv;

//     void main() {
//         vec4 color = texture2D(tMap, vUv) * uDissipation;

//         vec2 cursor = vUv - uMouse;
//         cursor.x *= uAspect;

//         vec3 stamp = vec3(uVelocity * vec2(1, -1), 1.0 - pow(1.0 - min(1.0, length(uVelocity)), 3.0));
//         float falloff = smoothstep(uFalloff, 0.0, length(cursor)) * uAlpha;

//         color.rgb = mix(color.rgb, stamp, vec3(falloff));

//         gl_FragColor = color;
//     }
// `;
