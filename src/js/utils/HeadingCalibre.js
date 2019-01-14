// HeadingCalibre.js

class HeadingCalibre {

	constructor() {
		window.addEventListener('deviceorientationabsolute', (e)=> this._onOrientation(e));

		this._heading = 0;
		this._offset = 0;
		this._isCalibrating = false;
	}


	_onOrientation(e) {
		this._heading = -event.alpha;
	}

	start() {
		this._headings = [];
		this._headingGeos = [];
		this._isCalibrating = true;
	}

	update(headingGeo) {
		if(!this._isCalibrating) {
			return;
		}
		console.log('Update ', headingGeo);
		this._headings.push(this._heading);
		this._headingGeos.push(headingGeo);
	}

	stop() {
		this._isCalibrating = false;
		let sumHeading = 0;
		let sumHeadingGeo = 0;

		for(let i=0; i<this._headings.length; i++) {
			sumHeading += this._headings[i];
			sumHeadingGeo += this._headingGeos[i];
		}

		sumHeading /= this._headings.length;
		sumHeadingGeo /= this._headings.length;

		this._offset = sumHeadingGeo - sumHeading;

	}


	get offset() { return this._offset; }
}

const _instance = new HeadingCalibre();

export default _instance;