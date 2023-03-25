import Axios from 'axios'
import { useQuery } from '@tanstack/react-query'

import serverUrl from '../config/serverName.js'


function WatchGroups() {


  const {data, isLoading, isError, refetch} = useQuery(["watchGroups"], async () => {
    const resp = await Axios.get(`${serverUrl}/api/url`);
    return resp.data;
  })

  if( isLoading ) {
    <h1>WatchGroups</h1>
    return <div>Loading..</div>
  }

  if( isError ) {
    <h1>WatchGroups</h1>
    return <h2>Sorry, here was an error</h2>
  }

  return (
    <div>
      <h1>WatchGroups</h1>
      <button onClick = {refetch}>Refetch</button>
      <p>{data?.Title}</p>
    </div>
  )
}

export default WatchGroups;