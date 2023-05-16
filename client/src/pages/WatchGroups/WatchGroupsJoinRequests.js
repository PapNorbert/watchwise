import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import JoinRequests from '../../components/JoinRequests'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../../config/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'


export default function WatchGroupsMy() {
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] = useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const { auth, setAuth, setLoginExpired } = useAuth();
  const [url, setUrl] = useState(`/api/watch_groups/join_requests/?creator=${auth?.username}`);
  const { data: join_requests, error, refetch, statusCode, loading } = useGetAxios(url);
  const { i18nData } = useLanguage();
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
    } else if (page > join_requests?.pagination.totalPages && page > 1) {
      setPage(join_requests?.pagination.totalPages);
    } else {
      // limit and page have correct values
      setUrl(`/api/watch_groups/join_requests/?creator=${auth?.username}&page=${page}&limit=${limit}`);
    }
  }, [limit, page, auth?.username, join_requests?.pagination.totalPages, setLimit, setPage])


  if (statusCode === 401) {
    if (auth.logged_in) {
      setAuth({ logged_in: false });
      setLoginExpired(true);
    }
  }

  if (statusCode === 403) {
    return <Navigate to='/unauthorized' state={{ from: location }} replace />
  }

  if (statusCode === 503) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('server_no_resp', i18nData)}</h2>
  }

  if (loading) {
    return <h3 className='error'>{convertKeyToSelectedLanguage('loading', i18nData)}</h3>
  }

  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return (join_requests &&
    <>
      <Limit limit={limit} key='limit' />
      <PaginationElements currentPage={parseInt(page)}
        totalPages={join_requests?.pagination.totalPages}
        onPageChange={setPage} key='pagination-top' />
      {join_requests?.data.length > 0 ?
        // there are elements returned
        join_requests?.data.map(currentElement => {
          return (
            <JoinRequests join_request={currentElement} refetch={refetch} key={currentElement._key} />
          );
        }) :
        // no elements returned
        <h3>{convertKeyToSelectedLanguage('no_groups_join_req', i18nData)}</h3>
      }
      <PaginationElements currentPage={parseInt(page)}
        totalPages={join_requests?.pagination.totalPages}
        onPageChange={setPage} key='pagination-bottom' />
    </>
  )

}
