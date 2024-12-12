// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three')

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls')

const canvasSketch = require('canvas-sketch')
const random = require('canvas-sketch-util/random')
const colors = require('riso-colors')

// Print a random color
const color = colors[Math.floor(Math.random() * colors.length)]
console.log(color)

const glsl = require('glslify')

// At the top of the file
const _ = require('lodash')

const settings = {
	duration: 10, // you can slow down the loop by increasing the duration
	dimensions: [1080, 1080],

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
	renderer.setClearColor('#FFFFFF', 1)

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

	// Use lodash to remove duplicates (maybe unneccessary?)
	const cleanPoints = _.uniqWith(points, _.isEqual)

	const vertexShader = glsl(/*glsl*/ `
	// varying vUv enables the passing of attributes from the geometry to the shaders
  		varying vec2 vUv; 
		varying vec3 vPosition;

  		void main()
		{
    		gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);

			// the vars on the right are three.js defined
    		vUv = uv; 
			vPosition = position;
  		}
  		`)

	const fragmentShader = glsl(/* glsl */ `
  		#pragma glslify: noise = require('glsl-noise/simplex/3d');
		#pragma glslify: aastep = require('glsl-aastep');

  		varying vec2 vUv;
		varying vec3 vPosition;
		
  		uniform vec3 color;
  		uniform float time;
		
		// POINT_COUNT is a #define passed in through the Shader material
		uniform vec3 points[POINT_COUNT];

		uniform mat4 modelMatrix;

		float sphereRim (vec3 spherePosition) {
			vec3 normal = normalize(spherePosition.xyz);
			vec3 worldNormal = normalize(mat3(modelMatrix) * normal.xyz);
			vec3 worldPosition = (modelMatrix * vec4(spherePosition, 1.0)).xyz;
			vec3 V = normalize(cameraPosition - worldPosition);
			float rim = 1.0 - max(dot(V, worldNormal), 0.0);

			return pow(smoothstep(0.0, 1.0, rim), 0.5);
		}

  		void main()
  		{
			float dist = 10000.0;

			for(int i = 0; i < POINT_COUNT; i++){
				vec3 p = points[i];
				float d = distance(vPosition, p);
				dist = min(d, dist);
			}

			float mask = aastep(0.2, dist);
			mask = 1.0 - mask;

			vec3 fragColor = mix(color, vec3(1.0), mask);
			float rim = sphereRim(vPosition);
			fragColor += rim * 0.15;

  			gl_FragColor = vec4(vec3(fragColor), 1.0);

			if(mask > 0.5){
				discard;
			}
  		}

		`)

	// console.log(points)
	// Setup a material
	const material = new THREE.ShaderMaterial({
		defines: {
			POINT_COUNT: cleanPoints.length,
		},
		extensions: {
			derivatives: true,
		},
		uniforms: {
			points: { value: cleanPoints },
			time: { value: 0 },
			color: { value: new THREE.Color('tomato') }, // this uniform has to be identical to one in the shader
		},
		side: THREE.DoubleSide,
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
		// To set up a seamless loop... pass in playhead, multiply by Math.PI * 2
		render({ time, playhead }) {
			mesh.rotation.y = playhead * Math.PI * 2
			material.uniforms.time.value = time
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
