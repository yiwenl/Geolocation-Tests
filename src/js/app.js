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


let map, marker;

const oDebug = {
	latitude:'0',
	longitude:'0'
}

window.initMap = () => {
	console.log('init Map');

	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 51.528111499999994, lng: -0.0859945},
		zoom: 16
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

		  	} );
		}
	}


	setInterval(updateLocation, 2000);


	setTimeout(()=> {
		gui.add(oDebug, 'latitude').listen();
		gui.add(oDebug, 'longitude').listen();
	}, 200);
}

function _init() {
}