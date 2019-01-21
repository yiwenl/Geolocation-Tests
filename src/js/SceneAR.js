// SceneAR.js
import alfrid from 'alfrid';
import Config from './Config';
import GLTFLoader from 'three-gltf-loader';
import HeadingCalibrate from './utils/HeadingCalibrate';
import Device from './Device';
import DebugInfo from './debug/DebugInfo';
import { loadModel, placeObjectInfront } from './utils';


const purple = 0xAD50FF
const cherry = 0xDD0065
const mint = 0x00EDAF
const canary = 0xFCEE21

const AVG_HUMAN_HEIGHT = 1.65; //	in meters

class SceneAR {
	constructor() {
		this._init();

		//	debug
		// gui.add(Config, 'heading').name('Heading AR').listen();


		this._hasAddObject = false;

		HeadingCalibrate.on('onStart', ()=>this._onCalibrateStart());
		HeadingCalibrate.on('onEnd', ()=>this._onCalibrateEnd());

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


		this._heading = 0;
		this._headingStart = 0;
		this._headingDiff = new alfrid.EaseNumber(0, 1);
		this._hasCalibrated = false;

		XR.run({canvas:this.canvas});
	}


	_onCalibrateStart() {
		console.log('Calibrating start');

		this._headingStart = this._heading;
	}


	_onCalibrateEnd() {
		this._hasCalibrated = true;
		if(this._arrows1) {
			this._arrows1.visible = true;
			this._arrowsInitHeading.visible = false	
		}

		// console.log('End of calibration, recenter', this.headingDiff);
		XR.XrController.recenter();


		const { camera } = XR.Threejs.xrScene();
		const dist = parseFloat(DebugInfo.distanceToTarget);
		console.log('Dist to target : ', dist);
		placeObjectInfront(this._cube2, camera, this._heading + this.headingDiff, dist, true);
	}


	_onStart() {
		const { camera, scene } = XR.Threejs.xrScene();
		this._initHeading = Device.heading;

		// Add a light to the scene
		const light = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
		scene.add(light)

		const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
		scene.add( directionalLight );
		directionalLight.position.x = directionalLight.position.z = .2;

		// Set the initial camera position relative to the scene we just laid out. This must be at a
		// height greater than y=0.
		camera.position.set(0, AVG_HUMAN_HEIGHT, 0)

		// Sync the xr controller's 6DoF position and camera paremeters with our scene.
		XR.XrController.updateCameraProjectionMatrix({
			origin: camera.position,
			facing: camera.quaternion,
		});

		XR.XrController.configure({ enableWorldPoints: true });

		for (let i = -5; i <=5 ; i += .5) {
			for (let j = -5; j <= 5; j += .5) {
				if (Math.round(i) != i && Math.round(j) != j) { continue }
				const sphere = new THREE.Mesh(
					new THREE.SphereGeometry(.03, 8, 8), new THREE.MeshBasicMaterial({color: purple}))
				sphere.position.set(i, 0, j)
				scene.add(sphere)
			}
		}

		//	loading chevron model
		loadModel('./assets/gltf/arrows.gltf')
			.then( mArrow => this._addArrows(mArrow), (e)=> {
				console.log('Error :', e);
			});


		const geometry = new THREE.BoxGeometry( 1, 1, 1 );
		const material = new THREE.MeshStandardMaterial( {
			roughness:1.0,
			metalness:0.5,
			color:0x1122FF
		} );

		const material2 = new THREE.MeshStandardMaterial( {
			roughness:1.0,
			metalness:0.5,
			color:0x11FF22
		} );
		this._cube = new THREE.Mesh( geometry, material );
		this._cube2 = new THREE.Mesh( geometry, material2 );
		scene.add( this._cube );
		scene.add( this._cube2 );
	}


	placeObject() {
		const { camera } = XR.Threejs.xrScene();
		if(!this._hasAddObject) {
			console.log('Place object ');

			placeObjectInfront(this._cube, camera, this._heading, 10, true);
		}
		this._hasAddObject = true;
	}

	removeObject() {
		this._hasAddObject = false;
	}

	_addArrows(mArrow) {
		const { camera, scene } = XR.Threejs.xrScene();
		const scaleArrow = 0.25;

		this._arrows = mArrow;
		this._arrows.scale.set(scaleArrow, scaleArrow, scaleArrow);
		let meshes = this._arrows.children;
		const material = new THREE.MeshStandardMaterial({
			roughness:1.0,
			metalness:0.5,
			color:0xFF6600
		});

		meshes.forEach( mesh => {
			mesh.material = material;
		});
		scene.add( this._arrows );

		this._arrows1 = mArrow.clone();
		this._arrows1.scale.set(scaleArrow+.1, scaleArrow+.1, scaleArrow+.1);
		const meshes2 = this._arrows1.children;
		const material2 = new THREE.MeshStandardMaterial({
			roughness:1.0,
			metalness:0.5,
			color:0x00FF66
		});

		meshes2.forEach( mesh => {
			mesh.material = material2;
		});
		scene.add( this._arrows1 );
		this._arrows1.visible = false;


		this._arrowsInitHeading = mArrow.clone();
		this._arrowsInitHeading.scale.set(scaleArrow+.1, scaleArrow+.1, scaleArrow+.1);
		meshes = this._arrowsInitHeading.children;
		const materialInit = new THREE.MeshStandardMaterial({
			roughness:1.0,
			metalness:0.5,
			color:0x999999
		});
		// console.log('materialInit', materialInit);

		meshes.forEach( mesh => {
			mesh.material = materialInit;
		});
		scene.add( this._arrowsInitHeading );

	}


	_onUpdate() {
		const { camera } = XR.Threejs.xrScene();
		let front = new THREE.Vector3(0, 0, -1);

		const {x, z} = camera.position;
		front.applyQuaternion(camera.quaternion);
		front.setLength(10);
		this._heading = Math.atan2(front.z, front.x) + Math.PI/2;

		front.setLength(2);
		front.add(camera.position);

		if(this._arrows) {
			this._arrows.position.copy(front);	
			this._arrows.rotation.y = -this._heading;
		}


		let heading2 = this._heading + this.headingDiff;
		front.x = 0;
		front.y = 0;
		front.z = -2;

		front.applyAxisAngle(new THREE.Vector3(0, -1, 0), heading2);
		front.add(camera.position);
		front.y -= 0.5;

		if(this._arrows1) {
			placeObjectInfront(this._arrows1, camera, heading2, 3, true);
		}

		if(!this._hasCalibrated && this._arrowsInitHeading) {
			let heading = this._heading + ( this._initHeading - Device.headingLocal);
			placeObjectInfront(this._arrowsInitHeading, camera, heading, 3, true);
		}

	}


	get headingDiff() {
		return this._headingDiff.value;
	}

	set headingDiff(mValue) {
		this._headingDiff.value = mValue;
	}

}

export default SceneAR;