// distanceLatLng.js


const toRadians = v => v * Math.PI / 180;

const distanceLatLng = (pa, pb) => {
	let R = 6371e3; // metres
	let φ1 = toRadians(pa.lat);
	let φ2 = toRadians(pb.lat);
	let Δφ = toRadians(pb.lat - pa.lat);
	let Δλ = toRadians(pb.lng - pa.lng);

	let a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	        Math.cos(φ1) * Math.cos(φ2) *
	        Math.sin(Δλ/2) * Math.sin(Δλ/2);
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	let d = R * c;

	return d;
}

export { distanceLatLng };