import React, { useState } from 'react'
import { Card, Alert, Row, Col, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertDateAndTimeToLocale } from '../i18n/conversion'
import { postRequest } from '../axiosRequests/PostAxios'
import { deleteRequest } from '../axiosRequests/DeleteAxios'
import useAuth from '../hooks/useAuth'

export default function ModeratorRequest({ moderatorRequest }) {
  const [visible, setVisible] = useState(true);
  const [requestError, setRequestError] = useState(null);
  const { i18nData } = useLanguage();
  const { language } = useLanguage();
  const { setAuth } = useAuth();
  const navigate = useNavigate();


  async function handleButtonAcceptClicked() {
    const { errorMessage, statusCode } = await postRequest(`/api/moderator_requests/${moderatorRequest._key}`);
    if (statusCode === 200) {
      setVisible(false);
    } else if (statusCode === 401) {
      setAuth({ logged_in: false });
    } else if (statusCode === 403) {
      navigate('/unauthorized');
    } else if (statusCode === 404) {
      setRequestError('404_mod_req');
    } else {
      setRequestError(errorMessage);
    }
  }

  async function handleButtonRejectClicked() {
    const { errorMessage, statusCode } = await deleteRequest(`/api/moderator_requests/${moderatorRequest._key}`);
    if (statusCode === 204) {
      // expected when edge was deleted
      setVisible(false);
    } else if (statusCode === 401) {
      setAuth({ logged_in: false });
    } else if (statusCode === 403) {
      navigate('/unauthorized');
    } else if (statusCode === 404) {
      setRequestError('404_join_req');
    } else {
      setRequestError(errorMessage);
    }
  }

  return ( visible &&
    <>
      <Card key={`container_${moderatorRequest._key}`} className='mt-4 mb-3'>
        <Card.Header as='h5' key={`header_${moderatorRequest._key}`} >
          {convertKeyToSelectedLanguage('req_from', i18nData)}
          {moderatorRequest.creator}
          <Button className='btn btn-orange-dark float-end' onClick={handleButtonAcceptClicked}
            key={`${moderatorRequest._key}_button_accept`} disabled={moderatorRequest.full}  >
            {convertKeyToSelectedLanguage('accept', i18nData)}
          </Button>
          <Button className='btn btn-orange-dark float-end mx-2' onClick={handleButtonRejectClicked}
            key={`${moderatorRequest._key}_button_reject`}>
            {convertKeyToSelectedLanguage('reject', i18nData)}
          </Button>
        </Card.Header>

        <Card.Body>
          {Object.keys(moderatorRequest).map((key, index) => {
            if (key === 'type' || key === '_key' || key === 'creator' || key === 'creator_key') {
              return null;
            }

            return (
              <Row key={`${moderatorRequest._key}_${index}`} className='justify-content-md-center'>
                <Col xs lg={4} className='object-label' key={`${moderatorRequest._key}_label_${index}`} >
                  {key === 'creation_date' ?
                    convertKeyToSelectedLanguage('creation_date', i18nData)
                    :
                    convertKeyToSelectedLanguage(key, i18nData)
                  }
                </Col>
                <Col xs lg={7} key={`${moderatorRequest._key}_value_${index}`} >
                  {key === 'creation_date'  || key === 'register_date'?
                    convertDateAndTimeToLocale(moderatorRequest[key], language)
                    :
                    moderatorRequest[key]
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
