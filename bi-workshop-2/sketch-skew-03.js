const canvasSketch = require('canvas-sketch')
const math = require('canvas-sketch-util/math')
const random = require('canvas-sketch-util/random')
const paper = require('paper-colors')
const riso = require('riso-colors')

const settings = {
	dimensions: [1080, 1080],
	// animate: true,
}

const sketch = ({ context, width, height }) => {
	// variables declared outside the return (render/draw)
	// function only need to be declared once
	let x, y, w, h, fill, stroke

	const num = 30
	const degrees = -30
	const paperColor = random.pick(paper)

	const rects = []

	const rectColors = [
		random.pick(riso).hex,
		random.pick(riso).hex,
		random.pick(riso).hex,
	]

	for (let i = 0; i < num; i++) {
		x = random.range(0, width)
		y = random.range(0, height)
		w = random.range(200, 600)
		h = random.range(40, 200)

		fill = random.pick(rectColors)
		stroke = random.pick(rectColors)

		rects.push({ x, y, w, h, fill, stroke })
	}

	// this is like draw() for p5.js
	return ({ context, width, height }) => {
		context.fillStyle = `${paperColor.hex}`
		context.fillRect(0, 0, width, height)

		rects.forEach((rect) => {
			const { x, y, w, h, fill, stroke } = rect

			context.save()
			context.translate(x, y)
			context.strokeStyle = stroke
			context.fillStyle = fill
			drawSkewedRect({ context, w, h, degrees })
			context.shadowColor = 'black'
			context.shadowOffsetX = 10
			context.shadowOffsetY = 20
			context.stroke()
			context.fill()
			context.restore()
		})
	}
}

const drawSkewedRect = ({ context, w = 600, h = 200, degrees = -45 }) => {
	const angle = math.degToRad(degrees)
	const rx = Math.cos(angle) * w
	const ry = Math.sin(angle) * w

	context.save()
	context.translate(rx * -0.5, (ry + h) * -0.5)
	context.beginPath()
	context.moveTo(0, 0)
	context.lineTo(rx, ry)
	context.lineTo(rx, ry + h)
	context.lineTo(0, h)
	context.closePath()
	context.restore()
}

canvasSketch(sketch, settings)
