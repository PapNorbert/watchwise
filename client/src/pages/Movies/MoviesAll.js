import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import Movie from '../../components/Movie'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'


export default function MoviesAll() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState(`/api/movies/?short=true`);
  const { data: movies, error, statusCode } = useGetAxios(url);
  const { auth, setAuth, setLoginExpired } = useAuth()
  const location = useLocation();
  const { i18nData } = useLanguage();
  
  useEffect(() => {
    setUrl(`/api/movies/?short=true&page=${page}&limit=${limit}`);
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
      <h1>{convertKeyToSelectedLanguage('movies', i18nData)}</h1>
      <Limit limit={limit} setLimit={setLimit} setPage={setPage} key='limit' />
      {movies?.data.map(currentElement => {
        return (
          <Movie movie={currentElement} key={currentElement._key} />
        );
      })}
      <PaginationElements currentPage={page}
        totalPages={movies?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )
}
