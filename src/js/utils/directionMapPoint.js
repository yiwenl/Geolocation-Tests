// directionMapPoint.js

const directionMapPoint = (a, b) => {
	let dx = b.x - a.x;
	let dy = b.y - a.y;

	let theta = Math.atan2(dy, dx);

	return theta;
}

export { directionMapPoint };