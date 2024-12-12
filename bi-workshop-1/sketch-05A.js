const canvasSketch = require('canvas-sketch')
const random = require('canvas-sketch-util/random')
const math = require('canvas-sketch-util/math')

const settings = {
	dimensions: [1080, 1080],
	animate: true,
}

const sketch = ({ width, height }) => {
	const agents = []
	const numAgents = 40

	for (let i = 0; i < numAgents; i++) {
		const x = random.range(0, width)
		const y = random.range(0, height)

		agents.push(new Agent(x, y))
	}

	return ({ context, width, height }) => {
		context.fillStyle = 'black'
		context.fillRect(0, 0, width, height)

		for (let i = 0; i < agents.length; i++) {
			const agent = agents[i]

			for (let j = i + 1; j < agents.length; j++) {
				const other = agents[j]

				const dist = agent.pos.getDistance(other.pos)

				if (dist > 200) continue // go to next iteration of the loop

				context.lineWidth = math.mapRange(dist, 0, 200, 12, 1)

				context.beginPath()
				context.moveTo(agent.pos.x, agent.pos.y)
				context.lineTo(other.pos.x, other.pos.y)
				context.lineCap = 'round'
				context.strokeStyle = 'white'
				context.stroke()
			}
		}

		agents.forEach((agent) => {
			agent.update()
			agent.draw(context)
			agent.bounce(width, height)
			// agent.wrap(width, height)
		})
	}
}

canvasSketch(sketch, settings)

class Vector {
	constructor(x, y) {
		this.x = x
		this.y = y
	}

	getDistance(v) {
		const dx = this.x - v.x
		const dy = this.y - v.y

		return Math.sqrt(dx * dx + dy * dy) // Pythagoras
	}
}

class Agent {
	constructor(x, y) {
		this.pos = new Vector(x, y)
		this.vel = new Vector(random.range(-1, 1), random.range(-1, 1))
		this.radius = random.range(4, 12)
	}

	// checking boundaries
	//
	wrap(width, height) {
		if (this.pos.x > width) this.pos.x = 0
		if (this.pos.x < 0) this.pos.x = width
		if (this.pos.y > height) this.pos.y = 0
		if (this.pos.y < 0) this.pos.y = height
	}

	bounce(width, height) {
		if (this.pos.x <= this.radius || this.pos.x >= width - this.radius) {
			this.vel.x *= -1 // invert velocity of x & y on boundary
		}
		// using this.radius as the boundary makes the boundary of the "ball" bounce
		if (this.pos.y <= this.radius || this.pos.y >= height - this.radius) {
			this.vel.y *= -1
		}
	}

	update() {
		this.pos.x = this.pos.x + this.vel.x
		this.pos.y = this.pos.y + this.vel.y
	}

	draw(context) {
		context.save()
		context.translate(this.pos.x, this.pos.y)

		context.lineWidth = 4

		context.beginPath()
		context.arc(0, 0, this.radius, 0, Math.PI * 2)
		context.fill()
		context.strokeStyle = 'white'
		context.stroke()
		context.restore()
	}
}
