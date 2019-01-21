// HeadingCalibrate.js

import { fromLatLngToPixel, distanceLatLng, directionLatLng } from './';
import getGeolocation from './getGeolocation';
import { GL } from 'alfrid';
import EventEmitter from 'events';
import Config from '../Config';

class HeadingCalibrate extends EventEmitter {

	constructor() {
		super();

		this._heading = GL.isMobile ? 0 : Math.random() * Math.PI * 2;
		this._headingStart = 0;
		this._state = 0;
		this._offset = 0;

		//	states 
		//	0 -> not started 
		//	1 -> calibrating
		//	2 -> done
		window.addEventListener('deviceorientation', (e) => this._onDeviceOrientation(e));
	}

	start() {
		
		this._headingStart = this._heading;

		return new Promise((resolve, reject) => {

			getGeolocation()
			.then((oCoord)=> {
				this._state = 1;
				this._locStart = {
					lat:oCoord.latitude,
					lng:oCoord.longitude,
				}
				console.log('location start :', this._locStart);

				this.emit('onStart', this._locStart);
			})
			.then(()=>this._capture())
			.then((heading)=> {
				this._avgHeading = heading;
				console.log('average heading :', this._avgHeading);
			})
			.then( getGeolocation )
			.then((oCoord)=> {
				this._locEnd = {
					lat:oCoord.latitude,
					lng:oCoord.longitude,
				}
				if(!GL.isMobile) {
					this._locEnd.lng += 0.001;
				}

				let headingGeo = directionLatLng(this._locEnd, this._locStart) + Math.PI/2;	
				if(headingGeo > Math.PI * 2) {
					headingGeo -= Math.PI * 2;
				}

				this._offset = (headingGeo - this._avgHeading);

				this.emit('onEnd', this._offset);

				this._state = 2;
				resolve(this._offset);
			})
			.catch(e => {
				this._state = 0;
				reject(e);
			});
		});
	}


	_capture() {
		let count = 0;
		let heading = 0;
		const totalSteps = Config.calibrationSteps;

		return new Promise((resolve, reject) => {

			const interval = setInterval(()=> {
				heading += this._heading;
				count ++;

				this.emit('onProgress', count / totalSteps);

				if(count >= totalSteps) {
					clearInterval(interval);
					resolve(heading/totalSteps);
				}

				
			}, 1000);
		});
	}


	_onDeviceOrientation(e) {
		this._heading = -event.alpha * Math.PI / 180;
	}


	reset() {
		this._offset = 0;
		this.emit('onReset');
	}


	get offset() { return this._offset; }

	get state() { return this._state; }

	get heading() { return this._heading; }

	get stateString() {
		let s = '';

		if(this._state === 0) {
			s = 'NEED CALIBRATING';
		} else if(this._state === 1) {
			s = 'CALIBRATING ...';
		} else {
			s = 'CALIBRATING FINISHED';
		}

		return s;
	}
}

let _instance = new HeadingCalibrate();

export default _instance;