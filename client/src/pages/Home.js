import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Container, Card } from 'react-bootstrap';

import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import useLanguage from '../hooks/useLanguage'
import useAuth from '../hooks/useAuth';
import useGetAxios from '../hooks/useGetAxios'

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18nData } = useLanguage();
  const { auth, setAuth, setLoginExpired } = useAuth();
  const { data: moderatorHiringIsOpen, error, statusCode } = useGetAxios(`/api/moderator_requests/isOpen`);


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

  return (
    <Container>
      <h1>
        {convertKeyToSelectedLanguage('home', i18nData)}
      </h1>
      <h2 className='announcements'>
        {convertKeyToSelectedLanguage('announcements', i18nData)}
      </h2>
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
    </Container>
  )
}
