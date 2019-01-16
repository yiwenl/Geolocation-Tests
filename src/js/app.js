import '../scss/global.scss';
import debugPolyfill from './debug/debugPolyfill';
import alfrid, { GL } from 'alfrid';

import GoogleMapsLoader from 'google-maps';
import PathTracker from './utils/PathTracker';
import HeadingCalibre from './utils/HeadingCalibre';
import HeadingCalibrate from './utils/HeadingCalibrate';

const GOOGLE_MAP_API_KEY = 'AIzaSyBqCqukoHGzJjI7Sqo41Nw9XT0AhnGoVDw';


import { fromLatLngToPixel, distanceLatLng, directionLatLng, directionMapPoint } from './utils';

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
	heading:'0',
	headingLocal:'0',
	alpha:'0',
	headingOffset:'0',
	headingOffsetNew:'0',

}



let canvas, ctx, projection, pathTracker;
let point = {
	x:0, y:0
}
let target = {
	x:0, y:0
}
let heading = 0;
let headingLocal = 1.;
let headingOffset = 0;
let headingTarget = 0;
let hasLoggedInit = false;
let hasCalibrated = false;

let locPrev = {lat: 51.528111499999994, lng: -0.0859945};
let locCurr = {lat: 51.528111499999994, lng: -0.0859945};

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


	// markerTarget2 = new google.maps.Marker({
	// 	position: target2,
	// 	map: map,
	// 	title: 'Target 2'
	// });


	const updateLocation = () => {

		if (navigator.geolocation) {
		  	navigator.geolocation.getCurrentPosition( (o)=> {

		  		oDebug.latitude = o.coords.latitude.toString();
		  		oDebug.longitude = o.coords.longitude.toString();

		  		if(marker) { marker.setMap(null);	}

		  		const myLatlng = {
		  			lat: o.coords.latitude, 
		  			lng: o.coords.longitude + _fake
		  		};
		  		locPrev.lat = locCurr.lat;
		  		locPrev.lng = locCurr.lng;
		  		locCurr.lat = myLatlng.lat;
		  		locCurr.lng = myLatlng.lng;

		  		let dist = distanceLatLng(locPrev, locCurr)

		  		HeadingCalibre.update(headingLocal);

		  		pathTracker.add(new google.maps.LatLng(myLatlng.lat, myLatlng.lng));

		  		marker = new google.maps.Marker({
		  			position: myLatlng,
		  			map: map,
		  			title: 'Me'
		  		});

		  		// oDebug.dist = `${dist}`;
		  		oDebug.dist1 = `${distanceLatLng(myLatlng, target1)}`;
		  		// oDebug.dist2 = `${distanceLatLng(myLatlng, target2)}`;

		  		target = fromLatLngToPixel(map, markerTarget1.position);
		  		point = fromLatLngToPixel(map, marker.position);


		  		//	get heading to target
		  		headingTarget = directionMapPoint(point, target) + Math.PI/2;

		  	} );
		}

		if(!GL.isMobile) {
			// _fake += 0.00005;
			const t = new Date().getTime() * 0.05;
			_fake = Math.sin(t) * 0.0015;
		}
	}


	setInterval(updateLocation, 1000);



	setTimeout(()=> {
		// gui.add(oDebug, 'latitude').listen();
		// gui.add(oDebug, 'longitude').listen();
		gui.add(oDebug, 'dist1').name('Distance to Target').listen();
		gui.add(oDebug, 'headingOffset').listen();
		gui.add(oDebug, 'headingOffsetNew').listen();
		// gui.add(oDebug, 'dist2').listen();
		gui.add(HeadingCalibrate, 'stateString').listen();
		gui.add(pathTracker, 'clear').name('Clear tracks');
	}, 200);


	alfrid.Scheduler.addEF(update);

	window.addEventListener('deviceorientationabsolute', function(event) {
		console.log('on deviceorientation absolute');
		if(!hasLoggedInit) {
			console.log(event.absolute, event.alpha);
			hasLoggedInit = true;
		}

	    oDebug.heading = `${heading}`;
	    oDebug.alpha = `${event.alpha}`;
	    heading = -event.alpha * Math.PI / 180;
	    if(!GL.isMobile) {
	    	heading = -0.5;
	    }
	}, false);

	window.addEventListener('deviceorientation', function(event) {
		console.log('on deviceorientation');
	    headingLocal = -event.alpha * Math.PI / 180;
	    if(!GL.isMobile) {
	    	headingLocal = 0.5;
	    }

	}, false);


	const btnCalibre = document.body.querySelector('.btn-calibrate');
	btnCalibre.addEventListener('click', (e)=> {

		if(!hasCalibrated) {
			btnCalibre.innerHTML = 'END';
			hasCalibrated = true;

			// markerStart = new google.maps.Marker({
			// 	position: locCurr,
			// 	map: map,
			// 	title: 'Target 1'
			// });
			HeadingCalibre.start({
				lat:locCurr.lat,
				lng:locCurr.lng,
			});


			HeadingCalibrate.once('onStart', loc => {
				markerStart = new google.maps.Marker({
					position: loc,
					map: map,
					title: 'Target 1'
				});
			});


			HeadingCalibrate.on('onProgress', percent => {
				console.log('Calibrating progress :', percent);
			})

			HeadingCalibrate.start()
			.then((offset)=> {
				console.log('Heading Offset:', offset, HeadingCalibrate.offset);
				oDebug.headingOffsetNew = `${offset}`;

				markerStart.setMap(null);
				HeadingCalibre.stop({
					lat:locCurr.lat,
					lng:locCurr.lng,
				});
				oDebug.headingOffset = `${HeadingCalibre.offset}`;
				document.body.classList.add('hasCalibrated');
			}, (e)=> {
				console.log('Error', e);
			});
		} else {
			markerStart.setMap(null);
			HeadingCalibre.stop({
				lat:locCurr.lat,
				lng:locCurr.lng,
			});
			oDebug.headingOffset = `${HeadingCalibre.offset}`;
			document.body.classList.add('hasCalibrated');
		}
	});
}


function update() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);	

	ctx.save();

	let w = 8;
	const h = 50;
	ctx.translate(point.x, point.y);

	ctx.save();
	// console.log('angle :', heading, HeadingCalibre.offset);
	ctx.rotate(headingLocal + HeadingCalibre.offset);
	ctx.fillStyle = 'rgba(255, 200, 0, 1)';
	ctx.fillRect(-w/2, -h, w, h);
	ctx.restore();

	w = 4;
	ctx.save();
	ctx.rotate(headingLocal + HeadingCalibrate.offset);
	// ctx.rotate(headingTarget);
	ctx.fillStyle = 'rgba(0, 128, 200, 1)';
	ctx.fillRect(-w/2, -h, w, h);
	ctx.restore();

	w = 2;
	ctx.save();
	ctx.rotate(headingLocal);
	ctx.fillStyle = 'rgba(20, 80, 28, 1)';
	ctx.fillRect(-w/2, -h, w, h);
	ctx.restore();

	ctx.restore();

	// pathTracker.update(heading);
	pathTracker.update(headingLocal);

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

