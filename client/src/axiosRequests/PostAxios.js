import axios from '../api/configuredAxios'

// export default function usePostAxios(url, body, options = {}) {
//   const [data, setData] = useState(null)
//   const [error, setError] = useState(null)

  // useEffect(() =>  {
  //   let newErrorValue = false;
  //   if (body !== null && body !=='' && url !== null && url !=='') {
  //     const controller = new AbortController();
  //     const signal = controller.signal;
  //     axios.post(url, body,
  //       { 
  //         ...options,
  //         [signal]: signal
  //       })
  //     .then((res) => {
  //       setData(res.data);
  //     })
  //     .catch((err) => {
  //       if(!Axios.isCancel(err)) {
  //         newErrorValue = true
  //         console.log('Error during post request', err.message);
  //       }
  //     })
      
  //     return () => {
  //       controller.abort();
  //     }   
  //   } else {
  //     newErrorValue = true
  //     console.log('Error: Empty body or url');
  //   }
  //   setError(newErrorValue);
  // }, [url, body, options]);

export async function postRequest(url, body) {
  let error = true;
  let data = null;
  let errorMessage = null
  if (body !== null && body !=='' && url !== null && url !=='') {
    const controller = new AbortController();
    const signal = controller.signal;
    try {
      const response = await axios.post(url, body, {signal: signal});
      data = response.data;
      error = false;
    } catch(err) {
      if (err.message === 'Request failed with status code 400') {
        errorMessage = err.response.data.error;
      } else {
        console.log('Error during post request', err.message);
      }
         
    }
  } else {
    console.log('Error: Empty body or url');
  }
  return { 'data': data, 'error': error, errorMessage: errorMessage }
}

  
