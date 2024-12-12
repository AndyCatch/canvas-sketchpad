const canvasSketch = require('canvas-sketch')

const settings = {
  dimensions: [1080, 1080],
}

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'black'
    context.fillRect(0, 0, width, height)
    context.lineWidth = width * 0.01
    context.strokeStyle = 'white'

    // workflow is to work with absolute values then calculate in relative values
    // e.g const cellWidth = 60 / 1080 is the same as:
    const cellWidth = width * 0.1
    const cellHeight = height * 0.1
    const gap = width * 0.03
    const ix = width * 0.17 // || 100 initial x
    const iy = height * 0.17

    const off = width * 0.02 // offset

    let x
    let y

    for (i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        x = ix + (cellWidth + gap) * i
        y = iy + (cellHeight + gap) * j
        context.beginPath()
        context.rect(x, y, cellWidth, cellHeight)
        context.stroke()

        if (Math.random() > 0.5) {
          context.beginPath()
          context.rect(
            x + off / 2,
            y + off / 2,
            cellWidth - off,
            cellHeight - off
          )
          context.stroke()
        }
      }
    }
  }
}

canvasSketch(sketch, settings)
