import axios from './configuredAxios'


export async function putRequest(url, body) {
  let error = true;
  let statusCode = null;
  let errorMessage = null;
  if (body !== null && body !== '' && url !== null && url !== '') {
    try {
      const response = await axios.put(url, body);
      statusCode = response.status;
      error = false;
    } catch (err) {
      statusCode = err.response.status;
      if (statusCode === 400 || statusCode === 401 || statusCode === 404) {
        errorMessage = err.response.data.error;
      } else {
        console.log('Error during post request', err.message);
      }
    }
  } else {
    console.log('Error: Empty body or url');
  }
  return { error, errorMessage, statusCode }
}


