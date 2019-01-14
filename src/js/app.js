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


		  		const fromLatLngToPixel = (position) => {
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

		  		point = fromLatLngToPixel(marker.position);
		  		console.log('Point', point);
		  	} );
		}
	}


	setInterval(updateLocation, 2000);
	const tmp = {
		callibre:() => {
			headingOffset = heading;
		}
	}


	setTimeout(()=> {
		gui.add(oDebug, 'latitude').listen();
		gui.add(oDebug, 'longitude').listen();
		gui.add(oDebug, 'dist1').listen();
		gui.add(oDebug, 'dist2').listen();
		gui.add(oDebug, 'heading').listen();
		gui.add(tmp, 'callibre');
	}, 200);


	alfrid.Scheduler.addEF(update);

	window.addEventListener('deviceorientation', function(event) {


	   //  const compassHousing = document.body.querySelector('.bar');
	   //  console.log('event.webkitCompassHeading', event.webkitCompassHeading);

	   // // let accuracy = event.webkitCompassAccuracy;
	   //  var heading = (270 - event.alpha) * -1;
	   //  // heading -= window.orientation;
	   //  if(heading < 0) {
	   //  	heading += 360;
	   //  }
	   //  console.log('heading', heading);
	   //  console.log('event.webkitCompassAccuracy', event.webkitCompassAccuracy);
	   //  // transform
	   //  // compassHousing.style.webkitTransition = 'all 0.03s ease-in-out';
	   //  // rotate the compass
	   //  compassHousing.style.webkitTransform = 'rotateZ(' + heading + 'deg)';
	    // previousHeading = heading;

	    oDebug.heading = `${heading}`;
	    heading = -event.alpha * Math.PI / 180 + Math.PI/2 - headingOffset;


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
}