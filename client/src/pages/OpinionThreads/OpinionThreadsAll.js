import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import OpinionThread from '../../components/OpinionThread'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'


export default function OpinionThreadsAll() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState(`/api/opinion_threads`);
  const { auth, setAuth, setLoginExpired } = useAuth();
  const { data: opinion_threads, error, statusCode } = useGetAxios(url);
  const location = useLocation();
  const { i18nData } = useLanguage();

  useEffect(() => {
    setUrl(`/api/opinion_threads/?page=${page}&limit=${limit}`);
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
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return ( opinion_threads &&
    <>
      <Limit limit={limit} setLimit={setLimit} setPage={setPage} key='limit' />
      {opinion_threads?.data.map(currentElement => {
        return (
          <OpinionThread opinion_thread={
            currentElement?.doc ? currentElement?.doc : currentElement
          } buttonType={
            currentElement?.doc ? (currentElement?.followed ? 'leave' : 'follow') : null
          } key={
            currentElement?.doc ? currentElement?.doc._key : currentElement._key
          } />
        );
      })}
      <PaginationElements currentPage={page}
        totalPages={opinion_threads?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )
}
