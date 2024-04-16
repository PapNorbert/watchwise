import React, { useState } from 'react'
import { Form, Button, Row, Alert, Container, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import FormContainer from '../components/FormContainer'
import useLanguage from '../hooks/useLanguage'
import useAuth from '../hooks/useAuth';
import { postRequest } from '../axiosRequests/PostAxios'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { adminRoleCode, moderatorRoleCode, userRoleCode } from '../config/UserRoleCodes'



export default function ModeratorRequestCreatePage() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { i18nData } = useLanguage();
  const [reqDescription, setReqDescription] = useState('');
  const [reqDescriptionError, setReqDescriptionError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [succesfullCreated, setSuccesfullCreated] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    if (!reqDescription || reqDescription === '') {
      setReqDescriptionError(`empty_req_description`);
      setSuccesfullCreated(false);
    } else {
      const dataWithCreator = { description: reqDescription };
      dataWithCreator['creator'] = auth.username;
      dataWithCreator['creator_key'] = auth.userID;

      let created = false;
      postRequest('/api/moderator_requests', dataWithCreator)
        .then((res) => {
          if (!res.error && res.statusCode === 201) {
            // 201 expected
            created = true;
            // Clear form inputs
            setReqDescription('');
            setReqDescriptionError(null);
          }
          setSubmitError(res.errorMessage);
        })
        .catch((err) => {
          console.log('Error during post request', err.message);
        })
        .finally(() => {
          setSuccesfullCreated(created);
        });
    }
  }

  return (
    <>
      <h2 className='text-center'>
        {convertKeyToSelectedLanguage('create_mod_req', i18nData)}
      </h2>
      {auth.role === userRoleCode &&
        <FormContainer className='form-container'>
          <Form className='justify-content-md-center mt-5' onSubmit={handleSubmit} >
            <Form.Label className='mt-3'>
              {convertKeyToSelectedLanguage('req_text', i18nData)}
            </Form.Label>
            <Form.Control as='textarea' rows={4}
              placeholder={convertKeyToSelectedLanguage('req_description', i18nData)}
              value={reqDescription} isInvalid={!!reqDescriptionError} autoComplete='off'
              onChange={e => { setReqDescription(e.target.value) }} />
            <Form.Control.Feedback type='invalid' >
              {convertKeyToSelectedLanguage(reqDescriptionError, i18nData)}
            </Form.Control.Feedback>

            <Alert key='danger' variant='danger' show={submitError !== null} className='mt-3'
              onClose={() => setSubmitError(null)} dismissible >
              {convertKeyToSelectedLanguage(submitError, i18nData)}
            </Alert>
            <Alert key='success' variant='success' show={succesfullCreated} className='mt-3'
              onClose={() => setSuccesfullCreated(false)} dismissible >
              <Container>
                <Row>
                  {convertKeyToSelectedLanguage('req_succesfull_created', i18nData)}
                </Row>
                <Row className='mx-3'>
                  <Nav.Link onClick={() => { navigate('/'); }} >
                    {convertKeyToSelectedLanguage('home', i18nData)}
                  </Nav.Link>
                  <Nav.Link onClick={() => { navigate('/watch_groups'); }} >
                    {convertKeyToSelectedLanguage('cont_browsing_watch_groups', i18nData)}
                  </Nav.Link>
                  <Nav.Link onClick={() => { navigate('/opinion_threads'); }} >
                    {convertKeyToSelectedLanguage('cont_browsing_opinion_threads', i18nData)}
                  </Nav.Link>
                </Row>
              </Container>
            </Alert>

            <Button type='submit' variant='secondary' className='col-md-6 offset-md-3 mb-5 mt-3'>
              {convertKeyToSelectedLanguage('create', i18nData)}
            </Button>
          </Form>
        </FormContainer>
      }
      {auth.role === adminRoleCode &&
        <h3>{convertKeyToSelectedLanguage('admin_user', i18nData)}</h3>
      }
      {auth.role === moderatorRoleCode &&
        <h3>{convertKeyToSelectedLanguage('already_mod', i18nData)}</h3>
      }
    </>
  )
}
