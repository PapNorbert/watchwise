import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Alert, Row, Col } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertDateAndTimeToLocale } from '../i18n/conversion'
import useAuth from '../hooks/useAuth'
import { postRequest } from '../axiosRequests/PostAxios'
import { deleteRequest } from '../axiosRequests/DeleteAxios'

export default function JoinRequests({ join_request, refetch }) {
  const { setAuth } = useAuth();
  const { language, i18nData } = useLanguage();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [requestError, setRequestError] = useState(null);


  async function handleButtonAcceptClicked() {
    const { data, errorMessage, statusCode } = await postRequest(`/api/watch_groups/join_requests/${join_request._key}`);
    if (statusCode === 201) {
      // expected when request was accepted, joined
      if (data.refetch) {
        refetch();
      }
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

  async function handleButtonRejectClicked() {
    const { errorMessage, statusCode } = await deleteRequest(`/api/watch_groups/join_requests/${join_request._key}`);
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

  return (join_request && visible &&
    <>
      <Card key={`container_${join_request._key}`} className='mt-4 mb-3'>
        <Card.Header as='h5'>
          {convertKeyToSelectedLanguage('join_req_for_group', i18nData)}
          <span className='btn btn-link p-0 link-dark text-large' key={`${join_request._key}_group_link`}
            onClick={() => navigate(`/watch_groups/${join_request['_to'].split('/')[1]}`)}>
            {join_request['group_name']}
          </span>
          <Button className='btn btn-orange-dark float-end' onClick={handleButtonAcceptClicked}
            key={`${join_request._key}_button_accept`} disabled={join_request.full}  >
            {convertKeyToSelectedLanguage('accept', i18nData)}
          </Button>
          <Button className='btn btn-orange-dark float-end mx-2' onClick={handleButtonRejectClicked}
            key={`${join_request._key}_button_reject`}>
            {convertKeyToSelectedLanguage('reject', i18nData)}
          </Button>
        </Card.Header>
        <Card.Body>
          {Object.keys(join_request).map((key, index) => {
            if (key === '_from' || key === '_to' || key === '_key' || key === 'group_name') {
              return null;
            }
            if (key === 'full') {
              return (join_request[key] ?
                // if full
                <Row key={`${join_request._key}_${index}`} >
                  <Col className='text-error text-large bold'>
                    {convertKeyToSelectedLanguage('group_full', i18nData)}
                  </Col>
                </Row>
                :
                null
              )
            }

            return (
              <Row key={`${join_request._key}_${index}`} className='justify-content-md-center'>
                <Col xs lg={4} className='object-label' key={`${join_request._key}_label${index}`} >
                  {convertKeyToSelectedLanguage(key, i18nData)}
                </Col>
                <Col xs lg={7} key={`${join_request._key}_value${index}`} >
                  {key === 'request_date' ?
                    convertDateAndTimeToLocale(join_request[key], language)
                    :
                    join_request[key]
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