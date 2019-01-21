// loadModel.js
import GLTFLoader from 'three-gltf-loader';

const caches = {};

const loadModel = (mPath) => {
	return new Promise((resolve, reject) => {

		if(caches[mPath]) {
			resolve( caches[mPath].clone() );
			return;
		}


		let loader = new GLTFLoader();
		loader.load(mPath,
			(gltf) => {
				caches[mPath] = gltf.scene;
				resolve( caches[mPath].clone() );
			},
		    ( xhr ) => {
		        // called while loading is progressing
		        console.log( `${( xhr.loaded / xhr.total * 100 )}% loaded` );
		    },
		    ( error ) => {
		        // called when loading has errors
		        console.error( 'An error happened', error );
		        reject(error);
		    }
		);

	});
}


export { loadModel }