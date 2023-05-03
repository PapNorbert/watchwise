import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import UsersTab from './UsersTab'
import User from '../../components/User'
import LimitAndSearch from '../../components/LimitAndSearch'
import PaginationElements from '../../components/PaginationElements'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import useAuth from '../../hooks/useAuth'
import useGetAxios from '../../hooks/useGetAxios'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../../config/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'


export default function Users() {
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] =
    useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const [nameSearch] =
    useSearchParamsState(querryParamNames.name, querryParamDefaultValues.name);
  const [currentNameSearch, setCurrentNameSearch] = useState(nameSearch);

  const { i18nData } = useLanguage();
  const { auth, setAuth, setLoginExpired } = useAuth();
  const location = useLocation();
  const [url, setUrl] = useState('/api/users');
  const { data: users, error, statusCode } = useGetAxios(url);

  useEffect(() => {
    setCurrentNameSearch(nameSearch);
  }, [nameSearch])

  useEffect(() => {
    // eslint-disable-next-line eqeqeq
    if (parseInt(limit) != limit) {
      setLimit(querryParamDefaultValues.limit);
      // eslint-disable-next-line eqeqeq
    } else if (parseInt(page) != page) {
      setPage(querryParamDefaultValues.page);
    } else if (!limitValues.includes(parseInt(limit))) {
      setLimit(querryParamDefaultValues.limit);
    } else if (page > users?.pagination.totalPages && page > 1) {
      setPage(users?.pagination.totalPages);
    } else {
      // limit and page have correct values
      setUrl(`/api/users/?short=true&page=${page}&limit=${limit}&name=${nameSearch}`);
    }
  }, [limit, users?.pagination.totalPages, nameSearch, page, setLimit, setPage])


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

  if (error) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return (users &&
    <>
      <LimitAndSearch limit={limit} currentNameSearch={currentNameSearch}
        setCurrentNameSearch={setCurrentNameSearch} />
      <UsersTab />
      <PaginationElements currentPage={parseInt(page)}
        totalPages={users?.pagination.totalPages}
        onPageChange={setPage} key='pagination-top' />
      {
        users.data.length > 0 ?
          users.data.map(currentElement => {
            return (
              <User user={currentElement} key={currentElement._key} />
            );
          })
          :
          // no elements returned
          <h2>{convertKeyToSelectedLanguage('no_users', i18nData)}</h2>
      }
      <PaginationElements currentPage={parseInt(page)}
        totalPages={users?.pagination.totalPages}
        onPageChange={setPage} key='pagination-bottom' />
    </>
  )
}
