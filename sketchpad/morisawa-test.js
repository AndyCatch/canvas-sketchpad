const canvasSketch = require('canvas-sketch');
const Tweakpane = require('tweakpane');

// Set up the sketch settings
const settings = {
  dimensions: [800, 800], // Default canvas size, can be adjusted
  animate: true, // Enable animation to reflect updates
};

let manager

// Parameters controlled by Tweakpane
const params = {
  numberOfLines: 10,
  reflected: false,
  horizontalGap: 0.0, // Gap between ellipses as a fraction of ellipse width
  verticalGap: 0.0, // Gap between lines as a fraction of ellipse height
  reverseEllipses: false, // Toggle to reverse the number of ellipses
};

// Define the sketch
const sketch = ({ context, width, height }) => {

  return () => {
    // Clear the canvas
    context.clearRect(0, 0, width, height);

    // Determine total lines for reflection logic
    const totalLines = params.reflected ? params.numberOfLines * 2 - 1 : params.numberOfLines;

    // Calculate ellipse dimensions and spacing
    const ellipseHeight = height / totalLines * (1 - params.verticalGap);

    for (let line = 1; line <= totalLines; line++) {
      // Determine effective line number for reflection
      const effectiveLine =
        line <= params.numberOfLines ? line : 2 * params.numberOfLines - line;

      // Determine number of ellipses in line
      const ellipsesInLine = params.reverseEllipses 
        ? params.numberOfLines - effectiveLine + 1 
        : effectiveLine;

      const ellipseWidth = (width / ellipsesInLine) * (1 - params.horizontalGap); // Width of each ellipse based on the line
      const y = (line - 0.5) * (height / totalLines); // Vertical position of the current line

      for (let i = 0; i < ellipsesInLine; i++) {
        const x = (width / ellipsesInLine) * (i + 0.5); // Horizontal position for each ellipse

        // Draw the ellipse
        context.beginPath();
        context.ellipse(x, y, ellipseWidth / 2, ellipseHeight / 2, 0, 0, Math.PI * 2);
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.stroke();
      }
    }
  };
};

const createPane = () => {
  const pane = new Tweakpane.Pane();

  pane.addInput(params, "numberOfLines", {
    min: 1,
    max: 50,
    step: 1,
  });
  pane.addInput(params, "reflected", {
    label: "Reflected",
  });
  pane.addInput(params, "horizontalGap", {
    min: 0,
    max: 1,
    step: 0.01,
    label: "Horizontal Gap",
  });
  pane.addInput(params, "verticalGap", {
    min: 0,
    max: 1,
    step: 0.01,
    label: "Vertical Gap",
  });
  pane.addInput(params, 'reverseEllipses', {
    label: 'Reverse Ellipses',
  });
};

const start = async () => {
  manager = await canvasSketch(sketch, settings)
}

start()
createPane()
