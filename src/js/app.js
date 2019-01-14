import '../scss/global.scss';
import debugPolyfill from './debug/debugPolyfill';
import alfrid, { GL } from 'alfrid';

import GoogleMapsLoader from 'google-maps';

const GOOGLE_MAP_API_KEY = 'AIzaSyBqCqukoHGzJjI7Sqo41Nw9XT0AhnGoVDw';


import { fromLatLngToPixel, distanceLatLng } from './utils';

if(document.body) {
	_init();
} else {
	window.addEventListener('DOMContentLoaded', _init);
}

const zoom = 16;
let map, marker, markerTarget1, markerTarget2;
 
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



let canvas, ctx, projection;
let point = {
	x:0, y:0
}
let heading = 0;
let headingOffset = 0;
let hasLoggedInit = false;

function _initMap() {
	console.log('init Map');


	canvas = document.createElement("canvas");
	canvas.className = 'canvas-overlay';
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	document.body.appendChild(canvas);
	ctx = canvas.getContext('2d');

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
		  			lat: o.coords.latitude, 
		  			lng: o.coords.longitude
		  		};

		  		marker = new google.maps.Marker({
		  			position: myLatlng,
		  			map: map,
		  			title: 'Me'
		  		});

		  		oDebug.dist1 = `${distanceLatLng(myLatlng, target1)}`;
		  		oDebug.dist2 = `${distanceLatLng(myLatlng, target2)}`;

		  		point = fromLatLngToPixel(map, marker.position);
		  		// console.log('Point', point);
		  	} );
		}
	}


	setInterval(updateLocation, 2000);


	setTimeout(()=> {
		gui.add(oDebug, 'latitude').listen();
		gui.add(oDebug, 'longitude').listen();
		gui.add(oDebug, 'dist1').listen();
		gui.add(oDebug, 'dist2').listen();
		gui.add(oDebug, 'heading').listen();
		gui.add(oDebug, 'alpha').listen();
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

	GoogleMapsLoader.load((google) => {
	    map = new google.maps.Map(el, {
	    	center: {lat: 51.528111499999994, lng: -0.0859945},
	    	zoom
	    });

	    _initMap();
	});

}

