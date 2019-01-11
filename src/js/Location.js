
const INTERVAL = 2000;
class Location {

	constructor() {
		console.log('init location');

		this.latitude = '0';
		this.longitude = '0';

		setTimeout(()=> {
			gui.add(this, 'latitude').listen();
			gui.add(this, 'longitude').listen();
		}, 500);

		setInterval(()=>this.update(), INTERVAL);
	}


	update() {
		// console.log('update', navigator.geolocation);

		if (navigator.geolocation) {
		  	navigator.geolocation.getCurrentPosition( (o)=> {
		  		console.log(o.coords);

		  		this.latitude = o.coords.latitude.toString();
		  		this.longitude = o.coords.longitude.toString();
		  	} );
		}
	}

}

export default new Location();