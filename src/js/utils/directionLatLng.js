// directionLatLng.js

const directionLatLng = (a, b) => {
	let dx = b.lng - a.lng;
	let dy = b.lat - a.lat;

	let theta = Math.atan2(dy, -dx);

	return theta;
}

export { directionLatLng };