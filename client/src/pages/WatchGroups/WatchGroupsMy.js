import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import WatchGroup from '../../components/WatchGroup'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'


export default function WatchGroupsMy() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const { auth, setAuth, setLoginExpired } = useAuth()
  const [url, setUrl] = useState(`/api/watch_groups/?creator=${auth?.username}`);
  const { data: watch_groups, error, statusCode } = useGetAxios(url);

  const location = useLocation();

  useEffect(() => {
    setUrl(`/api/watch_groups/?creator=${auth?.username}&page=${page}&limit=${limit}`);
  }, [limit, page, auth?.username])


  if (statusCode === 401) {
    if( auth.logged_in ) {
      setAuth({logged_in: false});
      setLoginExpired(true);
    }
  }

  if (statusCode === 403) {
    return <Navigate to='/unauthorized' state={{ from: location }} replace />
  }


  if (error) {
    return <h2 className='error'>Sorry, there was an error</h2>
  }

  return (
    <>
      <Limit limit={limit} setLimit={setLimit} setPage={setPage} key='limit' />
      {watch_groups?.data.map(currentElement => {
        return (
          <WatchGroup watch_group={currentElement} buttonType='manage' key={currentElement._key} />
        );
      })}
      <PaginationElements currentPage={page}
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )

}
