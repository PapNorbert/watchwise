import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Row, Col, Form, Card } from 'react-bootstrap'

import UsersTab from './UsersTab'
import User from '../../components/User'
import LimitAndSearch from '../../components/LimitAndSearch'
import PaginationElements from '../../components/PaginationElements'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import useLanguage from '../../hooks/useLanguage'
import useAuth from '../../hooks/useAuth'
import useGetAxios from '../../hooks/useGetAxios'
import { querryParamDefaultValues, querryParamNames, limitValues, bannedValues } from '../../config/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'
import { banSearchTypes } from '../../config/userBanFilterTypes'

export default function Users({ moderatorsOnly = false }) {
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] =
    useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const [nameSearch] =
    useSearchParamsState(querryParamNames.name, querryParamDefaultValues.name);
  const [currentNameSearch, setCurrentNameSearch] = useState(nameSearch);
  const [bannedSearch, setBannedSearch] =
    useSearchParamsState(querryParamNames.banned, querryParamDefaultValues.banned);

  const { i18nData } = useLanguage();
  const { auth, setAuth, setLoginExpired } = useAuth();
  const location = useLocation();
  const [url, setUrl] = useState(`/api/users/?moderatorsOnly=${moderatorsOnly}`);
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
    } else if (bannedSearch && !bannedValues.includes(bannedSearch)) {
      setBannedSearch(querryParamDefaultValues.banned);
    } else {
      // limit and page have correct values
      let newUrl = `/api/users/?moderatorsOnly=${moderatorsOnly}&page=${page}&limit=${limit}`;
      if (nameSearch) {
        newUrl += `&name=${nameSearch}`;
      }
      if (bannedSearch) {
        newUrl += `&banType=${bannedSearch}`;
      }

      setUrl(newUrl);
    }
  }, [limit, users?.pagination.totalPages, nameSearch, page, setLimit, setPage,
    moderatorsOnly, bannedSearch, setBannedSearch]
  )

  function handleBannedSearchChange(bannedSearchType) {
    if (bannedSearch === bannedSearchType) {
      setBannedSearch(querryParamDefaultValues.banned);
    } else {
      setBannedSearch(bannedSearchType);
    }
  }


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
      { !moderatorsOnly &&
        <Card className='my-4 mx-5 banned-search-filters bg-sort-filter'>
        <Row>
          <Col xs>
            <Form.Check label={convertKeyToSelectedLanguage('search_not_banned', i18nData)}
              name='search_not_banned' type='checkbox' className='mx-3 my-3' inline
              checked={bannedSearch === banSearchTypes.onlyNotBanned} onChange={() => { }}
              onClick={() => handleBannedSearchChange(banSearchTypes.onlyNotBanned)} />

            <Form.Check label={convertKeyToSelectedLanguage('search_banned', i18nData)}
              name='search_banned' type='checkbox' className='mx-3 my-3' inline
              checked={bannedSearch === banSearchTypes.onlyBanned} onChange={() => { }}
              onClick={() => handleBannedSearchChange(banSearchTypes.onlyBanned)} />
          </Col>
        </Row>
      </Card>
      }
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
          <h3>
            {convertKeyToSelectedLanguage(moderatorsOnly ? 'no_moderators' : 'no_users', i18nData)}
          </h3>
      }
      <PaginationElements currentPage={parseInt(page)}
        totalPages={users?.pagination.totalPages}
        onPageChange={setPage} key='pagination-bottom' />
    </>
  )
}
