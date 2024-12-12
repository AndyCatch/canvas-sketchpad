// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three')

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls')

const canvasSketch = require('canvas-sketch')
const random = require('canvas-sketch-util/random')
const palettes = require('nice-color-palettes')
const BezierEasing = require('bezier-easing')
const glslify = require('glslify')

const settings = {
  dimensions: [1080, 1080],
  fps: 24,
  // sets loop
  duration: 4,
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  attributes: { antialias: true },
}

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  })

  // WebGL background color
  renderer.setClearColor('hsl(0,0%,5%)', 1)

  // Setup a camera
  const camera = new THREE.OrthographicCamera()

  // Setup your scene
  const scene = new THREE.Scene()

  const palette = random.pick(palettes)

  // Setup a geometry
  const geometry = new THREE.SphereGeometry(1, 32, 32)

  const fragmentShader = glslify(/*glsl*/ `
  varying vec2 vUv;

  #pragma glslify: noise = require('glsl-noise/simplex/3d');

  uniform vec3 color;
  uniform float playhead;

  void main() {
    float offset = 0.3 * noise(vec3(vUv.xy * 10.0, playhead));

    gl_FragColor = vec4(vec3(color * vUv.x + offset), 1.0);  
  }
  `)

  const vertexShader = glslify(/*glsl*/ `
  varying vec2 vUv; //varyings set from GLSL

  uniform float playhead; // uniforms set from JS

  #pragma glslify: noise = require('glsl-noise/simplex/4d');

  void main(){
    vUv = uv;
    
    vec3 pos = position.xyz;

    // Multiple layers of noise
    pos += 0.35 * normal * noise(vec4(pos.xyz * 1.0, playhead));
    // pos += 0.25 * normal * noise(vec4(pos.xyz * 1.0, playhead));
    // pos += 0.05 * normal * noise(vec4(pos.xyz * 100.0, 0.0));


    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `)

  // Setup a mesh with geometry + material
  const meshes = []
  for (let i = 0; i < 10; i++) {
    const mesh = new THREE.Mesh(
      geometry,
      // Setup a material
      new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        uniforms: {
          color: { value: new THREE.Color(random.pick(palette)) },
          playhead: { value: 0 }, // this time val needs updating in render func
        },
      })
    )
    mesh.position.set(
      random.range(-0.5, 0.5),
      random.range(-0.5, 0.5),
      random.range(-0.5, 0.5)
    )
    mesh.scale.set(
      random.range(-1, 1),
      random.range(-1, 1),
      random.range(-1, 1)
    )
    mesh.scale.multiplyScalar(0.95)
    scene.add(mesh)

    meshes.push(mesh)
  }

  scene.add(new THREE.AmbientLight('hsl(0,0%,40%)'))

  const light = new THREE.DirectionalLight('#F2F2F2', 1)
  light.position.set(0, 0, 4)
  scene.add(light)

  const easeFn = BezierEasing(0.98, 0.01, 0.27, 0.99)

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(viewportWidth, viewportHeight, false)

      const aspect = viewportWidth / viewportHeight

      // Ortho zoom
      const zoom = 2

      // Bounds
      camera.left = -zoom * aspect
      camera.right = zoom * aspect
      camera.top = zoom
      camera.bottom = -zoom

      // Near/Far
      camera.near = -100
      camera.far = 100

      // Set position & look at world center
      camera.position.set(zoom, zoom, zoom)
      camera.lookAt(new THREE.Vector3())

      // Update the camera
      camera.updateProjectionMatrix()
    },
    // Update & render your scene here
    render({ playhead }) {
      // Rotate scene
      // scene.rotation.y = playhead * Math.PI * 2 // sets the rotation at a full circle
      t = Math.sin(playhead * Math.PI)
      scene.rotation.z = easeFn(t) // Custom ease function

      meshes.forEach((mesh) => {
        mesh.material.uniforms.playhead.value = playhead
      })

      renderer.render(scene, camera)
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      renderer.dispose()
    },
  }
}

canvasSketch(sketch, settings)
