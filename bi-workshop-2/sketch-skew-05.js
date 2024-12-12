const canvasSketch = require('canvas-sketch')
const math = require('canvas-sketch-util/math')
const random = require('canvas-sketch-util/random')
const Color = require('canvas-sketch-util/color')
const paper = require('paper-colors')
const riso = require('riso-colors')

const seed = random.getRandomSeed()

const settings = {
	dimensions: [1080, 1080],
	animate: true,
	name: seed,
}

const sketch = ({ context, width, height }) => {
	random.setSeed(seed) // setting a seed value, ensures a consistent result

	// variables declared outside the return (render/draw)
	// function only need to be declared once
	let x, y, w, h, fill, stroke, blend

	const num = 40
	const degrees = -30
	const paperColor = random.pick(paper).hex
	const strokeColor = Color.offsetHSL(paperColor, 0, 0, -4)

	const rects = []

	const rectColors = [random.pick(riso).hex, random.pick(riso).hex]

	const mask = {
		radius: width * 0.3,
		sides: 8,
		x: width * 0.5,
		y: height * 0.5,
	}

	for (let i = 0; i < num; i++) {
		x = random.range(0, width)
		y = random.range(0, height)
		w = random.range(600, 600)
		h = random.range(40, 200)

		fill = random.pick(rectColors)
		stroke = random.pick(rectColors)

		blend = random.value() > 0.5 ? 'overlay' : 'source-over'

		rects.push({ x, y, w, h, fill, stroke, blend })
	}

	// this is like draw() for p5.js
	return ({ context, width, height }) => {
		context.fillStyle = paperColor
		context.fillRect(0, 0, width, height)

		context.save()
		context.translate(mask.x, mask.y)

		drawPolygon({ context, radius: mask.radius, sides: mask.sides })
		context.clip()

		rects.forEach((rect) => {
			const { x, y, w, h, fill, stroke, blend } = rect
			let shadowColor

			context.save()
			context.translate(-mask.x, -mask.y)
			context.translate(x, y)
			context.strokeStyle = stroke
			context.fillStyle = fill
			context.globalCompositeOperation = blend
			// context.globalCompositeOperation = 'overlay' // looks good

			drawSkewedRect({ context, w, h, degrees })

			shadowColor = Color.offsetHSL(fill, 0, 0, -20)
			shadowColor.rgba[3] = 0.4

			context.shadowColor = Color.style(shadowColor.rgba)
			context.shadowOffsetX = 10
			context.shadowOffsetY = 20

			context.fill()

			context.shadowColor = null
			context.stroke()
			context.restore()
		})

		context.restore()

		// polygon outline
		context.save()
		context.translate(mask.x, mask.y)

		drawPolygon({ context, radius: mask.radius, sides: mask.sides })
		context.lineWidth = 2

		context.strokeStyle = strokeColor.hex
		context.stroke()

		context.restore()
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

const drawPolygon = ({ context, radius = 100, sides = 3 }) => {
	const slice = (Math.PI * 2) / sides

	context.beginPath()
	context.moveTo(0, -radius)

	for (let i = 1; i < sides; i++) {
		const theta = i * slice - Math.PI * 0.5
		context.lineTo(Math.cos(theta) * radius, Math.sin(theta) * radius)
	}

	context.closePath()
}

canvasSketch(sketch, settings)
