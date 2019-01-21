// placeObjectInfront.js 
let front;

const placeObjectInfront = (mMesh, mCamera, mHeading, mDist, mFacingCamera=false) => {
	const q = new THREE.Quaternion();
	q.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), mHeading );

	front = new THREE.Vector3(0, 0, -1);

	front.applyAxisAngle(new THREE.Vector3(0, -1, 0), mHeading);
	// front.add(camera÷.position);

	// front.applyQuaternion(q);
	front.setLength(mDist);
	front.add(mCamera.position);
	front.y -= 0.5;

	mMesh.position.copy(front);
	if(mFacingCamera) {
		mMesh.rotation.y = -mHeading;	
	}	
	
}

export { placeObjectInfront };