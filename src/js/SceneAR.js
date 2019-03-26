// SceneAR.js
import alfrid from 'alfrid';
import Config from './Config';

const Random = require('canvas-sketch-util/random');
const { linspace, clamp01 } = require('canvas-sketch-util/math');
const { quat, vec3 } = require('gl-matrix');
const palettes = require('color-hunt-scrape');
const eases = require('eases');
const objectAssign = require('object-assign');


const RESOLUTION = 0.75;
const ONE_INCH = 0.0254;
const flowerCount = 30;
const SEED = '491239'; // set to empty string for randomness

Random.setSeed(SEED || Random.getRandomSeed());
console.log('Seed', Random.getSeed());
const monochromatic = false;
const settings = {
  duration: 5,
  suffix: Random.getSeed(),
  units: 'px',
  // pixelsPerInch: 300,
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};


// const ARUtils = require('./ar/ARUtils')
const axis = [ 0, 0, 0 ];

const AVG_HUMAN_HEIGHT = 0.5; //	in meters

function createMaterial (opt = {}) {

  const o = {};
  objectAssign(o, opt);
  // const emissive = new THREE.Color(opt.color);
  const material = new THREE.MeshBasicMaterial(o);
  return material;
}

function createFlower (opts = {}) {
  // let monochromatic = window.monochromatic || false;
  let {
    bloom = 1,
    petalCount = 5,
    size = 1,
    color = new THREE.Color('red'),
    stamenColor = new THREE.Color('yellow'),
    position = new THREE.Vector3(0, 0, 0),
    normal = new THREE.Vector3(0, 1, 0)
  } = opts;

  const group = new THREE.Group();

  const seed = String(Random.rangeFloor(0, 1000000));
  const random = Random.createRandom(seed);

  color = color.clone();
  if (!monochromatic) color.offsetHSL(0.5 / 360 * random.gaussian(), 2.5 / 100 * random.gaussian(), 2.5 / 100 * random.gaussian());

  const petalScale = Random.gaussian(1, 1 / 5);
  const petals = linspace(petalCount).map(t => {
    const angle = Math.PI * 2 * t;
    const o = {};
    objectAssign(o, opts);
    objectAssign(o, {
      random,
      color,
      angle
    });
    const petalMesh = createPetal(o);
    petalMesh.scale.multiplyScalar(petalScale);
    return petalMesh;
  });
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

  const pitColor = color.clone();
  if (!monochromatic) pitColor.offsetHSL(0, 0, -0.15);
  const pit = new THREE.Mesh(sphereGeometry, createMaterial({
    color: pitColor
  }));
  pit.scale.setScalar(ONE_INCH / 8);
  pit.position.y = ONE_INCH / 5;
  // group.add(pit);

  const baseScale = ONE_INCH * random.range(0.5, 0.75);
  const thicknes = ONE_INCH / random.range(120, 160);
  const stamenCount = random.rangeFloor(4, 10);
  const stamens = linspace(stamenCount).map(t => {
    const direction = new THREE.Vector3(0, 1, 0);
    const rotationOut = 0.075 * Math.PI;
    direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), random.gaussian() * rotationOut);
    direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), random.gaussian() * rotationOut);

    const stamenLength = Math.max(0, random.gaussian(baseScale, baseScale / 4));
    const stamenGeometry = new THREE.CylinderGeometry(thicknes, thicknes, stamenLength, 4, 1, false);
    stamenGeometry.translate(0, stamenLength / 2, 0);
    let newStamenColor = stamenColor.clone();
    if (!monochromatic) newStamenColor.offsetHSL(1 / 360 * random.gaussian(), 5 / 100 * random.gaussian(), 10 / 100 * random.gaussian());
    // newStamenColor = new THREE.Color('white')
    const mesh = new THREE.Mesh(stamenGeometry, createMaterial({
      color: newStamenColor
    }));
    mesh.quaternion.fromArray(quaternionFromDirection([], direction.toArray()));
    mesh.position.copy(pit.position);
    const stamen = new THREE.Group();
    stamen.add(mesh);
    const anther = new THREE.Mesh(sphereGeometry, mesh.material.clone());
    anther.position.copy(mesh.position).addScaledVector(direction, stamenLength);
    anther.scale.setScalar(ONE_INCH / 80 + random.gaussian(ONE_INCH, ONE_INCH / 4) / 160);
    stamen.add(anther);
    return stamen;
  });

  petals.forEach(p => group.add(p));
  stamens.forEach(p => group.add(p));

  group.position.copy(position);

  // const normalArrow = new THREE.ArrowHelper(normal, position, ONE_INCH * 4, 0x0000ff);
  // group.add(normalArrow);
  // const tangentArrow = new THREE.ArrowHelper(tangent, position, ONE_INCH * 2, 0x00ff00);
  // group.add(tangentArrow);

  group.scale.multiplyScalar(size);
  group.normal = normal;
  return group;
}

function createPetalGeometry () {

}

function createPetal (opts = {}) {
  let {
    angle = 0,
    random,
    color = new THREE.Color('red'),
    bloom = 1
  } = opts;

  const tangent = new THREE.Vector3(1, 0, 0);
  const normal = new THREE.Vector3(0, 1, 0);

  const padding = random.gaussian() * ONE_INCH / 40;
  angle += random.gaussian() * Math.PI / 40;
  const length = ONE_INCH + random.gaussian() * ONE_INCH / random.range(10, 20);
  const width = ONE_INCH / 2 + random.gaussian() * ONE_INCH / random.range(10, 20);
  const curlDepth = ONE_INCH / 2 + random.gaussian() * ONE_INCH / 20;
  const zCurlAmp = ONE_INCH / 10;
  const zCurlFreq = random.range(0.75, 1.25);

  const normalAlongPlane = tangent.clone();
  normalAlongPlane.applyAxisAngle(normal, angle);

  const xSubdiv = Math.max(10, Math.round(RESOLUTION * 30));
  const ySubdiv = Math.max(5, Math.round(xSubdiv / 2));
  const geometry = new THREE.PlaneGeometry(1, 1, xSubdiv, ySubdiv);

  geometry.vertices.forEach(vert => {
    const u = (vert.x * 2) * 0.5 + 0.5;
    const v = (vert.y * 2) * 0.5 + 0.5;
    // const py = Math.sin(u * Math.PI);
    const py = Math.pow(Math.sin(Math.pow(u, 0.95) * Math.PI), 0.75);

    vert.y *= py;
    vert.y *= 1 + Math.sin((1 - u) * Math.PI * 0.5 + Math.PI * 0.05) * 0.5;

    vert.y *= width;
    vert.x *= length;

    vert.z += curlDepth + Math.sin(Math.pow(1 - u, 0.85) * -Math.PI * 0.5) * curlDepth;
    vert.z += curlDepth * 0.5 + Math.sin(Math.pow(u, 0.5) * -Math.PI * 0.5) * curlDepth * 0.5;

    vert.z += random.noise3D(u, v, angle, zCurlFreq, zCurlAmp);

    vert.x += random.gaussian() * length / 75;
    vert.y += random.gaussian() * width / 75;
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(length / 2, 0, 0);
  geometry.rotateX(random.gaussian() * Math.PI / 40);
  geometry.rotateZ(((1 - bloom) * 90 + random.gaussian() * 10) * Math.PI / 180);
  geometry.rotateY(angle);

  geometry.computeVertexNormals();
  // geometry.computeFlatVertexNormals();

  const newColor = color.clone();
  if (!monochromatic) newColor.offsetHSL(1 / 360 * random.gaussian(), 5 / 100 * random.gaussian(), 10 / 100 * random.gaussian());
  const material = createMaterial({
    color: newColor,
    side: THREE.DoubleSide
    // wireframe: true
  });
  const mesh = new THREE.Mesh(geometry, material);

  // geometry.rotateX(-Math.PI / 2);
  // geometry.translate(length / 2, 0, 0);
  // geometry.rotateX(random.gaussian() * Math.PI / 40);
  // geometry.rotateZ(((1 - bloom) * 90 + random.gaussian() * 10) * Math.PI / 180);
  // geometry.rotateY(angle);
  
  mesh.position.addScaledVector(normalAlongPlane, padding);

  return mesh;
  // const arrow = new THREE.ArrowHelper(direction, position, length, 0xff0000);
  // return arrow;
}


function quaternionFromDirection (out = [], dir = [ 0, 1, 0 ]) {
  // dir is assumed to be normalized
  if (dir[1] > 0.99999) {
    quat.set(out, 0, 0, 0, 1);
  } else if (dir[1] < -0.99999) {
    quat.set(out, 1, 0, 0, 0);
  } else {
    vec3.set(axis, dir[2], 0, -dir[0]);
    vec3.normalize(axis, axis);
    const radians = Math.acos(dir[1]);
    quat.setAxisAngle(out, axis, radians);
  }
  return out;
};


class SceneAR {
	constructor() {
		this._init();

		//	debug
		// gui.add(Config, 'heading').name('Heading AR').listen();


		this._initHeading = 0;
	}


	_init() {
		//	create canvas;
		this.canvas = document.createElement("canvas");
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.canvas.className = 'Main-Canvas';
		document.body.appendChild(this.canvas);

		// Add the XrController pipeline module, which enables 6DoF camera motion estimation.
		XR.addCameraPipelineModule(XR.XrController.pipelineModule())

		// Add a GlTextureRenderer which draws the camera feed to the canvas.
		XR.addCameraPipelineModule(XR.GlTextureRenderer.pipelineModule())

		// Add XR.Threejs which creates a threejs scene, camera, and renderer, and drives the scene camera
		// based on 6DoF camera motion.
		XR.addCameraPipelineModule(XR.Threejs.pipelineModule())


		XR.addCameraPipelineModule({
			// Camera pipeline modules need a name. It can be whatever you want but must be unique within your app.
			name: 'placeground',
			onStart:() => this._onStart(),
			onUpdate:() => this._onUpdate()
		});


		XR.run({canvas:this.canvas});
	}


	_onStart() {
		const { camera, scene, renderer } = XR.Threejs.xrScene();
		camera.position.set(0, AVG_HUMAN_HEIGHT, 0);

		


		const petalGeometryCache = [];
		const maxPetalGeometries = 20;
		
		const defaultStamenColor = 'hsl(0, 0%, 100%)';
		let palette = Random.pick(palettes);
		const nColors = Random.rangeFloor(4, 5);
		palette = Random.shuffle(palette).slice(0, nColors);
		const branchColor = palette[1];
		renderer.setClearColor('#fff', 1);

		const meshes = new THREE.Group();
		this.meshes = meshes;
		let s = 5;
		this.meshes.scale.set(s, s, s);
		this.meshes.position.set(0, AVG_HUMAN_HEIGHT * 1.5, 0);
		scene.add(meshes);

		const ground = new THREE.Mesh(
		  new THREE.PlaneGeometry(1, 1, 5, 5),
		  new THREE.MeshBasicMaterial({
		    color: 'hsl(0, 0%, 90%)',
		    wireframe: true
		  })
		);
		ground.geometry.rotateX(-Math.PI / 2);
		// scene.add(ground);

		const normal = new THREE.Vector3(0, -1, 0);
		const length = ONE_INCH * 12;
		const start = new THREE.Vector3();
		const end = new THREE.Vector3().addScaledVector(normal, -length);
		// const start = new THREE.Vector3().addScaledVector(normal, length / 2);
		// const end = new THREE.Vector3().addScaledVector(normal, -length / 2);
		const steps = 10;
		const vertices = linspace(steps, true).map(t => {
		  const position = start.clone().lerp(end, t);
		  const direction = new THREE.Vector3().fromArray(Random.onSphere());
		  const scale = Random.gaussian() * ONE_INCH / 2;
		  return position.addScaledVector(direction, scale);
		});
		const curve = new THREE.CatmullRomCurve3(vertices);
		const tubeRadius = ONE_INCH * 0.015;
		const tube = new THREE.TubeGeometry(curve, 20, tubeRadius, 8, false);
		const branch = new THREE.Mesh(tube, createMaterial({
		  color: branchColor
		}));
		meshes.add(branch);

		const tangentCurve = new THREE.CatmullRomCurve3(tube.tangents);
		const normalCurve = new THREE.CatmullRomCurve3(tube.normals);
		const binormalCurve = new THREE.CatmullRomCurve3(tube.normals);


		const flowers = linspace(flowerCount, true).map((t) => {
		  if (t < 0.5 && Random.gaussian() > 0) return false;
		  if (Random.gaussian() > 0) t = clamp01(t + Random.gaussian() / 40);
		  const position = curve.getPointAt(t);
		  const tangent = tangentCurve.getPoint(t).normalize();
		  const binormal = binormalCurve.getPoint(t).normalize();
		  const originalNormal = normalCurve.getPoint(t).normalize();
		  const normal = tangent.clone();
		  normal.applyAxisAngle(binormal, Math.PI / 2 + Random.gaussian() * Math.PI * 0.1);
		  normal.applyAxisAngle(tangent, Random.range(-1, 1) * Math.PI);
		  // normal.applyAxisAngle(tangent, Random.range(-1, 1) * Math.PI * 2);
		  // const position = new THREE.Vector3().fromArray(Random.insideSphere(ONE_INCH * 4));
		  // const normal = new THREE.Vector3().fromArray(Random.onSphere());
		  const colorDeck = Random.shuffle(palette);

		  const stamenColor = defaultStamenColor || (monochromatic ? new THREE.Color(branchColor) : new THREE.Color(colorDeck[1] || colorDeck[0]));
		  const flower = createFlower({
		    position: new THREE.Vector3(),
		    normal,
		    color: new THREE.Color(colorDeck[0]),
		    stamenColor: new THREE.Color(stamenColor),
		    petalCount: Random.rangeFloor(3, 6),
		    bloom: Random.range(0.5, 1)
		  });
		  let size = Random.gaussian(1, 1 / 4) * 0.5;
		  if (Random.gaussian() > 2) size += Random.gaussian() * 0.1;
		  if (Random.gaussian() > 1) size += Random.gaussian() * 0.1;
		  flower.scale.multiplyScalar(size);
		  const group = new THREE.Group();
		  group.t = t;
		  group.time = 0;
		  group.duration = 1;
		  group.position.copy(position);
		  // flower.position.addScaledVector(normal, Math.abs(Random.gaussian()) * ONE_INCH * 0.25);
		  // group.position.addScaledVector(normal, Math.abs(Random.gaussian() * ONE_INCH * 0.15));
		  group.add(flower);
		  meshes.add(group);

		  flower.quaternion.fromArray(quaternionFromDirection([], normal.toArray()));

		  return group;
		}).filter(Boolean);

		this.flowers = flowers;

		this.time = new Date().getTime();

		const begin = () => {
		  this.flowers.forEach((flower, i) => {
		    flower.time = 0;
		    flower.scale.setScalar(1e-5);
		  });
		}

		begin();
		setInterval(begin, 5000);
	}



	_onUpdate() {
		const t = new Date().getTime();
		const deltaTime = t - this.time;
		this.time = t;
		const { camera, scene } = XR.Threejs.xrScene();
		scene.scale.set(2, 2, 2);

		this.flowers.forEach((flower, i) => {
		  flower.time += deltaTime/1000;
		  const delay = i * 0.05;
		  // const delay = flower.t * 1;
		
		  const time = Math.max(0, flower.time - delay);
		  
		  const duration = flower.duration;
		  let scale = clamp01(time / duration);
		  scale = eases.circOut(scale);
		  scale = Math.max(1e-5, scale);

		  flower.scale.setScalar(scale);
		  // flower.rotation.x = playhead * Math.PI * 0.05;
		});
	}

}

export default SceneAR;