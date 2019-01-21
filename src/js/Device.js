// Device.js

import HeadingCalibrate from './utils/HeadingCalibrate';

class Device {

	constructor() {
		this._hasCalibrated = false;
		this._headingLocal = 0;
		this._headingAbsolute = 0;
		HeadingCalibrate.on('onEnd', ()=>this._onCalibrateEnd());
		HeadingCalibrate.on('onReset', ()=>this._onReset());
		window.addEventListener('deviceorientation', (e) => this._onDeviceOrientation(e));
		window.addEventListener('deviceorientationabsolute', (e) => this._onAbsoluteDeviceOrientation(e));
	}

	_onCalibrateEnd(offset) {
		console.log('on calibrate end:', HeadingCalibrate.offset);
	}

	_onDeviceOrientation(e) {
		this._headingLocal = -e.alpha * Math.PI / 180;
	}


	_onAbsoluteDeviceOrientation(e) {
		this._headingAbsolute = -e.alpha * Math.PI / 180;
	}

	_onReset() {
		this._hasCalibrated = false;
	}


	get heading() {
		/*
	
		if(this._hadCalibrated) {
			return this._headingLocal + HeadingCalibrate.offset;
		} else {
			return this._headingAbsolute;
		}

		*/
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