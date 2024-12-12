const canvasSketch = require('canvas-sketch')
const Random = require('canvas-sketch-util/random')
const math = require('canvas-sketch-util/math')

const settings = {
	dimensions: [1080, 1080],
	animate: true,
	duration: 10,
	fps: 24,
}

const TWO_PI = Math.PI * 2

const sketch = ({ duration, fps, width, height }) => {
	let numFrames = duration * fps
	let margin = 0

	let m = 0

	let lines = []

	let sumh = 0
	while (true) {
		// console.log("it's true")
		let lr = 0.5 * Math.pow(Random.range(0.5, 2.0), 2)
		let scl = 0.1 * Math.pow(Random.range(0.4, 100), 2)
		let h = width * Math.pow(Random.range(0.2, 1), 4.0)

		sumh += h
		if (sumh >= height - 2 * margin) {
			h -= sumh - (height - 2 * margin)
			lines.push(new Line({ lr, scl, h }))
			m++
			break
		}
		lines.push(new Line({ lr, scl, h }))
		m++
	}

	return ({ context, width, height, frame, playhead }) => {
		context.fillStyle = '#333'
		context.fillRect(0, 0, width, height)

		let t = ((1.0 * (frame - 1)) % numFrames) / numFrames
		let sumh = 0

		for (let j = 0; j < m; j++) {
			for (let x = margin; x < width - margin; x++) {
				//
				let loop_radius = lines[j].lr
				let ns = Random.noise3D(
					100 * (j + lines[j].scl * x),
					loop_radius * Math.cos(TWO_PI * t),
					loop_radius * Math.sin(TWO_PI * t)
				)
				let color = math.clamp(math.mapRange(ns, -0.05, 0.05, 0, 255), 0, 255)
				// console.log(color)
				// let saturation = 80
				// let lightness = 50
				let ns2 = Random.noise2D(x, j, 0.125, 90)
				context.beginPath()
				context.moveTo(x, margin + sumh)
				context.lineTo(x, margin + lines[j].h + sumh)
				// context.strokeStyle = `hsl(${color}, ${saturation}%, ${lightness}%)`
				context.lineWidth = ns2
				context.strokeStyle = `rgb(${color}, ${color}, ${color})`
				context.stroke()
			}
			sumh += lines[j].h
		}

		// context.strokeStyle = 'black'
		// context.strokeRect(margin, margin, width - margin * 2, height - margin * 2)

		context.globalCompositeOperation = 'exclusion'
		context.beginPath()
		context.arc(width * 0.5, height * 0.5, width * 0.5, 0, TWO_PI)
		context.fillStyle = 'white'
		context.fill()
	}
}

canvasSketch(sketch, settings)

class Line {
	constructor({ lr, scl, h }) {
		this.lr = lr
		this.scl = scl
		this.h = h
	}
}
