// Device.js

class Device {

	constructor() {
		this._hasCalibrated = false;
		this._headingLocal = 0;
		this._headingAbsolute = 0;
		window.addEventListener('deviceorientation', (e) => this._onDeviceOrientation(e));
		window.addEventListener('deviceorientationabsolute', (e) => this._onAbsoluteDeviceOrientation(e));
	}

	_onDeviceOrientation(e) {
		this._headingLocal = -e.alpha * Math.PI / 180;
	}


	_onAbsoluteDeviceOrientation(e) {
		this._headingAbsolute = -e.alpha * Math.PI / 180;
	}


	get heading() {
		return this._headingLocal;
	}

	get headingLocal() {
		return this._headingLocal;
	}

	get headingAbsolute() {
		return this._headingAbsolute;
	}


	get hasCalibrated() {	return this._hasCalibrated;	}
}


const _instance = new Device();

export default _instance;