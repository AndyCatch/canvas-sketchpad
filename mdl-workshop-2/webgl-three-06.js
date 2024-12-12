// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three')

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls')

const canvasSketch = require('canvas-sketch')
const random = require('canvas-sketch-util/random')
const glsl = require('glslify')

// At the top of the file
const _ = require('lodash')

const settings = {
	// Make the loop animated
	animate: true,
	// Get a WebGL canvas rather than 2D
	context: 'webgl',
}

const getVertices = function (geom) {
	let positions = geom.attributes.position.array
	let count = positions.length / 3
	let datas = []
	for (let i = 0; i < count; i++) {
		datas.push(
			new THREE.Vector3(
				positions[i * 3],
				positions[i * 3 + 1],
				positions[i * 3 + 2]
			)
		)
	}
	return datas
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
	const geometry = new THREE.SphereGeometry(1, 32, 16)

	// We set up a baseGeom to get the points map
	const baseGeometry = new THREE.IcosahedronGeometry(1, 1)

	// Used a workaround to circumvent the deprecated geom.vertices method
	const points = getVertices(baseGeometry)

	const circleGeom = new THREE.CircleGeometry(1, 32)

	// Use lodash to remove duplicates (maybe unneccessary?)
	const cleanPoints = _.uniqWith(points, _.isEqual)

	cleanPoints.forEach((point) => {
		const mesh = new THREE.Mesh(
			circleGeom,
			new THREE.MeshBasicMaterial({
				color: 'white',
				side: THREE.DoubleSide,
				// wireframe: true,
			})
		)
		mesh.position.copy(point)
		mesh.scale.setScalar(0.2 * Math.random())
		mesh.lookAt(new THREE.Vector3()) // by making a new Vec3, it spawns in the center
		scene.add(mesh)
	})

	const vertexShader = glsl(/*glsl*/ `
  		varying vec2 vUv; // varying vUv enables the passing of attributes from the geometry to the shaders
  		void main()
		{
    		vUv = uv; // uv is built in to Three.js
    		gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
  		}
  		`)

	const fragmentShader = glsl(/* glsl */ `
  		#pragma glslify: noise = require(glsl-noise/simplex/3d);

  		varying vec2 vUv;
  		uniform vec3 color;
  		uniform float time;

  		void main()
  		{
  		  gl_FragColor = vec4(vec3(color), 1.0);
  		}

		`)

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
			// mesh.rotation.y = time * 0.05
			// mesh.rotation.x = time * 0.025
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
