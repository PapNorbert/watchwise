import React, { useState, useEffect } from 'react'
import { useLocation, Navigate, useNavigate } from 'react-router-dom'
import { Card, Button, Col, OverlayTrigger, Popover, Alert } from 'react-bootstrap'

import UsersTab from './UsersTab'
import LimitAndSearch from '../../components/LimitAndSearch'
import PaginationElements from '../../components/PaginationElements'
import ModeratorRequest from '../../components/ModeratorRequest'
import useAuth from '../../hooks/useAuth'
import useLanguage from '../../hooks/useLanguage'
import useGetAxios from '../../hooks/useGetAxios'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../../config/querryParams'
import { useSearchParamsState } from '../../hooks/useSearchParamsState'
import { putRequest } from '../../axiosRequests/PutAxios'


export default function ModeratorRequests() {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, setAuth, setLoginExpired } = useAuth();
  const { i18nData } = useLanguage();
  const [url, setUrl] = useState('/api/moderator_requests');
  const { data: moderatorRequests, error, refetch, statusCode } = useGetAxios(url);
  const [submitError, setSubmitError] = useState(null);
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] =
    useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const [nameSearch] =
    useSearchParamsState(querryParamNames.name, querryParamDefaultValues.name);
  const [currentNameSearch, setCurrentNameSearch] = useState(nameSearch);

  const popover = (
    <Popover>
      <Popover.Header as='h3' className='delete-popover-header'>
        {convertKeyToSelectedLanguage('change_hiring_status', i18nData)}
      </Popover.Header>
      <Popover.Body>
        {convertKeyToSelectedLanguage('change_hiring_status_confirm', i18nData)}
        <br></br>
        <Button variant='light' className='mx-1 border border-2 my-2 float-end'
          onClick={handleHiringStatusChange} >
          {convertKeyToSelectedLanguage('change', i18nData)}
        </Button>
        <Button variant='light' className='mx-1 border border-2 my-2 float-end'
          onClick={() => document.body.click()} >
          {convertKeyToSelectedLanguage('cancel', i18nData)}
        </Button>
      </Popover.Body>
    </Popover>
  )

  useEffect(() => {
    // eslint-disable-next-line eqeqeq
    if (parseInt(limit) != limit) {
      setLimit(querryParamDefaultValues.limit);
      // eslint-disable-next-line eqeqeq
    } else if (parseInt(page) != page) {
      setPage(querryParamDefaultValues.page);
    } else if (!limitValues.includes(parseInt(limit))) {
      setLimit(querryParamDefaultValues.limit);
    } else if (
      page > moderatorRequests?.pagination?.totalPages && page > 1) {
      setPage(moderatorRequests?.pagination?.totalPages);
    } else {
      // limit and page have correct values
      let newUrl = `/api/moderator_requests/?page=${page}&limit=${limit}`;

      if (nameSearch) {
        newUrl += `&name=${nameSearch}`
      }

      setUrl(newUrl);
    }
  }, [limit, moderatorRequests?.pagination?.totalPages, nameSearch, page, setLimit, setPage])


  async function handleHiringStatusChange() {
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    const { error: putError, errorMessage: putErrorMessage, statusCode: putStatusCode } =
      await putRequest(`/api/moderator_requests/openStatus`, {});
    if (putStatusCode === 204) {
      document.body.click();
      refetch();
    } else if (putStatusCode === 401) {
      setAuth({ logged_in: false });
    } else if (putStatusCode === 403) {
      navigate('/unauthorized');
    }
    if (putError) {
      setSubmitError('update_status_error');
      console.log(putErrorMessage);
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

  return (moderatorRequests &&
    <>
      <LimitAndSearch limit={limit} currentNameSearch={currentNameSearch}
        setCurrentNameSearch={setCurrentNameSearch} />
      <UsersTab />
      <Card className='my-4 mx-5 bg-sort-filter hiring-status'>
        <Card.Header>
          <Card.Title as='h3' className='mx-5 mt-2' >
            {convertKeyToSelectedLanguage('mod_req_is', i18nData)}
            {moderatorRequests.hiringIsOpen ?
              <span className='color-green'>
                {convertKeyToSelectedLanguage('open', i18nData)}
              </span>
              :
              <span className='color-red'>
                {convertKeyToSelectedLanguage('closed', i18nData)}
              </span>
            }
            .
          </Card.Title>
          <Col xs lg={{ offset: 9 }}>
            <OverlayTrigger trigger='click' placement='bottom' rootClose={true}
              overlay={popover}
            >
              <Button className='btn btn-orange-dark ' key={`change_status_button`} >
                {convertKeyToSelectedLanguage(moderatorRequests.hiringIsOpen ? 'close_hiring' : 'open_hiring', i18nData)}
              </Button>
            </OverlayTrigger>

          </Col>
        </Card.Header>
      </Card>
      <Alert key='danger' variant='danger' show={submitError !== null}
        onClose={() => setSubmitError(null)} dismissible >
        {convertKeyToSelectedLanguage(submitError, i18nData)}
      </Alert>
      {moderatorRequests.hiringIsOpen &&
        <PaginationElements currentPage={parseInt(page)}
          totalPages={moderatorRequests?.pagination.totalPages}
          onPageChange={setPage} key='pagination-top' />
      }
      {moderatorRequests.hiringIsOpen &&
        (
          moderatorRequests.data.length > 0 ?
            moderatorRequests.data.map(currentElement => {
              return (
                <ModeratorRequest moderatorRequest={currentElement} key={currentElement._key}/>
              );
            })
            :
            // no elements returned
            <h3>{convertKeyToSelectedLanguage('no_mod_req', i18nData)}</h3>
        )
      }
      {moderatorRequests.hiringIsOpen &&
        <PaginationElements currentPage={parseInt(page)}
          totalPages={moderatorRequests?.pagination.totalPages}
          onPageChange={setPage} key='pagination-bottom' />
      }
    </>
  )
}
