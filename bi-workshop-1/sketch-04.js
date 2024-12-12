const canvasSketch = require('canvas-sketch')
const math = require('canvas-sketch-util/math')
const random = require('canvas-sketch-util/random')

const settings = {
  dimensions: [1080, 1080],
}

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'black'
    context.fillRect(0, 0, width, height)
    context.fillStyle = 'white'

    const cx = width
    const cy = height * 0

    const w = width * 0.01
    const h = height * 0.1
    let x
    let y

    const numShapes = 50
    const radius = width * 0.8

    for (let i = 0; i < numShapes; i++) {
      const slice = math.degToRad(360 / numShapes)
      const angle = slice * i

      x = cx + radius * Math.sin(angle)
      y = cy + radius * Math.cos(angle)

      context.save() // like pop() in p5
      context.translate(x, y)
      context.rotate(-angle)
      context.scale(random.range(0.1, 2), random.range(0.2, 0.5))

      context.beginPath()
      context.rect(-w * 0.5, -h * 0.5, w, h)
      context.fill()
      context.restore()

      context.save()
      context.translate(cx, cy)
      context.rotate(-angle)

      context.lineWidth = random.range(1, 40)

      context.beginPath()
      context.arc(
        0,
        0,
        radius * random.range(0.7, 1.3),
        slice * random.range(1, -10),
        slice * random.range(1, -5)
      )
      context.strokeStyle = 'white'
      context.stroke()

      context.restore()
    }
  }
}

canvasSketch(sketch, settings)
