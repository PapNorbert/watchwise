import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Alert } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertDateAndTimeToLocale } from '../i18n/conversion'
import useAuth from '../hooks/useAuth'
import { postRequest } from '../axiosRequests/PostAxios'
import { buttonTypes } from '../config/buttonTypes'

export default function OpinionThread({ opinion_thread, buttonType, removeOnLeave = false, refetch }) {
  // opinion_thread - thread doc, buttonType - follow / join thread, 
  // removeOnLeave - remove element on leave event, refetch the threads

  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const { language, i18nData } = useLanguage();
  const [requestError, setRequestError] = useState(null);

  async function handleButtonClicked(e) {
    if (buttonType === buttonTypes.manage) {
      navigate(`/opinion_threads/${opinion_thread._key}`);
    }
    else if (buttonType === buttonTypes.follow || buttonType === buttonTypes.leave) {
      const { errorMessage, statusCode } = await postRequest(`/api/opinion_threads/${opinion_thread._key}/followes`);

      if (statusCode === 204) {
        // expected when edge was deleted
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.follow, i18nData);
        buttonType = buttonTypes.follow;
        if (removeOnLeave) {
          refetch();
        }
      } else if (statusCode === 201) {
        // expected when edge was created
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.leave, i18nData);
        buttonType = buttonTypes.leave;
      } else if (statusCode === 401) {
        setAuth({ logged_in: false });
      } else if (statusCode === 403) {
        navigate('/unauthorized');
      } else if (statusCode === 404) {
        setRequestError('404_thread');
      } else {
        setRequestError(errorMessage);
      }
    }
  }

  return (
    <>
      <Card key={`container_${opinion_thread._key}`} className='mt-4 mb-3'>
        <Card.Header as='h5' key={`header${opinion_thread._key}`} >
          {opinion_thread.title}
          {auth.logged_in &&
            <Button className='btn btn-orange float-end mx-2' onClick={handleButtonClicked}
              key={`${opinion_thread._key}_button`} >
              {convertKeyToSelectedLanguage(buttonType, i18nData)}
            </Button>
          }
          {buttonType !== buttonTypes.manage &&
            <Button className='btn btn-orange float-end mx-2' onClick={() => navigate(`/opinion_threads/${opinion_thread._key}`)}
              key={`${opinion_thread._key}_details_button`} >
              {convertKeyToSelectedLanguage('details', i18nData)}
            </Button>
          }
        </Card.Header>

        <Card.Body>
          {Object.keys(opinion_thread).map((key, index) => {
            if (key === 'show_type' || key === 'show_id' || key === 'title' || key === '_key') {
              return null;
            }
            if (key === 'show') {
              return (
                <Row key={`${opinion_thread._key}_${index}`} className='justify-content-md-center'>
                  <Col xs lg={4} className='object-label' key={`${opinion_thread._key}_label${index}`} >
                    {convertKeyToSelectedLanguage(key, i18nData)}
                  </Col>
                  <Col xs lg={7} key={`${opinion_thread._key}_value${index}`} >
                    <span className='btn btn-link p-0 link-dark' key={`${opinion_thread._key}_show_link_${index}`}
                      onClick={() => navigate(`/${opinion_thread['show_type']}s/${opinion_thread['show_id']}`)}>
                      {opinion_thread[key]}
                    </span>
                  </Col>

                </Row>
              )
            }
            if (key === 'description') {
              return (
                <Row key={`${opinion_thread._key}_${index}`} className='justify-content-md-center mt-1'>
                  <Col xs lg={4} className='object-label' key={`${opinion_thread._key}_label${index}`} >
                    {convertKeyToSelectedLanguage(key, i18nData)}
                  </Col>
                  <Col xs lg={7} key={`${opinion_thread._key}_value${index}`}  >
                    {
                      opinion_thread[key].split('\n').map((textRow, i) => {
                        return (
                          <span key={`desc_row_container_${i}`}>
                            <span key={`desc_row_${i}`}>
                              {textRow}
                            </span>
                            <br />
                          </span>
                        )
                      })
                    }
                  </Col>
                </Row>
              )
            }
            return (
              <Row key={`${opinion_thread._key}_${index}`} className='justify-content-md-center'>
                <Col xs lg={4} className='object-label' key={`${opinion_thread._key}_label${index}`} >
                  {convertKeyToSelectedLanguage(key, i18nData)}
                </Col>
                <Col xs lg={7} key={`${opinion_thread._key}_value${index}`} >
                  {key === 'creation_date' ?
                    convertDateAndTimeToLocale(opinion_thread[key], language)
                    :
                    opinion_thread[key]
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
