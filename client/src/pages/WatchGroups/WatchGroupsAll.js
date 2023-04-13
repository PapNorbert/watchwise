import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import WatchGroup from '../../components/WatchGroup'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'


export default function WatchGroupsAll() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState(`/api/watch_groups`);
  const { auth, setAuth, setLoginExpired } = useAuth()
  const { data: watch_groups, error, statusCode } = useGetAxios(url);
  const location = useLocation();

  useEffect(() => {
    setUrl(`/api/watch_groups/?page=${page}&limit=${limit}`);
  }, [limit, page])


  if (statusCode === 401) {
    if (auth.logged_in) {
      setAuth({ logged_in: false });
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
          <WatchGroup watch_group={
            auth.logged_in ? currentElement?.doc : currentElement
          } buttonType={
            auth.logged_in ? (currentElement?.joined ? 'leave' : 'join') : null
          } key={currentElement._key} />
        );
      })}
      <PaginationElements currentPage={page}
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )
}
