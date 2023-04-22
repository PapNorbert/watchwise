import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import WatchGroup from '../../components/WatchGroup'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import { buttonTypes } from '../../util/buttonTypes'


export default function WatchGroupsMy() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const { auth, setAuth, setLoginExpired } = useAuth();
  const [url, setUrl] = useState(`/api/watch_groups/?creator=${auth?.username}`);
  const { data: watch_groups, error, statusCode, loading } = useGetAxios(url);
  const { i18nData } = useLanguage();

  const location = useLocation();

  useEffect(() => {
    setUrl(`/api/watch_groups/?creator=${auth?.username}&page=${page}&limit=${limit}`);
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

  return (watch_groups &&
    <>
      <Limit limit={limit} setLimit={setLimit} setPage={setPage} key='limit' />
      <PaginationElements currentPage={page}
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} key='pagination-top' />
      {watch_groups?.data.length > 0 ?
        // there are elements returned
        watch_groups?.data.map(currentElement => {
          return (
            <WatchGroup watch_group={currentElement} buttonType={buttonTypes.manage} key={currentElement._key} />
          );
        }) :
        // no elements returned
        <h2>{convertKeyToSelectedLanguage('no_own_groups', i18nData)}</h2>
      }
      <PaginationElements currentPage={page}
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} key='pagination-bottom' />
    </>
  )

}
