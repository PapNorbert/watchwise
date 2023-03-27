import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import { useQuery } from '@tanstack/react-query'

import serverUrl from '../../config/serverName'
import WatchGroup from '../../components/WatchGroup'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'

export default function WatchGroupsAll() {
  const [queryParam, setQueryParam] = useState(' ');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const {data: watch_groups, isLoading, isError} = useQuery(["watchGroups", queryParam], async (queryParams) => {
    const resp = await Axios.get(`${serverUrl}/api/watch_groups${queryParam}`);
    return resp.data;
  }, [queryParam])

  useEffect(() => {
    setQueryParam(`?page=${page}&limit=${limit}`);
  }, [limit, page])


  if( isLoading ) {
    return <div>Loading..</div>
  }

  if( isError ) {
    return <h2 className='error'>Sorry, there was an error</h2>
  }

  return (
    <>
      <Limit limit={limit} setLimit={setLimit} setPage={setPage}/>
      {watch_groups.data.map( currentElement => {
        return (
          <WatchGroup  watch_group={currentElement} key={currentElement.ID}/>
        );
      })}
      <PaginationElements currentPage={page} 
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} />
    </>
  )
}
