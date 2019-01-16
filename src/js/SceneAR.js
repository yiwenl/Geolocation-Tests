// SceneAR.js
import alfrid from 'alfrid';
import Config from './Config';
import GLTFLoader from 'three-gltf-loader';


class SceneAR {
	constructor() {
		this._init();

		//	debug
		// gui.add(Config, 'heading').name('Heading AR').listen();
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
		this._headingDiff = new alfrid.EaseNumber(0, 1);

		XR.run({canvas:this.canvas});
	}


	_onStart() {
		const { camera, scene } = XR.Threejs.xrScene();

		// Add a light to the scene
		const light = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
		scene.add(light)

		const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
		scene.add( directionalLight );
		directionalLight.position.x = directionalLight.position.z = .2;

		// Set the initial camera position relative to the scene we just laid out. This must be at a
		// height greater than y=0.
		camera.position.set(0, 3, 0)

		// Sync the xr controller's 6DoF position and camera paremeters with our scene.
		XR.XrController.updateCameraProjectionMatrix({
			origin: camera.position,
			facing: camera.quaternion,
		});


		var geometry = new THREE.SphereBufferGeometry( .2, 32, 32 );
		var material = new THREE.MeshStandardMaterial( {roughness:1.0,metalness:0.5,color: 0xff6600} );
		var material2 = new THREE.MeshStandardMaterial( {roughness:1.0,metalness:0.5,color: 0x990000} );
		this.ball = new THREE.Mesh( geometry, material );
		this.ball2 = new THREE.Mesh( geometry, material2 );
		// scene.add( this.ball );
		// scene.add( this.ball2 );

		const scaleArrow = 0.25;

		//	load model : 
		let loader = new GLTFLoader();
		loader.load(
		    './assets/gltf/arrows.gltf',
		    ( gltf ) => {
		        // called when the resource is loaded

		        this._arrows = gltf.scene;
		        this._arrows.scale.set(scaleArrow, scaleArrow, scaleArrow);
		        const meshes = this._arrows.children;
		        const material = new THREE.MeshStandardMaterial({
		        	roughness:1.0,
		        	metalness:0.5,
		        	color:0xFF6600
		        });

		        console.log('this._arrows', this._arrows.scale);

		        meshes.forEach( mesh => {
		        	mesh.material = material;
		        });
		        scene.add( this._arrows );
		    },
		    ( xhr ) => {
		        // called while loading is progressing
		        console.log( `${( xhr.loaded / xhr.total * 100 )}% loaded` );
		    },
		    ( error ) => {
		        // called when loading has errors
		        console.error( 'An error happened', error );
		    },
		);

		loader = new GLTFLoader();
			loader.load(
			    './assets/gltf/arrows.gltf',
			    ( gltf ) => {
			        // called when the resource is loaded

			        this._arrows1 = gltf.scene;
			        this._arrows1.scale.set(scaleArrow, scaleArrow, scaleArrow);
			        const meshes = this._arrows1.children;
			        const material = new THREE.MeshStandardMaterial({
			        	roughness:1.0,
			        	metalness:0.5,
			        	color:0x00FF66
			        });

			        meshes.forEach( mesh => {
			        	mesh.material = material;
			        });
			        scene.add( this._arrows1 );
			    },
			    ( xhr ) => {
			        // called while loading is progressing
			        console.log( `${( xhr.loaded / xhr.total * 100 )}% loaded` );
			    },
			    ( error ) => {
			        // called when loading has errors
			        console.error( 'An error happened', error );
			    },
			);
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

	}


	get headingDiff() {
		return this._headingDiff.value;
	}

	set headingDiff(mValue) {
		this._headingDiff.value = mValue;
	}

}

export default SceneAR;