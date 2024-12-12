// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three')

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls')

const Random = require('canvas-sketch-util/random')

const canvasSketch = require('canvas-sketch')
const packSpheres = require('pack-spheres')
const risoColors = require('riso-colors').map((h) => h.hex)
const paperColors = require('paper-colors').map((h) => h.hex)
const glsl = require('glslify')
const _ = require('lodash')

const settings = {
	scaleToView: true,
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

	// Use lodash to remove duplicates
	return _.uniqWith(datas, _.isEqual)
}

const sketch = ({ context }) => {
	// Create a renderer
	const renderer = new THREE.WebGLRenderer({
		canvas: context.canvas,
	})

	const palette = Random.shuffle(risoColors).slice(0, 2)
	const backgroundHex = Random.pick(paperColors)
	const background = new THREE.Color(backgroundHex)

	// WebGL background color
	renderer.setClearColor(background, 1)

	// Setup a camera
	const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100)
	camera.position.set(2, 2, -4)
	camera.lookAt(new THREE.Vector3())

	// Setup camera controller
	const controls = new THREE.OrbitControls(camera, context.canvas)

	// Setup your scene
	const scene = new THREE.Scene()

	// Setup a geometry
	const geometry = new THREE.IcosahedronBufferGeometry(1, 3)
	const baseGeometry = new THREE.IcosahedronGeometry(1, 1)

	// Used a workaround to circumvent the deprecated geom.vertices method
	const points = getVertices(baseGeometry)

	// For each face, provide the neighbouring points to that face
	const neighbourCount = 3
	addNeighbourAttributes(geometry, points, neighbourCount)

	const bounds = 1.5
	const spheres = packSpheres({
		sample: () => Random.insideSphere(),
		outside: (position, radius) => {
			return new THREE.Vector3().fromArray(position).length() + radius >= bounds
		},
		minRadius: () =>
			Math.max(0.05, 0.05 + Math.min(1.0, Math.abs(Random.gaussian(0, 0.1)))),
		maxCount: 40,
		packAttempts: 4000,
		bounds,
		maxRadius: 1.5,
		minRadius: 0.25,
	})

	const vertexShader = glsl(/*glsl*/ `
		varying vec3 vPosition;
		attribute vec3 neighbour0;
		attribute vec3 neighbour1;
		attribute vec3 neighbour2;
		varying vec3 vNeighbour0;
		varying vec3 vNeighbour1;
		varying vec3 vNeighbour2;

		void main () {
			vPosition = position;

			vNeighbour0 = neighbour0 - vPosition;
			vNeighbour1 = neighbour1 - vPosition;
			vNeighbour2 = neighbour2 - vPosition;

			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
	`)

	const fragmentShader = glsl(/*glsl*/ `
		varying vec3 vPosition;
		uniform vec3 color;
		uniform vec3 pointColor;
		uniform vec3 background;

		#pragma glslify: aastep = require('glsl-aastep');
		#pragma glslify: noise = require('glsl-noise/simplex/4d.glsl');

		// For the sphere rim
		uniform mat4 modelMatrix;
		uniform float time;

		varying vec3 vNeighbour0;
		varying vec3 vNeighbour1;
		varying vec3 vNeighbour2;

		float sphereRim (vec3 spherePosition) {
			vec3 normal = normalize(spherePosition.xyz);
			vec3 worldNormal = normalize(mat3(modelMatrix) * normal.xyz);
			vec3 worldPosition = (modelMatrix * vec4(spherePosition, 1.0)).xyz;
			vec3 V = normalize(cameraPosition - worldPosition);
			float rim = 1.0 - max(dot(V, worldNormal), 0.0);
			return pow(smoothstep(0.0, 1.0, rim), 0.5);
		}

		void main () {
			// Find the smallest distance of the 3 neighbours
			float d0 = dot(vNeighbour0, vNeighbour0);
			float d1 = dot(vNeighbour1, vNeighbour1);
			float d2 = dot(vNeighbour2, vNeighbour2);
			float dist = sqrt(min(d0, min(d1, d2)));

			// use the first (closest) neighbour to create noise offets
			vec3 curNeighbour = vNeighbour0;

			float pointOff = noise(vec4(vPosition + vNeighbour0.xyz, time * 0.5));
			float pointSize = max(0.0, 0.05 + 0.2 * pointOff);
			float inside = 1.0 - aastep(pointSize, dist);

			vec3 fragColor = mix(color, pointColor, inside);

			float rim = sphereRim(vPosition);
			fragColor += (1.0 - rim) * color * 0.25;

			float stroke = aastep(0.9, rim);
			fragColor = mix(fragColor, background, stroke);

			gl_FragColor = vec4(fragColor, 1.0);
		}
`)

	const meshes = spheres.map((sphere) => {
		const color0 = Random.pick(palette)

		// Setup a material
		const material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: true,
			},
			uniforms: {
				background: { value: new THREE.Color(background) },
				color: { value: new THREE.Color(color0) },
				pointColor: { value: new THREE.Color('black') },
				time: { value: 0 },
			},
			vertexShader,
			fragmentShader,
		})

		// Setup a mesh with geometry + material
		const mesh = new THREE.Mesh(geometry, material)
		mesh.position.fromArray(sphere.position)
		mesh.scale.setScalar(sphere.radius)
		mesh.quaternion.fromArray(Random.quaternion())
		mesh.rotationSpeed = Random.gaussian() * 0.1
		scene.add(mesh)

		return mesh
	})

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
		// To set up a seamless loop... pass in playhead
		render({ time, deltaTime }) {
			meshes.forEach((mesh) => {
				mesh.rotateOnWorldAxis(
					new THREE.Vector3(0, 1, 0),
					deltaTime * mesh.rotationSpeed
				)
				mesh.material.uniforms.time.value = time
			})
			scene.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), 0.05 * deltaTime)
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

function addNeighbourAttributes(
	bufferGeometry,
	baseVertices,
	neighbourCount = 3
) {
	if (bufferGeometry.getIndex()) {
		throw new Error('This is only supported on un-indexed geometries')
	}

	// We will give each triangle in the geometry N nearest neighbours
	const positionAttr = bufferGeometry.getAttribute('position')
	const vertexCount = positionAttr.count

	// First let's build a little list of attribute names + vertex data
	const neighbourAttribs = []
	for (let i = 0; i < neighbourCount; i++) {
		neighbourAttribs.push({
			name: `neighbour${i}`,
			data: [],
		})
	}

	for (let i = 0; i < vertexCount / 3; i++) {
		// Get the triangle centroid, we will use that for comparison
		const centroid = new THREE.Vector3()

		for (let c = 0; c < 3; c++) {
			const x = positionAttr.getX(i * 3 + c)
			const y = positionAttr.getY(i * 3 + c)
			const z = positionAttr.getZ(i * 3 + c)
			const vert = new THREE.Vector3(x, y, z)
			centroid.add(vert)
		}

		centroid.divideScalar(3)

		const neighbours = getNearestNeighbours(
			centroid,
			baseVertices,
			neighbourCount
		)

		// Go through each neighbour and add its XYZ data in
		neighbours.forEach((n, i) => {
			// Repeat this 3 times
			for (let c = 0; c < 3; c++) {
				neighbourAttribs[i].data.push(...n.toArray())
			}
		})

		neighbourAttribs.forEach((attrib) => {
			const array = new Float32Array(attrib.data)
			const buf = new THREE.BufferAttribute(array, 3)
			bufferGeometry.setAttribute(attrib.name, buf)
		})
	}
}

// Extract neighbours from a point with a given vertext list
function getNearestNeighbours(point, list, count) {
	// Get distance squared from this point to all others
	const data = list
		.filter((p) => p.point !== point) // Avoid any that match the input
		// Get an object with distance
		.map((other) => {
			return {
				distance: point.distanceToSquared(other),
				point: other,
			}
		})

	// sort by distance
	data.sort((a, b) => a.distance - b.distance)

	// sort only N neighbours
	return data.slice(0, count).map((p) => p.point)
}
