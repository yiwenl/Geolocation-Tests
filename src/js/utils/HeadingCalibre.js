// HeadingCalibre.js
import { fromLatLngToPixel, distanceLatLng, directionLatLng } from './';

class HeadingCalibre {

	constructor() {
		window.addEventListener('deviceorientationabsolute', (e)=> this._onOrientation(e));

		this._heading = 0;
		this._offset = 0;
		this._isCalibrating = false;
		this._locStart;
		this._locEnd;
	}


	_onOrientation(e) {
		this._heading = -event.alpha;
	}

	start(loc) {
		this._headings = [];
		this._locStart = loc;
		this._isCalibrating = true;
	}

	update(headingGeo) {
		if(!this._isCalibrating) {
			return;
		}
		this._headings.push(this._heading);
	}

	stop(loc) {
		this._isCalibrating = false;
		this._locEnd = loc;
		let sumHeading = 0;

		for(let i=0; i<this._headings.length; i++) {
			sumHeading += this._headings[i];
		}

		sumHeading /= this._headings.length;

		console.log(this._locStart, this._locEnd);

		console.log('sumHeading', sumHeading);

		let headingGeo = directionLatLng(this._locEnd, this._locStart) + Math.PI/2;	
		if(headingGeo > Math.PI * 2) {
			headingGeo -= Math.PI * 2;
		}
		console.log('headingGeo', headingGeo * 180 / Math.PI);
		this._offset = (headingGeo - sumHeading) - Math.PI/2;
		console.log(this._offset * 180 / Math.PI);

	}


	get offset() { return this._offset; }
}

const _instance = new HeadingCalibre();

export default _instance;