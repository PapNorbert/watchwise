import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import Serie from '../../components/Serie'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'


export default function SeriesAll() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState(`/api/series/?short=true`);
  const { data: series, error, statusCode } = useGetAxios(url);

  const { auth, setAuth, setLoginExpired } = useAuth()
  const location = useLocation();

  useEffect(() => {
    setUrl(`/api/series/?short=true&page=${page}&limit=${limit}`);
  }, [limit, page])


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
      {series?.data.map(currentElement => {
        return (
          <Serie serie={currentElement} key={currentElement._key} />
        );
      })}
      <PaginationElements currentPage={page}
        totalPages={series?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )
}
