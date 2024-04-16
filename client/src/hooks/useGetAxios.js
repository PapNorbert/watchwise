import { useEffect, useState } from 'react'

import axios from '../axiosRequests/configuredAxios'
import Axios from 'axios'

export default function useGetAxios(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (url.includes(undefined)) {
      setLoading(true);
      return
    }
    setLoading(false);
    let newErrorValue = false;
    let newStatusCode = null;
    const controller = new AbortController();
    const signal = controller.signal;
    axios.get(url,
      {
        signal: signal
      })
      .then((res) => {
        newStatusCode = res.status;
        setData(res.data);
      })
      .catch((err) => {
        if (!Axios.isCancel(err)) {
          if( !err.response) {
            // no response from server
            newStatusCode = 503; // service unavailable
            newErrorValue = true;
          } else {
            newStatusCode = err.response?.status;
            newErrorValue = true;
            if (err.response.status !== 401 && err.response.status !== 403 && err.response.status !== 404) {
              console.log('Error during connection', err.message);
            }
          }
        }
      })
      .finally(() => {
        setStatusCode(newStatusCode);
        setError(newErrorValue);
      })

    return () => {
      controller.abort();
    }
  }, [url]);


  function refetch() {
    if (url.includes(undefined)) {
      setLoading(true);
      return
    }
    setLoading(false);
    let newErrorValue = false;
    let newStatusCode = null;
    const controller = new AbortController();
    const signal = controller.signal;
    axios.get(url,
      {
        signal: signal
      })
      .then((res) => {
        newStatusCode = res.status;
        setData(res.data);
      })
      .catch((err) => {
        if (!Axios.isCancel(err)) {
          console.log(err)
          newStatusCode = err.response.status;
          newErrorValue = true;
          if (err.response.status !== 401 && err.response.status !== 403 && err.response.status !== 404) {
            console.log('Error during connection', err.message);
          }
        }
      })
      .finally(() => {
        setStatusCode(newStatusCode);
        setError(newErrorValue);
      })

    return () => {
      controller.abort();
    }
  }

  return { data, error, refetch, statusCode, loading }
}
