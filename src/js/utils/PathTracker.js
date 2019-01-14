// PathTracker.js

import alfrid from 'alfrid';
import { fromLatLngToPixel, distanceLatLng, directionLatLng } from './';

class PathTracker {

	constructor(canvas, map) {
		this._canvas = canvas;
		this._map = map;
		this._ctx = this._canvas.getContext('2d');

		this._coords = [];
		this._points = [];
	}


	update() {
		this._points = this._coords.map( p => fromLatLngToPixel(this._map, p) );

		this._ctx.strokeStyle = 'rgba(200, 0, 0, 1)';
		this._ctx.lineWidth = 1;
		this._ctx.beginPath();

		let p ;
		for(let i=0; i<this._points.length; i++) {
			p = this._points[i];
			if(i === 0) {
				this._ctx.moveTo(p.x, p.y);
			} else {
				this._ctx.lineTo(p.x, p.y);
			}
		}

		this._ctx.stroke();
	}

	clear() {
		this._coords = [];
	}

	add(mPoint) {
		this._coords.push(mPoint);
	}
}

export default PathTracker;