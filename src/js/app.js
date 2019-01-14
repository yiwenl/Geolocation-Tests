import '../scss/global.scss';
import debugPolyfill from './debug/debugPolyfill';
import alfrid, { GL } from 'alfrid';
import AssetsLoader from 'assets-loader';
import Settings from './Settings';
import assets from './asset-list';
import Assets from './Assets';

import Capture from './utils/Capture';
import addControls from './debug/addControls';

if(document.body) {
	_init();
} else {
	window.addEventListener('DOMContentLoaded', _init);
}

const zoom = 16;
const TILE_SIZE = 256;
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
	heading:'null'
}

const toRadians = (v) => {
	return v * Math.PI / 180;
}

const compassHeading = (alpha, beta, gamma) => {

  // Convert degrees to radians
  var alphaRad = alpha * (Math.PI / 180);
  var betaRad = beta * (Math.PI / 180);
  var gammaRad = gamma * (Math.PI / 180);

  // Calculate equation components
  var cA = Math.cos(alphaRad);
  var sA = Math.sin(alphaRad);
  var cB = Math.cos(betaRad);
  var sB = Math.sin(betaRad);
  var cG = Math.cos(gammaRad);
  var sG = Math.sin(gammaRad);

  // Calculate A, B, C rotation components
  var rA = - cA * sG - sA * sB * cG;
  var rB = - sA * sG + cA * sB * cG;
  var rC = - cB * cG;

  // Calculate compass heading
  var compassHeading = Math.atan(rA / rB);

  // Convert from half unit circle to whole unit circle
  if(rB < 0) {
    compassHeading += Math.PI;
  }else if(rA < 0) {
    compassHeading += 2 * Math.PI;
  }

  // Convert radians to degrees
  compassHeading *= 180 / Math.PI;

  return compassHeading;

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


const project = (latLng) => {
	var siny = Math.sin(latLng.lat() * Math.PI / 180);

	// Truncating to 0.9999 effectively limits latitude to 89.189. This is
	// about a third of a tile past the edge of the world tile.
	siny = Math.min(Math.max(siny, -0.9999), 0.9999);

	return new google.maps.Point(
	    TILE_SIZE * (0.5 + latLng.lng() / 360),
	    TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)));
}

let canvas, ctx, projection;
let point = {
	x:0, y:0
}

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
		title: 'Target 1'
	});


	console.log('markerTarget1', markerTarget1);


	const updateLocation = () => {

		if (navigator.geolocation) {
		  	navigator.geolocation.getCurrentPosition( (o)=> {

		  		console.log('geolocation:', o);
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


		  		oDebug.dist1 = `${distance(myLatlng, target1)}`;
		  		oDebug.dist2 = `${distance(myLatlng, target2)}`;


		  		var scale = 1 << zoom;
		  		console.log('scale :', scale, zoom);

		  		var worldCoordinate = project(marker.position);
		  		var pixelCoordinate = new google.maps.Point(
		  		            Math.floor(worldCoordinate.x * scale),
		  		            Math.floor(worldCoordinate.y * scale));

		  		console.log(worldCoordinate, pixelCoordinate);

		  		ctx.clearRect(0, 0, canvas.width, canvas.height);
		  		ctx.fillStyle = 'red';
		  		ctx.fillRect(worldCoordinate.x, worldCoordinate.y, 10, 10);

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
	}, 200);


	alfrid.Scheduler.addEF(update);

	window.addEventListener('deviceorientation', function(event) {

		var compassdir;

		if(event.webkitCompassHeading) {
	      // Apple works only with this, alpha doesn't work
			compassdir = event.webkitCompassHeading;  
	    } else {
	    	compassdir = event.alpha;
	    }

	    oDebug.heading = `${compassdir}`;




	    const compassHousing = document.body.querySelector('.bar');
	    console.log('event.webkitCompassHeading', event.webkitCompassHeading);

	   // let accuracy = event.webkitCompassAccuracy;
	    var heading = (270 - event.alpha) * -1;
	    // heading -= window.orientation;
	    if(heading < 0) {
	    	heading += 360;
	    }
	    console.log('heading', heading);
	    console.log('event.webkitCompassAccuracy', event.webkitCompassAccuracy);
	    // transform
	    // compassHousing.style.webkitTransition = 'all 0.03s ease-in-out';
	    // rotate the compass
	    compassHousing.style.webkitTransform = 'rotateZ(' + heading + 'deg)';
	    // previousHeading = heading;


	}, false);
}


function update() {
	// console.log('Update');

	

	// ctx.fillStyle = Math.floor(Math.random() * 0xFFFFFF);
	// ctx.fillRect(Math.random() * 100, Math.random() * 100, 100, 100);
	
}


function _init() {
}