// fromLatLngToPixel.js

const fromLatLngToPixel = (map, position) => {
	var scale = Math.pow(2, map.getZoom());
	var proj = map.getProjection();
	var bounds = map.getBounds();

	var nw = proj.fromLatLngToPoint(
		new google.maps.LatLng(
			bounds.getNorthEast().lat(),
			bounds.getSouthWest().lng()
		));
	var point = proj.fromLatLngToPoint(position);

	return new google.maps.Point(
		Math.floor((point.x - nw.x) * scale),
		Math.floor((point.y - nw.y) * scale));

	// return point;
};


export { fromLatLngToPixel };