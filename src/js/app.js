import '../scss/global.scss';
import debugPolyfill from './debug/debugPolyfill';
import alfrid, { GL } from 'alfrid';

import GoogleMapsLoader from 'google-maps';

const GOOGLE_MAP_API_KEY = 'AIzaSyBqCqukoHGzJjI7Sqo41Nw9XT0AhnGoVDw';


import { fromLatLngToPixel } from './utils';

if(document.body) {
	_init();
} else {
	window.addEventListener('DOMContentLoaded', _init);
}

const zoom = 16;
const TILE_SIZE = 256;
let map, marker, markerTarget1, markerTarget2, markerNorth;
 
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
	heading:'null',
	alpha:'0'
}

const toRadians = (v) => {
	return v * Math.PI / 180;
}


const distance = (pa, pb) => {
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


let canvas, ctx, projection;
let point = {
	x:0, y:0
}
let heading = 0;
let headingOffset = 0;
let hasCalibred = false;
let hasLoggedInit = false;

window.initMap = () => {
	console.log('init Map');


	canvas = document.createElement("canvas");
	canvas.className = 'canvas-overlay';
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	document.body.appendChild(canvas);
	ctx = canvas.getContext('2d');

	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 51.528111499999994, lng: -0.0859945},
		zoom
	});


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

		  		// console.log('geolocation:', o);
		  		// oDebug.heading = `${o.heading}`;

		  		oDebug.latitude = o.coords.latitude.toString();
		  		oDebug.longitude = o.coords.longitude.toString();

		  		if(marker) { marker.setMap(null);	}

		  		const myLatlng = {
		  			lat: o.coords.latitude, 
		  			lng: o.coords.longitude
		  		};

		  		marker = new google.maps.Marker({
		  			position: myLatlng,
		  			map: map,
		  			title: 'Me'
		  		});

		  		if(!hasCalibred ) {

		  			const latlngNorth = {
		  				lat: o.coords.latitude + 0.0005, 
		  				lng: o.coords.longitude
		  			};

		  			markerNorth = new google.maps.Marker({
		  				position: latlngNorth,
		  				map: map,
		  				title: 'Me'
		  			});

		  			hasCalibred = true;
		  		}


		  		oDebug.dist1 = `${distance(myLatlng, target1)}`;
		  		oDebug.dist2 = `${distance(myLatlng, target2)}`;

		  		point = fromLatLngToPixel(map, marker.position);
		  		// console.log('Point', point);
		  	} );
		}
	}


	setInterval(updateLocation, 2000);
	const tmp = {
		callibre:() => {
			headingOffset = heading;
			markerNorth.setMap(null);
		}
	}


	setTimeout(()=> {
		gui.add(oDebug, 'latitude').listen();
		gui.add(oDebug, 'longitude').listen();
		gui.add(oDebug, 'dist1').listen();
		gui.add(oDebug, 'dist2').listen();
		gui.add(oDebug, 'heading').listen();
		gui.add(oDebug, 'alpha').listen();
		gui.add(tmp, 'callibre');
	}, 200);


	alfrid.Scheduler.addEF(update);

	window.addEventListener('deviceorientationabsolute', function(event) {

		// console.log('on Orientation:', event);

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
	ctx.clearRect(0, 0, canvas.width, canvas.height);	

	ctx.save();

	const w = 5;
	const h = 50;
	ctx.translate(point.x, point.y);
	ctx.rotate(heading);
	ctx.fillStyle = 'rgba(255, 128, 0, 1)';
	ctx.fillRect(-w/2, -h, w, h);

	ctx.restore();
}


function _init() {
	GoogleMapsLoader.KEY = GOOGLE_MAP_API_KEY;
	const el = document.getElementById('map');

	GoogleMapsLoader.load(function(google) {
	    new google.maps.Map(el, {
	    	center: {lat: 51.528111499999994, lng: -0.0859945},
	    	zoom
	    });
	});

}