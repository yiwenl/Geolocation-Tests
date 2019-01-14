import '../scss/global.scss';
import debugPolyfill from './debug/debugPolyfill';
import alfrid, { GL } from 'alfrid';

import GoogleMapsLoader from 'google-maps';
import PathTracker from './utils/PathTracker';
import HeadingCalibre from './utils/HeadingCalibre';

const GOOGLE_MAP_API_KEY = 'AIzaSyBqCqukoHGzJjI7Sqo41Nw9XT0AhnGoVDw';


import { fromLatLngToPixel, distanceLatLng, directionLatLng } from './utils';

if(document.body) {
	_init();
} else {
	window.addEventListener('DOMContentLoaded', _init);
}

const zoom = 16;
let map, marker, markerTarget1, markerTarget2, markerStart;
 
let target1 = {
	lat:51.52864213850285,
	lng:-0.08503963359066802
}

let target2 = {
	lat:51.52790792006495,
	lng:-0.08365561373898345
}

const oDebug = {
	latitude:'0',
	longitude:'0',
	dist1:'0',
	dist2:'0',
	dist:'0',
	heading:'null',
	alpha:'0',
	headingOffset:'0'
}



let canvas, ctx, projection, pathTracker;
let point = {
	x:0, y:0
}
let heading = 0;
let headingOffset = 0;
let headingGeo = 0;
let hasLoggedInit = false;

let locPrev = {lat: 51.528111499999994, lng: -0.0859945};
let locCurr = {lat: 51.528111499999994, lng: -0.0859945};

let pointCurr = {x:0, y:0};
let pointPrev = {x:0, y:0};
let _fake = 0;

function _initMap() {
	canvas = document.createElement("canvas");
	canvas.className = 'canvas-overlay';
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	document.body.appendChild(canvas);
	ctx = canvas.getContext('2d');

	pathTracker = new PathTracker(canvas, map);

	markerTarget1 = new google.maps.Marker({
		position: target1,
		map: map,
		title: 'Target 1'
	});


	markerTarget2 = new google.maps.Marker({
		position: target2,
		map: map,
		title: 'Target 2'
	});


	const updateLocation = () => {

		if (navigator.geolocation) {
		  	navigator.geolocation.getCurrentPosition( (o)=> {

		  		oDebug.latitude = o.coords.latitude.toString();
		  		oDebug.longitude = o.coords.longitude.toString();

		  		if(marker) { marker.setMap(null);	}

		  		const myLatlng = {
		  			lat: o.coords.latitude + _fake, 
		  			lng: o.coords.longitude
		  		};
		  		locPrev.lat = locCurr.lat;
		  		locPrev.lng = locCurr.lng;
		  		locCurr.lat = myLatlng.lat;
		  		locCurr.lng = myLatlng.lng;

		  		let dist = distanceLatLng(locPrev, locCurr)

		  		if(dist > 5) {
		  			headingGeo = directionLatLng(locCurr, locPrev) + Math.PI/2;	
		  			HeadingCalibre.update(headingGeo);
		  		}

		  		pathTracker.add(new google.maps.LatLng(myLatlng.lat, myLatlng.lng));

		  		marker = new google.maps.Marker({
		  			position: myLatlng,
		  			map: map,
		  			title: 'Me'
		  		});

		  		oDebug.dist = `${dist}`;
		  		oDebug.dist1 = `${distanceLatLng(myLatlng, target1)}`;
		  		oDebug.dist2 = `${distanceLatLng(myLatlng, target2)}`;

		  		point = fromLatLngToPixel(map, marker.position);

		  		pointPrev.x = pointCurr.x;
		  		pointPrev.y = pointCurr.y;

		  		pointCurr.x = point.x;
		  		pointCurr.y = point.y;
		  	} );
		}

		if(!GL.isMobile) {
			_fake += 0.00005;
		}
	}


	setInterval(updateLocation, 1000);

	const tmp = {
		start:() => {
			markerStart = new google.maps.Marker({
				position: locCurr,
				map: map,
				title: 'Target 1'
			});
			HeadingCalibre.start({
				lat:locCurr.lat,
				lng:locCurr.lng,
			});
		},
		stop:() => {
			// markerStart.setMap(null);
			HeadingCalibre.stop({
				lat:locCurr.lat,
				lng:locCurr.lng,
			});
		}
	}


	setTimeout(()=> {
		// gui.add(oDebug, 'latitude').listen();
		// gui.add(oDebug, 'longitude').listen();
		// gui.add(oDebug, 'dist1').listen();
		// gui.add(oDebug, 'dist2').listen();
		gui.add(oDebug, 'heading').listen();
		gui.add(oDebug, 'alpha').listen();
		gui.add(oDebug, 'headingOffset').listen();
		gui.add(oDebug, 'dist').listen();
		gui.add(tmp, 'start');
		gui.add(tmp, 'stop');
		gui.add(pathTracker, 'clear');
	}, 200);


	alfrid.Scheduler.addEF(update);

	window.addEventListener('deviceorientationabsolute', function(event) {

		if(!hasLoggedInit) {
			console.log(event.absolute, event.alpha);
			hasLoggedInit = true;
		}

	    oDebug.heading = `${heading}`;
	    oDebug.alpha = `${event.alpha}`;
	    heading = -event.alpha * Math.PI / 180 - headingOffset + Math.PI/2;


	}, false);
}


function update() {
	// console.log('HeadingCalibre.offset', HeadingCalibre.offset);
	ctx.clearRect(0, 0, canvas.width, canvas.height);	

	ctx.save();

	let w = 8;
	const h = 50;
	ctx.translate(point.x, point.y);

	ctx.save();
	console.log('angle :', heading, HeadingCalibre.offset);
	ctx.rotate(heading + HeadingCalibre.offset);
	ctx.fillStyle = 'rgba(255, 200, 0, 1)';
	ctx.fillRect(-w/2, -h, w, h);
	ctx.restore();

	w = 3;
	ctx.save();
	ctx.rotate(headingGeo);
	ctx.fillStyle = 'rgba(0, 180, 128, 1)';
	ctx.fillRect(-w/2, -h, w, h);
	ctx.restore();

	ctx.restore();

	pathTracker.update();

	oDebug.headingOffset = `${HeadingCalibre.offset}`;
}


function _init() {
	GoogleMapsLoader.KEY = GOOGLE_MAP_API_KEY;
	const el = document.getElementById('map');

	GoogleMapsLoader.load((_google) => {
	    map = new google.maps.Map(el, {
	    	center: {lat: 51.528111499999994, lng: -0.0859945},
	    	zoom
	    });

	    _initMap();
	});

}

