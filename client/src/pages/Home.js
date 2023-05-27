import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Container, Card, Form, Button, Alert, FloatingLabel } from 'react-bootstrap';

import Limit from '../components/Limit'
import Announcement from '../components/Announcement'
import CaretDownIcon from '../components/icons/CaretDownIcon'
import CaretUpIcon from '../components/icons/CaretUpIcon'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import useLanguage from '../hooks/useLanguage'
import useAuth from '../hooks/useAuth';
import useGetAxios from '../hooks/useGetAxios'
import { postRequest } from '../axiosRequests/PostAxios'
import { useSearchParamsState } from '../hooks/useSearchParamsState'
import { querryParamNames, querryParamDefaultValues, limitValues } from '../config/querryParams'
import { adminRoleCode } from '../config/UserRoleCodes';


export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18nData } = useLanguage();
  const { auth, setAuth, setLoginExpired } = useAuth();
  const { data: moderatorHiringIsOpen, error: errorHiringIsOpen,
    statusCode: statusCodeHiringIsOpen } = useGetAxios(`/api/moderator_requests/isOpen`);
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] = useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const [announcementsUrl, setAnnouncementsUrl] = useState(`/api/announcements`);
  const { data: announcements, error: errorAnnouncements, refetch: refetchAnnouncements,
    statusCode: statusCodeAnnouncements } = useGetAxios(announcementsUrl);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementTitleError, setAnnouncementTitleError] = useState(null);
  const [announcementsCreateVisible, setAnnouncementsCreateVisible] = useState(false);
  const [announcementsCreated, setAnnouncementsCreated] = useState(false);


  useEffect(() => {
    // eslint-disable-next-line eqeqeq
    if (parseInt(limit) != limit) {
      setLimit(querryParamDefaultValues.limit);
      // eslint-disable-next-line eqeqeq
    } else if (parseInt(page) != page) {
      setPage(querryParamDefaultValues.page);
    } else if (!limitValues.includes(parseInt(limit))) {
      setLimit(querryParamDefaultValues.limit);
    } else if (page > announcements?.pagination.totalPages && page > 1) {
      setPage(announcements?.pagination.totalPages);
    } else {
      // limit and page have correct values
      setAnnouncementsUrl(`/api/announcements/?page=${page}&limit=${limit}`);
    }
  }, [announcements?.pagination.totalPages, limit, page, setLimit, setPage])


  function handleAnnouncementInsert(e) {
    e.preventDefault();
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    if (announcementText === '' || announcementText === undefined) {
      setAnnouncementsError('empty_announcement');
    } else if (announcementTitle === '' || announcementTitle === undefined) {
      setAnnouncementTitleError('empty_title');
    } else {
      const announcementData = { text: announcementText, title: announcementTitle };
      postRequest(`/api/announcements`, announcementData)
        .then((res) => {
          if (!res.error && res.statusCode === 201) {
            // 201 expected
            setAnnouncementText('');
            setAnnouncementsError(null);
            setAnnouncementTitle('');
            setAnnouncementTitleError(null);
            setAnnouncementsCreated(true);
            refetchAnnouncements();
          } else if (res.statusCode === 401) {
            setAuth({ logged_in: false });
          } else if (res.statusCode === 403) {
            navigate('/unauthorized');
          } else {
            setAnnouncementsError(res?.errorMessage);
          }
        })
        .catch((err) => {
          setAnnouncementsError('error');
          console.log('Error during post request', err.message);
        })
    }
  }

  function clearAnnouncement() {
    setAnnouncementText('');
    setAnnouncementTitle('');
    setAnnouncementsError(null);
    setAnnouncementTitleError(null);

  }


  if (statusCodeHiringIsOpen === 401 || statusCodeAnnouncements === 401) {
    if (auth.logged_in) {
      setAuth({ logged_in: false });
      setLoginExpired(true);
    }
  }

  if (statusCodeHiringIsOpen === 403 || statusCodeAnnouncements === 403) {
    return <Navigate to='/unauthorized' state={{ from: location }} replace />
  }

  if (statusCodeHiringIsOpen === 503 || statusCodeAnnouncements === 503) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('server_no_resp', i18nData)}</h2>
  }

  if (errorAnnouncements || errorHiringIsOpen) {
    return <h2 className='error'>{convertKeyToSelectedLanguage('error', i18nData)}</h2>
  }

  return (
    <Container>
      <h1>
        {convertKeyToSelectedLanguage('home', i18nData)}
      </h1>
      <Container className='home-text' >
        {convertKeyToSelectedLanguage('home_intro', i18nData)}
      </Container>
      <Container className='home-text' >
        {convertKeyToSelectedLanguage('home_intro2', i18nData)}
      </Container>
      <Container className='home-text' >
        {convertKeyToSelectedLanguage('home_rules', i18nData)}
      </Container>
      <h2 className='announcements mt-4'>
        {convertKeyToSelectedLanguage('announcements', i18nData)}
      </h2>
      {announcements &&
        <Limit limit={limit} />
      }
      {auth.role === adminRoleCode &&
        // creating announcement
        <>
          <h4 onClick={() => setAnnouncementsCreateVisible(!announcementsCreateVisible)}
            className={announcementsCreateVisible ? 'announcement-create-header' : 'announcement-create-header mb-5'}
          >
            {convertKeyToSelectedLanguage('create_ann', i18nData)}
            {announcementsCreateVisible ?
              <span className='ms-3' >
                <CaretUpIcon />
              </span>
              :
              <span className='ms-3' >
                <CaretDownIcon />
              </span>
            }
          </h4>
          {announcementsCreateVisible &&
            <Form className='mt-3 announcement-create' onSubmit={handleAnnouncementInsert} >
              <FloatingLabel
                label={convertKeyToSelectedLanguage('title', i18nData)} className='mb-3 mt-2 short' >
                <Form.Control type='text' placeholder={convertKeyToSelectedLanguage('title', i18nData)}
                  value={announcementTitle} isInvalid={!!announcementTitleError} autoComplete='off'
                  onChange={e => { setAnnouncementTitle(e.target.value) }} />
                <Form.Control.Feedback type='invalid'>
                  {convertKeyToSelectedLanguage(announcementTitleError, i18nData)}
                </Form.Control.Feedback>
              </FloatingLabel>
              <Form.Control as='textarea' rows={4} className='mb-3'
                placeholder={convertKeyToSelectedLanguage('announcement_write', i18nData)}
                isInvalid={!!announcementsError} autoComplete='off'
                value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
              />
              <Alert key='danger' variant='danger' show={announcementsError !== null}
                onClose={() => setAnnouncementsError(null)} dismissible >
                {convertKeyToSelectedLanguage(announcementsError, i18nData)}
              </Alert>
              <Alert key='success' variant='success' show={announcementsCreated} className='mt-3'
                onClose={() => setAnnouncementsCreated(false)} dismissible >
                <Container>
                  {convertKeyToSelectedLanguage('ann_succesfull_created', i18nData)}
                </Container>
              </Alert>
              <Button type='submit' variant='light' key='add_announcement' className='insert-button border border-2 mb-5'
                disabled={announcementText === '' || announcementsError !== null}>
                {convertKeyToSelectedLanguage('add_announcement', i18nData)}
              </Button>
              <Button variant='light' key='clear' className='mx-2 border border-2 mb-5' onClick={clearAnnouncement}>
                {convertKeyToSelectedLanguage('cancel', i18nData)}
              </Button>
            </Form>
          }
        </>
      }
      {moderatorHiringIsOpen &&
        <Card className='moderator-recruiting'>
          <Card.Header>
            <Card.Title>
              {convertKeyToSelectedLanguage('mod_req_is', i18nData)}
              <span className='color-green'>
                {convertKeyToSelectedLanguage('open', i18nData)}
              </span>
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Card.Text className='ms-5'>
              {convertKeyToSelectedLanguage('dear_users', i18nData)}
            </Card.Text>
            <Card.Text className='ms-3'>
              {convertKeyToSelectedLanguage('mod_hiring_open', i18nData)}
            </Card.Text>
            <Card.Text className='ms-3'>
              {convertKeyToSelectedLanguage('mod_tasks', i18nData)}
            </Card.Text>
            <Card.Text className='ms-3'>
              {convertKeyToSelectedLanguage('create_req_1', i18nData)}
              <span className='btn btn-link p-0 link-dark mb-1' onClick={() => navigate('/moderator/requests')}>
                {convertKeyToSelectedLanguage('this_link', i18nData)}
              </span>
              {convertKeyToSelectedLanguage('create_req_2', i18nData)}
            </Card.Text>
            <Card.Text className='ms-3'>
              {convertKeyToSelectedLanguage('staff', i18nData)}
            </Card.Text>
          </Card.Body>
        </Card>
      }
      {announcements &&
        <>
          {announcements?.data.length > 0 ?
            announcements?.data.map(currentElement => {
              return (
                <Announcement announcement={currentElement} key={currentElement._key} />
              );
            })
            :
            // no announcement
            moderatorHiringIsOpen ?
              <h4 className='mt-3 mb-5' >{convertKeyToSelectedLanguage('no_other_announcements', i18nData)}</h4>
              :
              <h4 className='mt-3 mb-5' >{convertKeyToSelectedLanguage('no_announcements', i18nData)}</h4>
          }
        </>
      }
    </Container>
  )
}
