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

window.initMap = () => {
	console.log('init Map');

	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 51.528111499999994, lng: -0.0859945},
		zoom: 16
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
		  	} );
		}
	}


	setInterval(updateLocation, 2000);


	setTimeout(()=> {
		gui.add(oDebug, 'latitude').listen();
		gui.add(oDebug, 'longitude').listen();
		gui.add(oDebug, 'dist1').listen();
		gui.add(oDebug, 'dist2').listen();
	}, 200);
}

function _init() {
}