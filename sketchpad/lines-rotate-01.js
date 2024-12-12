const canvasSketch = require('canvas-sketch')
const Random = require('canvas-sketch-util/random')
const { linspace, mapRange } = require('canvas-sketch-util/math')

// You can force a specific seed by replacing this with a string value
const defaultSeed = ''

// Set a random seed so we can reproduce this print later
Random.setSeed(defaultSeed || Random.getRandomSeed())

// Print to console so we can see which seed is being used and copy it if desired
// console.log("Random Seed:", Random.getSeed())

const settings = {
	hotkeys: false,
	suffix: Random.getSeed(),
	dimensions: [1080, 1080],
	// dimensions: "letter",
	// orientation: "portrait",
	// pixelsPerInch: 300,
	// playbackRate: 'throttle',
	animate: true,
	duration: 10,
	fps: 30,
}

const TWO_PI = Math.PI * 2
let numFrames = settings.fps * settings.duration
let scalar = 250

const sketch = ({ width, height }) => {
	const pageSize = Math.min(width, height)

	// page settings
	const margin = pageSize * 0.15
	const gridSize = 30
	const background = 'hsl(0, 0%, 5%)'

	// segment settings
	const length = pageSize * 0.1
	const lineWidth = pageSize * 0.00175
	const frequency = 0.5
	let amplitude = 90
	const foreground = 'white'
	const alpha = 1

	// Create some flat data structure worth of points
	// linspace returns an Array
	const cells = linspace(gridSize, true)
		.map((v) => {
			return linspace(gridSize, true).map((u) => {
				return [u, v]
			})
		})
		.flat()

	return ({ context, frame, playhead }) => {
		// Fill the canvas
		context.fillStyle = background
		context.globalAlpha = 1
		context.fillRect(0, 0, width, height)

		// draw grid
		const innerSize = pageSize - margin * 2

		cells.forEach((cell) => {
			const [u, v] = cell

			// scale to inner size
			let x = u * innerSize
			let y = v * innerSize

			// center on page
			x += (width - innerSize) / 2
			y += (height - innerSize) / 2

			// draw cell
			context.globalAlpha = alpha
			context.strokeStyle = foreground

			// Get a seamless 0..1 value for our loop
			let t = Math.sin(playhead * Math.PI)
			// let t = (1.0 * frame) / numFrames

			// now we get a value that varies from 0..1 and back
			let mod = Math.sin(t * Math.PI)
			// we make it 'ease' a bit more dramatically with exponential
			mod = Math.pow(mod, 20)

			let initialRotation = Math.PI / 2
			// And rotate each line a bit by our modifier
			let rotation = initialRotation + mod * Math.PI

			// get a random angle from noise
			let n = Random.noise2D(u * 2 - 1, v * 2 - 1, frequency)
			let angle = n * TWO_PI
			let lineWidth = mapRange(n, -amplitude, amplitude, 1, 10)

			segment(context, x, y, angle * t, length * t, lineWidth)
		})
	}
}

function segment(context, x, y, angle = 0, length = 1, lineWidth = 1) {
	const halfLength = length * 0.5
	const u = Math.cos(angle) * halfLength
	const v = Math.sin(angle) * halfLength
	context.beginPath()
	context.moveTo(x - u, y - v)
	context.lineTo(x + u, y + v)
	context.lineWidth = lineWidth
	context.stroke()
}

canvasSketch(sketch, settings)
