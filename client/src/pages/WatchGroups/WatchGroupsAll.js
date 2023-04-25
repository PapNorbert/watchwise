import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import WatchGroup from '../../components/WatchGroup'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import { buttonTypes } from '../../util/buttonTypes'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../../util/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'


export default function WatchGroupsAll() {
  const [limit, setLimit, setMultipleSearchParams] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] = useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const [url, setUrl] = useState(`/api/watch_groups`);
  const { auth, setAuth, setLoginExpired } = useAuth();
  const { i18nData } = useLanguage();
  const { data: watch_groups, error, statusCode } = useGetAxios(url);
  const location = useLocation();

  useEffect(() => {
    // eslint-disable-next-line eqeqeq
    if (parseInt(limit) != limit) {
      setLimit(querryParamDefaultValues.limit);
      // eslint-disable-next-line eqeqeq
    } else if (parseInt(page) != page) {
      setPage(querryParamDefaultValues.page);
    } else if (!limitValues.includes(parseInt(limit))) {
      setLimit(querryParamDefaultValues.limit);
    } else if (page > watch_groups?.pagination.totalPages && page > 1) {
      setPage(watch_groups?.pagination.totalPages);
    } else {
      // limit and page have correct values
      setUrl(`/api/watch_groups/?page=${page}&limit=${limit}`);
    }
  }, [limit, page, setLimit, setPage, watch_groups?.pagination.totalPages])


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
      <Limit limit={limit} setNewValuesOnLimitChange={setMultipleSearchParams} key='limit' />
      <PaginationElements currentPage={parseInt(page)}
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} key='pagination-top' />
      {watch_groups?.data.map(currentElement => {
        return (
          <WatchGroup watch_group={
            currentElement?.doc ? currentElement?.doc : currentElement
          } buttonType={
            currentElement?.doc ?
              // logged in
              currentElement.doc.creator === auth.username ?
                // own thread
                buttonTypes.manage :
                // not own thread
                (currentElement?.joined ? buttonTypes.leave : buttonTypes.join) : null
          } key={
            currentElement?.doc ? currentElement?.doc._key : currentElement._key
          } />
        );
      })}
      <PaginationElements currentPage={parseInt(page)}
        totalPages={watch_groups?.pagination.totalPages}
        onPageChange={setPage} key='pagination-bottom' />
    </>
  )
}
