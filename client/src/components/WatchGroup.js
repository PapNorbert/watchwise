import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Alert } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertDateAndTimeToLocale } from '../i18n/conversion'
import useAuth from '../hooks/useAuth'
import { postRequest } from '../axiosRequests/PostAxios'
import { buttonTypes } from '../config/buttonTypes'

export default function WatchGroup({ watch_group, buttonType, removeOnLeave = false, refetch }) {
  // watch_group - group doc, buttonType - leave / join group, 
  // removeOnLeave - remove element on leave event, refetch the groups

  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const { language, i18nData } = useLanguage();
  const [requestError, setRequestError] = useState(null);


  async function handleButtonClicked(e) {
    if (buttonType === buttonTypes.manage) {
      navigate(`/watch_groups/${watch_group._key}`);
    } else if (buttonType === buttonTypes.cancel_req) {
      // delete join request
      const { errorMessage, statusCode } = await postRequest(`/api/watch_groups/${watch_group._key}/join_req/cancel`);
      if (statusCode === 204) {
        // expected when edge was deleted
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.join, i18nData);
        buttonType = buttonTypes.join;
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
    else if (buttonType === buttonTypes.join || buttonType === buttonTypes.leave) {
      const { errorMessage, statusCode } = await postRequest(`/api/watch_groups/${watch_group._key}/joines`);

      if (statusCode === 204) {
        // expected when edge was deleted
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.join, i18nData);
        buttonType = buttonTypes.join;
        if (removeOnLeave) {
          refetch();
        }
      } else if (statusCode === 201 || statusCode === 200) {
        // expected when join request was created or exists
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.pendingJoin, i18nData);
        buttonType = buttonTypes.pendingJoin;
        setTimeout(() => {
          // after some time change text to cancel
          e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.cancel_req, i18nData);
          buttonType = buttonTypes.cancel_req;
        }, 3000);
      } else if (statusCode === 401) {
        setAuth({ logged_in: false });
      } else if (statusCode === 403) {
        navigate('/unauthorized');
      } else if (statusCode === 404) {
        setRequestError('404_group');
      } else {
        setRequestError(errorMessage);
      }
    }
  }

  return (
    <>
      <Card key={`container_${watch_group._key}`} className='mt-4 mb-3'>
        <Card.Header as='h5' key={`header${watch_group._key}`} >
          {watch_group.title}
          {auth.logged_in && buttonType !== buttonTypes.full &&
            <Button className='btn btn-orange float-end' onClick={handleButtonClicked}
              key={`${watch_group._key}button`}>
              {convertKeyToSelectedLanguage(buttonType, i18nData)}
            </Button>
          }
          {buttonType !== buttonTypes.manage &&
            <Button className='btn btn-orange float-end mx-2' onClick={() => navigate(`/watch_groups/${watch_group._key}`)}
              key={`${watch_group._key}_details_button`} >
              {convertKeyToSelectedLanguage('details', i18nData)}
            </Button>
          }
        </Card.Header>

        <Card.Body>
          {Object.keys(watch_group).map((key, index) => {
            if (key === 'show_type' || key === 'show_id' || key === 'title'
              || key === '_key' || key === 'location' || key === 'personLimit') {
              return null;
            }
            if (key === 'show') {
              return (
                <Row key={`${watch_group._key}_${index}`} className='justify-content-md-center mt-1'>
                  <Col xs lg={4} className='object-label' key={`${watch_group._key}_label${index}`} >
                    {convertKeyToSelectedLanguage(key, i18nData)}
                  </Col>
                  <Col xs lg={7} key={`${watch_group._key}_value${index}`}  >
                    <span className='btn btn-link p-0 link-dark' key={`${watch_group._key}_show_link_${index}`}
                      onClick={() => navigate(`/${watch_group['show_type']}s/${watch_group['show_id']}`)}>
                      {watch_group[key]}
                    </span>
                  </Col>
                </Row>
              )
            }
            if (key === 'currentNrOfPersons') {
              return (
                <Row key={`${watch_group._key}_${index}`} className='justify-content-md-center mt-1'>
                  <Col xs lg={4} className='object-label' key={`${watch_group._key}_label${index}`} >
                    {convertKeyToSelectedLanguage(key, i18nData)}
                  </Col>
                  <Col xs lg={7} key={`${watch_group._key}_value${index}`} >
                    {watch_group['currentNrOfPersons']}/{watch_group['personLimit']}
                  </Col>

                </Row>
              );
            }
            return (
              <Row key={`${watch_group._key}_${index}`} className='justify-content-md-center mt-1'>
                <Col xs lg={4} className='object-label' key={`${watch_group._key}_label${index}`} >
                  {convertKeyToSelectedLanguage(key, i18nData)}
                </Col>
                <Col xs lg={7} key={`${watch_group._key}_value${index}`} >
                  {key === 'creation_date' ?
                    convertDateAndTimeToLocale(watch_group[key], language)
                    :
                    watch_group[key]
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
