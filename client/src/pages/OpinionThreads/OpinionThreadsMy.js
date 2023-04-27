import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import OpinionThread from '../../components/OpinionThread'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import { buttonTypes } from '../../util/buttonTypes'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../../util/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'

export default function OpinionsThreadsMy() {
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] = useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const { auth, setAuth, setLoginExpired } = useAuth();
  const [url, setUrl] = useState(`/api/opinion_threads/?creator=${auth?.username}`);
  const { data: opinion_threads, error, statusCode, loading } = useGetAxios(url);
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
    } else if (page > opinion_threads?.pagination.totalPages && page > 1) {
      setPage(opinion_threads?.pagination.totalPages);
    } else {
      // limit and page have correct values
      setUrl(`/api/opinion_threads/?creator=${auth?.username}&page=${page}&limit=${limit}`);
    }
  }, [limit, page, auth?.username, opinion_threads?.pagination.totalPages, setLimit, setPage])


  if (statusCode === 401) {
    if (auth.logged_in) {
      setAuth({ logged_in: false });
      setLoginExpired(true);
    }
  }

  if (statusCode === 403) {
    return <Navigate to='/unauthorized' state={{ from: location }} replace />
  }

  if (statusCode === 503 ) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('server_no_resp', i18nData)}</h2>
  }

  if (loading) {
    return <h3 className='error'>{convertKeyToSelectedLanguage('loading', i18nData)}</h3>
  }

  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return (opinion_threads &&
    <>
      <Limit limit={limit} key='limit' />
      <PaginationElements currentPage={parseInt(page)}
        totalPages={opinion_threads?.pagination.totalPages}
        onPageChange={setPage} key='pagination-top' />
      {opinion_threads?.data.length > 0 ?
        // there are elements returned
        opinion_threads?.data.map(currentElement => {
          return (
            <OpinionThread opinion_thread={currentElement} buttonType={buttonTypes.manage} key={currentElement._key} />
          );
        }) :
        // no elements returned
        <h2>{convertKeyToSelectedLanguage('no_own_threads', i18nData)}</h2>
      }
      <PaginationElements currentPage={parseInt(page)}
        totalPages={opinion_threads?.pagination.totalPages}
        onPageChange={setPage} key='pagination-bottom' />
    </>
  )

}
