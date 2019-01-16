
const getGeolocation = () => new Promise((resolve, reject) => {
	if (navigator.geolocation) {
	  	navigator.geolocation.getCurrentPosition( (o)=> {
	  		resolve(o.coords);
	  	} );
	} else {
		reject('getlocation not supported')
	}
});


export default getGeolocation;