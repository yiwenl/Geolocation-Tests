// getGeolocation.js
// const getGeolocation = () => {
// 	console.log('navigator.geolocation', navigator.geolocation);
// 	if (navigator.geolocation) {
// 	  	navigator.geolocation.getCurrentPosition( (o)=> {
// 	  		console.log('Get location :', o);
// 	  	} );
// 	} else {
// 		return null;
// 	}
// }


const getGeolocation = () => new Promise((resolve, reject) => {
	if (navigator.geolocation) {
	  	navigator.geolocation.getCurrentPosition( (o)=> {
	  		resolve(o);
	  	} );
	} else {
		reject('getlocation not supported')
	}
});


export { getGeolocation }