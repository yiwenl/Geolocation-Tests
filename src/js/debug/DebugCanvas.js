// DebugCanvas.js

import alfrid from 'alfrid';
import DebugInfo from './DebugInfo';

class DebugCanvas {

	constructor() {
		this.headingLocal = 0;
		this.headingOffset = 0;
		this.headingTarget = 0;
		this.point = {x:0, y:0};

		this.canvas = document.createElement("canvas");
		this.canvas.width = window.innerWidth;
		this.canvas.className = 'canvas-overlay';
		this.ctx = this.canvas.getContext('2d');
		document.body.appendChild(this.canvas);

		alfrid.Scheduler.addEF(()=>this._loop());
	}


	_loop() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		const { ctx } = this;
		const { point, headingLocal, headingOffset } = DebugInfo;

		ctx.save();

		let w = 8;
		const h = 50;
		ctx.translate(point.x, point.y);

		ctx.save();
		ctx.rotate(headingLocal + headingOffset);
		ctx.fillStyle = 'rgba(255, 200, 0, 1)';
		ctx.fillRect(-w/2, -h, w, h);
		ctx.restore();

		w = 2;
		ctx.save();
		ctx.rotate(headingLocal);
		ctx.fillStyle = 'rgba(20, 80, 28, 1)';
		ctx.fillRect(-w/2, -h, w, h);
		ctx.restore();

		ctx.restore();
	}


}

export default DebugCanvas;