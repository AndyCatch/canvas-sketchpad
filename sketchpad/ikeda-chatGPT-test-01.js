const canvasSketch = require('canvas-sketch')
const Random = require('canvas-sketch-util/random')

const settings = {
	dimensions: [1080, 1080],
	animate: false,
}

const sketch = () => {
	return ({ context, width, height }) => {
		const CELL_SIZE = width / 20
		const OCTAVES = 2.5
		const NOISE_SCALE = 0.025
		const COLOR_SCALE = 80

		context.fillStyle = 'black'
		context.fillRect(0, 0, width, height)

		context.strokeStyle = 'white'
		context.lineWidth = 0

		for (let x = 0; x < width; x += CELL_SIZE) {
			for (let y = 0; y < height; y += CELL_SIZE) {
				const nx = Math.floor(x * NOISE_SCALE)
				const ny = Math.round(y * NOISE_SCALE)
				let noiseValue = 0

				for (let i = 1; i <= OCTAVES; i++) {
					const frequency = Math.pow(2, i)
					const amplitude = Math.pow(2, i)
					noiseValue += Random.noise2D(
						nx * frequency,
						ny * frequency,
						frequency,
						amplitude
					)
				}

				const colorValue = Math.floor(((noiseValue + 1) * COLOR_SCALE) / 2)
				const hue = 200 - colorValue
				const saturation = 50
				const lightness = 50 + colorValue / 2
				context.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`

				context.beginPath()
				context.rect(x, y, CELL_SIZE, CELL_SIZE)
				context.fill()
			}
		}
	}
}

canvasSketch(sketch, settings)
