import React, { useEffect, useState } from 'react'
import { useLocation, Navigate } from "react-router-dom"

import Serie from '../../components/Serie'
import Limit from '../../components/Limit'
import PaginationElements from '../../components/PaginationElements'
import useGetAxios from '../../hooks/useGetAxios'
import useAuth from '../../hooks/useAuth'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../../util/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'


export default function SeriesAll() {
  const [limit, setLimit, setMultipleSearchParams] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] = useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const [url, setUrl] = useState(`/api/series/?short=true`);
  const { data: series, error, statusCode } = useGetAxios(url);

  const { auth, setAuth, setLoginExpired } = useAuth()
  const location = useLocation();
  const { i18nData } = useLanguage();


  useEffect(() => {
    // eslint-disable-next-line eqeqeq
    if (parseInt(limit) != limit) {
      setLimit(querryParamDefaultValues.limit);
      // eslint-disable-next-line eqeqeq
    } else if (parseInt(page) != page) {
      setPage(querryParamDefaultValues.page);
    } else if (!limitValues.includes(parseInt(limit))) {
      setLimit(querryParamDefaultValues.limit);
    } else if (page > series?.pagination.totalPages && page > 1) {
      setPage(series?.pagination.totalPages);
    } else {
      // limit and page have correct values
      setUrl(`/api/series/?short=true&page=${page}&limit=${limit}`);
    }
  }, [limit, page, series?.pagination.totalPages, setLimit, setPage])


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


  return (
    <>
      <h1>{convertKeyToSelectedLanguage('series', i18nData)}</h1>
      <Limit limit={limit} setNewValuesOnLimitChange={setMultipleSearchParams} key='limit' />
      {series?.data.map(currentElement => {
        return (
          <Serie serie={currentElement} key={currentElement._key} />
        );
      })}
      <PaginationElements currentPage={parseInt(page)}
        totalPages={series?.pagination.totalPages}
        onPageChange={setPage} key='pagination' />
    </>
  )
}
