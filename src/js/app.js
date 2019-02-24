import '../scss/global.scss';
import debugPolyfill from './debug/debugPolyfill';
import alfrid, { GL } from 'alfrid';

import SceneAR from './SceneAR';
import Config from './Config';
import * as THREE from 'three';

window.THREE = THREE


import { fromLatLngToPixel, distanceLatLng, directionLatLng, directionMapPoint } from './utils';

if(document.body) {
	_init();
} else {
	window.addEventListener('DOMContentLoaded', _init);
}


let sceneAR, debugCanvas;

function _init() {
	const onxrloaded = () => {
		sceneAR = new SceneAR();
	}

	if (window.XR) {
		onxrloaded()
	} else {
		window.addEventListener('xrloaded', onxrloaded)
	}
	

}

