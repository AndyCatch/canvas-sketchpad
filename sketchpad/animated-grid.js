const canvasSketch = require('canvas-sketch')
const Tweakpane = require('tweakpane')
const { lerp } = require('canvas-sketch-util/math')

const params = {
	gridSize: 10,
	length: 0.8,
	thickness: 0.1,
	offsetU: 0.2,
	offsetV: 0.1,
	padding: 0.1,
}

const settings = {
	duration: 3,
	dimensions: [1080, 1080],
	scaleToView: true,
	playbackRate: 'throttle',
	animate: true,
	fps: 24,
}

// Start the sketch
canvasSketch(({ update }) => {
	createPane()

	return ({ context, frame, width, height, playhead }) => {
		context.clearRect(0, 0, width, height)
		context.fillStyle = 'white'
		context.fillRect(0, 0, width, height)

		const gridSize = params.gridSize
		const padding = width * params.padding
		const tileSize = (width - padding * 2) / gridSize

		for (let x = 0; x < gridSize; x++) {
			for (let y = 0; y < gridSize; y++) {
				// get a 0..1 UV coordinate
				const u = gridSize <= 1 ? 0.5 : x / (gridSize - 1)
				const v = gridSize <= 1 ? 0.5 : y / (gridSize - 1)

				// scale to dimensions with a border padding
				const tx = lerp(padding, width - padding, u)
				const ty = lerp(padding, height - padding, v)

				// here we get a 't' value between 0..1 that
				// shifts subtly across the UV coordinates
				const offset = u * params.offsetU + v * params.offsetV
				const t = (playhead + offset) % 1

				// now we get a value that varies from 0..1 and back
				let mod = Math.sin(t * Math.PI)

				// we make it 'ease' a bit more dramatically with exponential
				mod = Math.pow(mod, 20)

				// now choose a length, thickness and initial rotation
				const length = tileSize * params.length
				const thickness = tileSize * params.thickness
				const initialRotation = Math.PI / 2

				// And rotate each line a bit by our modifier
				const rotation = initialRotation + mod * Math.PI

				// Now render...
				draw(context, tx, ty, length, thickness, rotation)
			}
		}
	}

	function draw(context, x, y, length, thickness, rotation) {
		context.save()
		context.fillStyle = 'black'

		// Rotate in place
		context.translate(x, y)
		context.rotate(rotation)
		context.translate(-x, -y)

		// Draw the line
		context.fillRect(x - length / 2, y - thickness / 2, length, thickness)
		context.restore()
	}
}, settings)

const createPane = () => {
	const pane = new Tweakpane.Pane()

	let folder
	folder = pane.addFolder({ title: 'Grid' })
	folder.addInput(params, 'padding', { min: 0.0, max: 2, step: 0.01 })
	folder.addInput(params, 'gridSize', { min: 2, max: 50, step: 1 })
	folder.addInput(params, 'length', { min: 0.1, max: 2, step: 0.1 })
	folder.addInput(params, 'thickness', { min: 0.1, max: 2, step: 0.1 })
	folder.addInput(params, 'offsetU', { min: 0.0, max: 2, step: 0.1 })
	folder.addInput(params, 'offsetV', { min: 0.0, max: 2, step: 0.1 })
}
