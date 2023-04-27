import React, { useState } from 'react'
import { Card, Alert, Row, Col, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertDateAndTimeToLocale } from '../i18n/conversion'
import { postRequest } from '../axiosRequests/PostAxios'
import useAuth from '../hooks/useAuth'

export default function User({ user }) {
  const [requestError, setRequestError] = useState(null);
  const { i18nData } = useLanguage();
  const { language } = useLanguage();
  const { setAuth} = useAuth();
  const navigate = useNavigate();

  async function handleButtonClicked(e) {
    const { errorMessage, statusCode } = await postRequest(`/api/users/${user._key}/ban`);

    if (statusCode === 202) {
      // user was unbanned
      e.target.textContent = convertKeyToSelectedLanguage('ban', i18nData);
    } else if (statusCode === 204) {
      // user banned
      e.target.textContent = convertKeyToSelectedLanguage('unban', i18nData);
    } else if (statusCode === 401) {
      setAuth({ logged_in: false });
    } else if (statusCode === 403) {
      navigate('/unauthorized');
    } else if (statusCode === 404) {
      setRequestError('404_user');
    } else {
      setRequestError(errorMessage);
    }

  }
  return (
    <>
      <Card key={`container_${user._key}`} className='mt-4 mb-3'>
        <Card.Header as='h5' key={`header_${user._key}`} >
          {user.username}
          <Button className='btn btn-orange float-end mx-2' onClick={handleButtonClicked}
            key={`${user._key}_button`} >
            {convertKeyToSelectedLanguage(user.banned ? 'unban' : 'ban', i18nData)}
          </Button>
        </Card.Header>

        <Card.Body>
          {Object.keys(user).map((key, index) => {
            if (key === 'username' || key === '_key' || key === 'banned') {
              return null;
            }

            return (
              <Row key={`${user._key}_${index}`} className='justify-content-md-center'>
                <Col xs lg={4} className='object-label' key={`${user._key}_label${index}`} >
                  {key === 'create_date' ?
                    convertKeyToSelectedLanguage('creation_date', i18nData)
                    :
                    convertKeyToSelectedLanguage(key, i18nData)
                  }
                </Col>
                <Col xs lg={7} key={`${user._key}_value${index}`} >
                  {key === 'create_date' ?
                    convertDateAndTimeToLocale(user[key], language)
                    :
                    user[key]
                  }
                </Col>

              </Row>
            );
          })}
        </Card.Body>
      </Card>
      <Alert key='danger' variant='danger' show={requestError !== null}
        onClose={() => setRequestError(null)} dismissible >
        {convertKeyToSelectedLanguage(requestError, i18nData)}
      </Alert>
    </>
  )
}
