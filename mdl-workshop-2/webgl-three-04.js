// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three')

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls')

const canvasSketch = require('canvas-sketch')

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
}

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  })

  // WebGL background color
  renderer.setClearColor('#333333', 1)

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100)
  camera.position.set(0, 0, -4)
  camera.lookAt(new THREE.Vector3())

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas)

  // Setup your scene
  const scene = new THREE.Scene()

  // Setup a geometry
  const geometry = new THREE.BoxGeometry(1, 1, 1)

  const vertexShader = /*glsl*/ `
  varying vec2 vUv; // varying vUv enables the passing of attributes from the geometry to the shaders
  void main(){
    vUv = uv; // uv is built in to Three.js
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
  }
  `

  const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 color;
  uniform float time;
  void main(){
    vec2 center = vec2(0.5,0.5);

    // JS a % b
    // GLSL mod(a,b)
    vec2 pos = mod(vUv * 8.0,1.0);

    // distance is a built-in GLSL function, gives distance from one co-ord to another
    float d = distance(pos, center); 

    float mask = step(0.25 + sin(time + vUv.x * 2.0) * 0.25, d);

    mask = 1.0 - mask;

    vec3 fragColor = mix(color, vec3(1.0), mask);

    gl_FragColor = vec4(vec3(fragColor),1.0);
  }
  `

  // Setup a material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color('tomato') }, // this uniform has to be identical to one in the shader
    },
    vertexShader,
    fragmentShader,
    //
  })

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(viewportWidth, viewportHeight, false)
      camera.aspect = viewportWidth / viewportHeight
      camera.updateProjectionMatrix()
    },
    // Update & render your scene here
    render({ time }) {
      material.uniforms.time.value = time
      mesh.rotation.y = time * 0.5
      mesh.rotation.x = time * 0.25
      controls.update()
      renderer.render(scene, camera)
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose()
      renderer.dispose()
    },
  }
}

canvasSketch(sketch, settings)
