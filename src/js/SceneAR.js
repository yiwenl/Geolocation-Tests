// SceneAR.js
import alfrid from 'alfrid';
import Config from './Config';
import GLTFLoader from 'three-gltf-loader';
import HeadingCalibrate from './utils/HeadingCalibrate';
import Device from './Device';
import { loadModel } from './utils';


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

		console.log('End of calibration, recenter');
		XR.XrController.recenter();


		const { camera } = XR.Threejs.xrScene();
		this._realWorldScale = AVG_HUMAN_HEIGHT / camera.position.y;

		// window.addEventListener('touchstart', () => {
		// 	console.log('XR Recenter');
		// 	XR.XrController.recenter();			
		// });
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
	}


	placeObject() {
		if(!this._hasAddObject) {
			console.log('Place object ');
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
			this._arrows1.position.copy(front);	
			this._arrows1.rotation.y = -heading2;
		}


		if(!this._hasCalibrated) {
			let heading3 = this._heading + ( this._initHeading - Device.headingLocal);

			const q = new THREE.Quaternion();
			q.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), heading3 );

			front = new THREE.Vector3(0, 0, -1);
			front.applyQuaternion(q);
			front.setLength(3);
			front.add(camera.position);
			front.y -= 0.5;

			if(this._arrowsInitHeading) {
				this._arrowsInitHeading.position.copy(front);	
				this._arrowsInitHeading.rotation.y = -heading3;
			}	
		}
		

		this._realWorldScale = AVG_HUMAN_HEIGHT / camera.position.y;

		// if(Math.random() > .9) {
		// 	console.log('Camera Y :', camera.position.y, this._realWorldScale);
		// }
	}


	get headingDiff() {
		return this._headingDiff.value;
	}

	set headingDiff(mValue) {
		this._headingDiff.value = mValue;
	}

}

export default SceneAR;