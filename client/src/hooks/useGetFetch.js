import { useEffect, useState } from 'react'
import Axios from 'axios'

export default function useGetFetch(url) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() =>  {
    const controller = new AbortController();
    const signal = controller.signal;
    Axios.get(url,
      { 
        signal: signal
      })
    .then((res) => {
      setData(res.data);
    })
    .catch((err) => {
      if(!Axios.isCancel(err)) {
        setError(true);
        console.log('Error obtaining language data', err);
      }
    })
     
    return () => {
      controller.abort();
    }      
  }, [url]);

  return {data, error}
}
