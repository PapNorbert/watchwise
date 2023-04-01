import { useEffect, useState } from 'react'

import axios from '../api/configuredAxios'
import Axios from 'axios'

export default function useGetAxios(url) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() =>  {
    const controller = new AbortController();
    const signal = controller.signal;
    axios.get(url,
      { 
        signal: signal
      })
    .then((res) => {
      setData(res.data);
    })
    .catch((err) => {
      if(!Axios.isCancel(err)) {
        setError(true);
        console.log('Error during connection', err.message);
      }
    })
     
    return () => {
      controller.abort();
    }      
  }, [url]);

  return {data, error}
}
