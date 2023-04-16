import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import WatchGroup from '../../components/WatchGroup'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'


export default function WatchGroupsAll() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState(`/api/watch_groups`);
  const { auth, setAuth, setLoginExpired } = useAuth();
  const { i18nData } = useLanguage();
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
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return (watch_groups &&
    <>
      <Limit limit={limit} setLimit={setLimit} setPage={setPage} key='limit' />
      {watch_groups?.data.map(currentElement => {
        return (
          <WatchGroup watch_group={
            currentElement?.doc ? currentElement?.doc : currentElement
          } buttonType={
            currentElement?.doc ? (currentElement?.joined ? 'leave' : 'join') : null
          } key={
            currentElement?.doc ? currentElement?.doc._key : currentElement._key
          } />
        );
      })}
      <PaginationElements currentPage={page}
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )
}
