const canvasSketch = require('canvas-sketch')
const { shader } = require('canvas-sketch-util')
const createShader = require('canvas-sketch-util/shader')
const Tweakpane = require('tweakpane')
const glsl = require('glslify')

// Input image texture URL
const textureURL = 'images/test-input.png'

let textureA

// GLSL shader code
const frag = glsl`
  precision highp float;

  uniform vec2 uResolution;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec2 uGridSize;

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;

    // Flip the UV vertically to correct upside-down rendering
    uv.y = 1.0 - uv.y;

    // Compute distance from the center and strength
    float dist = distance(vec2(0.5, 0.5), uv);
    float strength = smoothstep(0.6, 0.0, dist);

    // Set up grid size
    vec2 gridSize = uGridSize; // Number of rows and columns
    vec2 gridUV = fract(uv * gridSize); // Local UV within each cell
    vec2 gridIndex = floor(uv * gridSize); // Discrete cell index

    // Add displacement based on grid index and strength
    float displacement = 0.02 * sin(uTime + gridIndex.x * strength * 3.0 + gridIndex.y * strength * 2.0);
    vec2 displacedUV = uv + displacement;

    // Adjust UVs to handle aspect ratio mismatches
    float aspect = uResolution.x / uResolution.y;
    displacedUV.x *= aspect;

    // Sample the texture
    vec4 color = texture2D(uTexture, displacedUV);

    // Output the color
    gl_FragColor = color;
  }
`

const settings = {
	context: 'webgl',
	animate: true,
	dimensions: [1080, 1080], // Set explicit dimensions
}

// Parameters controlled by Tweakpane
const params = {
	numberOfRows: 10,
	numberOfCols: 10,
}

const sketch = ({ gl, width, height }) => {
	const shader = createShader({
		gl,
		frag,
		uniforms: {
			uResolution: () => [width, height],
			uTime: ({ time }) => time, // Initialize with a default value
			uTexture: () => textureA,
			uGridSize: () => [params.numberOfCols, params.numberOfRows], // Default rows and columns
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
		},
	}
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

	pane
		.addInput(params, 'numberOfCols', {
			min: 1,
			max: 50,
			step: 1,
		})
		.on('change', (ev) => {
			console.log('changed: ' + JSON.stringify(ev.value))
		})

	pane
		.addInput(params, 'numberOfRows', {
			min: 1,
			max: 50,
			step: 1,
		})
		.on('change', (ev) => {
			console.log('changed: ' + JSON.stringify(ev.value))
		})
}

const start = async () => {
	textureA = await loadImage(textureURL)

	manager = await canvasSketch(sketch, settings)
}

start()
createPane()
