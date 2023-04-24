
export function getCurrentLocation() {
  navigator.geolocation.getCurrentPosition((position) => {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  },
    (err) => {
      if (err.code === 1) {
        // user denied location
      } else {
        console.log(err);
      }
      return undefined;
    }
  );
}