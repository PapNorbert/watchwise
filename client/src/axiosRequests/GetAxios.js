import axios from './configuredAxios'

export async function getAxios(url) {
  if (url.includes(undefined)) {
    return { loading: true }
  }
  let error = true;
  let data = null;
  let statusCode = null;
  let errorMessage = null;
  if (url !== undefined && url !== '') {
    try {
      const response = await axios.get(url);
      statusCode = response.status;
      data = response.data;
      error = false;
    } catch (err) {
      statusCode = err.response.status;
      error = true;
      if (statusCode === 400 || statusCode === 401 || statusCode === 404) {
        errorMessage = err.response?.data?.error || null;
      } else {
        console.log('Error during post request', err.message);
      }
    }
  } else {
    console.log('Error: Empty body or url');
  }
  return { data, error, errorMessage, statusCode }
}