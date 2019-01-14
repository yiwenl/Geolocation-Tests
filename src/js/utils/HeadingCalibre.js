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
		console.log('Update ', headingGeo);
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

		let headingGeo = directionLatLng(this._locEnd, this._locStart) + Math.PI/2;	
		this._offset = (headingGeo - sumHeading) + Math.PI/2;

	}


	get offset() { return this._offset; }
}

const _instance = new HeadingCalibre();

export default _instance;