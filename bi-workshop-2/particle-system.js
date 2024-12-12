const canvasSketch = require('canvas-sketch')
const random = require('canvas-sketch-util/random')
const math = require('canvas-sketch-util/math')
const eases = require('eases')
const colormap = require('colormap')

const settings = {
	dimensions: [1080, 1080],
	animate: true,
}

const particles = []
const cursor = { x: 9999, y: 9999 }

const colors = colormap({
	colormap: 'viridis',
	nshades: 50,
})

let elCanvas

const sketch = ({ width, height, canvas }) => {
	let x, y, particle, radius
	let pos = []

	let numCircles = 15
	let gapCircle = 8
	let gapDot = 4
	let dotRadius = 18
	let cirRadius = 0
	let fitRadius = dotRadius

	elCanvas = canvas
	canvas.addEventListener('mousedown', onMouseDown)

	for (let i = 0; i < numCircles; i++) {
		const circumference = Math.PI * 2 * cirRadius
		const numFit = i ? Math.floor(circumference / (fitRadius * 2 + gapDot)) : 1
		const fitSlice = (Math.PI * 2) / numFit

		for (let j = 0; j < numFit; j++) {
			const theta = fitSlice * j

			x = Math.cos(theta) * cirRadius
			y = Math.sin(theta) * cirRadius

			x += width * 0.5
			y += height * 0.5

			radius = dotRadius

			particle = new Particle({ x, y, radius })
			particles.push(particle)
		}

		cirRadius += fitRadius * 2 + gapCircle
		dotRadius = (1 - eases.quadOut(i / numCircles)) * fitRadius
	}

	return ({ context, width, height }) => {
		context.fillStyle = 'black'
		context.fillRect(0, 0, width, height)

		particles.sort((a, b) => a.scale - b.scale)

		particles.forEach((particle) => {
			particle.update()
			particle.draw(context)
		})
	}
}

const onMouseDown = (e) => {
	window.addEventListener('mousemove', onMouseMove)
	window.addEventListener('mouseup', onMouseUp)

	// instead of duplicating logic, delegate function
	onMouseMove(e)
}

// calculate the position of the cursor proportional to the sketch scale
const onMouseMove = (e) => {
	const x = (e.offsetX / elCanvas.offsetWidth) * elCanvas.width
	const y = (e.offsetY / elCanvas.offsetHeight) * elCanvas.height

	cursor.x = x
	cursor.y = y
}

const onMouseUp = () => {
	window.removeEventListener('mousemove', onMouseMove)
	window.removeEventListener('mouseup', onMouseUp)

	cursor.x = 9999
	cursor.y = 9999
}

canvasSketch(sketch, settings)

class Particle {
	constructor({ x, y, radius = 10 }) {
		//position
		this.x = x
		this.y = y

		// accerlatation
		this.ax = 0
		this.ay = 0

		// velocity
		this.vx = 0
		this.vy = 0

		// initial position
		this.ix = x
		this.iy = y

		this.radius = radius
		this.scale = 1
		this.color = colors[0]

		this.minDist = random.range(100, 200)
		this.pushFactor = random.range(0.01, 0.02)
		this.pullFactor = random.range(0.002, 0.006)
		this.dampFactor = random.range(0.9, 0.95)
	}

	update() {
		let dx, dy, dd, distDelta
		let indexColor

		//pull force
		dx = this.ix - this.x
		dy = this.iy - this.y
		dd = Math.sqrt(dx * dx + dy * dy)

		this.ax = dx * this.pullFactor
		this.ay = dy * this.pullFactor

		this.scale = math.mapRange(dd, 0, 200, 1, 5)

		indexColor = Math.floor(
			math.mapRange(dd, 0, 200, 0, colors.length - 1, true)
		)
		this.color = colors[indexColor]

		// push force
		dx = this.x - cursor.x
		dy = this.y - cursor.y
		dd = Math.sqrt(dx * dx + dy * dy) // Pythag / Vector Magnitude

		distDelta = this.minDist - dd

		if (dd < this.minDist) {
			this.ax += (dx / dd) * distDelta * this.pushFactor
			this.ay += (dy / dd) * distDelta * this.pushFactor
		}

		// value initial
		// this.ax += 0.00001

		this.vx += this.ax
		this.vy += this.ay

		this.vx *= this.dampFactor
		this.vy *= this.dampFactor

		this.x += this.vx
		this.y += this.vy
	}

	draw(context) {
		context.save()
		context.translate(this.x, this.y)
		context.fillStyle = this.color

		context.beginPath()
		context.arc(0, 0, this.radius * this.scale, 0, Math.PI * 2)
		context.fill()

		context.restore()
	}
}

// Randomly distribute inside a circle – replace for loop
// for (let i = 0; i < 500; i++) {
//   x = width * 0.5
//   y = height * 0.5

//   random.insideCircle(400, pos)
//   x += pos[0]
//   y += pos[1]

//   particle = new Particle({x,y})
//   particles.push(particle)
// }