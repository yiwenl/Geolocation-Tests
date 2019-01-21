import '../scss/global.scss';
import debugPolyfill from './debug/debugPolyfill';
import alfrid, { GL } from 'alfrid';

import GoogleMapsLoader from 'google-maps';
import PathTracker from './utils/PathTracker';
import HeadingCalibrate from './utils/HeadingCalibrate';
import DebugInfo from './debug/DebugInfo';
import DebugCanvas from './debug/DebugCanvas';
import SceneAR from './SceneAR';
import Config from './Config';
import * as THREE from 'three';

const GOOGLE_MAP_API_KEY = 'AIzaSyBqCqukoHGzJjI7Sqo41Nw9XT0AhnGoVDw';
window.THREE =  THREE;


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
	heading:'0',
	headingLocal:'0',
	alpha:'0',
	headingOffset:'0',
}



let sceneAR, debugCanvas;
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
let hasCalibrated = false;

let locPrev = {lat: 51.528111499999994, lng: -0.0859945};
let locCurr = {lat: 51.528111499999994, lng: -0.0859945};

let _fake = 0;

function _initMap() {

	const onxrloaded = () => {
		console.log('XR:', window.XR);
		sceneAR = new SceneAR();
	}

	if (window.XR) {
		onxrloaded()
	} else {
		window.addEventListener('xrloaded', onxrloaded)
	}


	debugCanvas = new DebugCanvas();
	DebugInfo.headingLocal = headingLocal;

	markerTarget1 = new google.maps.Marker({
		position: target1,
		map: map,
		title: 'Target 1'
	});

	let time = new Date().getTime();

	const updateLocation = () => {

		if (navigator.geolocation) {
			
			navigator.geolocation.getCurrentPosition( (o)=> {

				oDebug.latitude = o.coords.latitude.toString();
				oDebug.longitude = o.coords.longitude.toString();


				const myLatlng = {
					lat: o.coords.latitude, 
					lng: o.coords.longitude + _fake
				};
				locPrev.lat = locCurr.lat;
				locPrev.lng = locCurr.lng;
				locCurr.lat = myLatlng.lat;
				locCurr.lng = myLatlng.lng;

				if(!marker) {
					marker = new google.maps.Marker({
						position: myLatlng,
						map: map,
						title: 'Me'
					});	
				} else {
					const loc = new google.maps.LatLng(myLatlng);
					marker.setPosition(loc);
				}

				const distToTarget = distanceLatLng(myLatlng, target1);
				DebugInfo.distanceToTarget = `${distToTarget}`;

				if(distToTarget < 10) {
					DebugInfo._state = 'Adding Object';
					sceneAR.placeObject();
				}

				target = fromLatLngToPixel(map, markerTarget1.position);
				point = fromLatLngToPixel(map, marker.position);
				DebugInfo.point = point;


				//	get heading to target
				const headingTarget = directionMapPoint(point, target) + Math.PI/2;
				DebugInfo.headingTarget = headingTarget;
				let headingDiff = headingTarget - (headingLocal + HeadingCalibrate.offset);
				if(sceneAR) {
					sceneAR.headingDiff = headingDiff;	
				}

				alfrid.Scheduler.next(updateLocation);

				if(!GL.isMobile) {
					// _fake += 0.00005;
					const t = new Date().getTime() * 0.001;
					_fake = Math.sin(t) * 0.0015;
				}

			} );

		}

	}

	updateLocation();

	const options = {enableHighAccuracy: true,timeout: 500, maximumAge: 0,desiredAccuracy: 0 };

	const oControls = {
		toggleMinified:() => {
			const mapDiv = document.body.querySelector('#map');
			if(document.body.classList.contains('minified')) {
				document.body.classList.remove('minified');
				mapDiv.style.marginTop = '0px';
				debugCanvas.canvas.height = window.innerHeight;
				debugCanvas.canvas.style.marginTop = '0px';
			} else {
				document.body.classList.add('minified');
				const top = Math.floor(window.innerHeight * (1.0 - Config.minifiedHeight));
				mapDiv.style.marginTop = `${top}px`;
				debugCanvas.canvas.height = Math.floor(window.innerHeight * Config.minifiedHeight);
				debugCanvas.canvas.style.marginTop = `${top}px`;
			}

			google.maps.event.trigger(map, 'resize')
		}
	}


	setTimeout(()=> {
		// gui.add(oDebug, 'latitude').listen();
		// gui.add(oDebug, 'longitude').listen();
		// gui.add(oDebug, 'headingOffset').listen();
		gui.add(DebugInfo, 'distanceToTarget').name('Distance to Target').listen();
		gui.add(DebugInfo, 'state').listen();
		// gui.add(oDebug, 'dist2').listen();
		gui.add(HeadingCalibrate, 'stateString').listen();
		gui.add(oControls, 'toggleMinified');
	}, 200);


	window.addEventListener('deviceorientation', function(event) {
		headingLocal = -event.alpha * Math.PI / 180;
		if(!GL.isMobile) {
			headingLocal = 0.5;
		}

		DebugInfo.headingLocal = headingLocal;

	}, false);


	const btnCalibre = document.body.querySelector('.btn-calibrate');
	btnCalibre.addEventListener('click', (e)=> {

		if(!hasCalibrated) {
			btnCalibre.innerHTML = 'CALIBRATING...';
			hasCalibrated = true;

			oControls.toggleMinified();

			HeadingCalibrate.once('onStart', loc => {
				markerStart = new google.maps.Marker({
					position: loc,
					map: map,
					title: 'Target 1'
				});

				DebugInfo.state = 'Calibrating';
			});


			HeadingCalibrate.on('onProgress', percent => {
				console.log('Calibrating progress :', percent);
			});

			HeadingCalibrate.start()
			.then((offset)=> {
				console.log('Heading Offset:', offset, HeadingCalibrate.offset);
				oDebug.headingOffset = `${HeadingCalibrate.offset}`;
				document.body.classList.add('hasCalibrated');
				DebugInfo.headingOffset = HeadingCalibrate.offset;

				DebugInfo.state = 'Calibrating End';
			}, (e)=> {
				console.log('Error', e);
			});
		} 

	});


	console.log('localhost ? ', window.location.href.indexOf('localhost') > -1);
	// if(window.location.href.indexOf('localhost') > -1) {
	// 	document.body.classList.add('hasCalibrated');
	// 	oControls.toggleMinified();
	// }
}

function loop() {

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

