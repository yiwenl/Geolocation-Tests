// HeadingCalibre.js
import { fromLatLngToPixel, distanceLatLng, directionLatLng } from './';
import { GL } from 'alfrid';

class HeadingCalibre {

	constructor() {
		this._heading = 0;
		this._offset = 0;
		this._isCalibrating = false;
		this._locStart;
		this._locEnd;
	}

	start(loc) {
		this._headings = [];
		this._locStart = loc;
		this._isCalibrating = true;
	}

	update(heading) {
		if(!this._isCalibrating) {
			return;
		}

		this._heading = heading;
		console.log('update :', this._heading);
		this._headings.push(this._heading);
	}

	stop(loc) {
		const rad = 180 / Math.PI;
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
		this._offset = (headingGeo - sumHeading);
		console.log(this._offset * 180 / Math.PI);

	}


	get offset() { return this._offset; }
}

const _instance = new HeadingCalibre();

export default _instance;