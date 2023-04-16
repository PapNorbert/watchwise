import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import OpinionThread from '../../components/OpinionThread'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'


export default function OpinionsThreadsMy() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const { auth, setAuth, setLoginExpired } = useAuth();
  const [url, setUrl] = useState(`/api/opinion_threads/?creator=${auth?.username}`);
  const { data: opinion_threads, error, statusCode, loading } = useGetAxios(url);
  const { i18nData } = useLanguage();

  const location = useLocation();

  useEffect(() => {
    setUrl(`/api/opinion_threads/?creator=${auth?.username}&page=${page}&limit=${limit}`);
  }, [limit, page, auth?.username])


  if (statusCode === 401) {
    if (auth.logged_in) {
      setAuth({ logged_in: false });
      setLoginExpired(true);
    }
  }

  if (statusCode === 403) {
    return <Navigate to='/unauthorized' state={{ from: location }} replace />
  }

  if (loading) {
    return <h3 className='error'>{convertKeyToSelectedLanguage('loading', i18nData)}</h3>
  }

  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return ( opinion_threads &&
    <>
      <Limit limit={limit} setLimit={setLimit} setPage={setPage} key='limit' />
      {opinion_threads?.data.length > 0 ?
        // there are elements returned
        opinion_threads?.data.map(currentElement => {
          return (
            <OpinionThread opinion_thread={currentElement} buttonType='manage' key={currentElement._key} />
          );
        }) :
        // no elements returned
        <h2>{convertKeyToSelectedLanguage('no_own_threads',i18nData)}</h2>
      }
      <PaginationElements currentPage={page}
        totalPages={opinion_threads?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )

}
