import React, { useState } from 'react'
import { Form, FloatingLabel, Alert, Button, Container, Row, Nav } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import FormContainer from '../../components/FormContainer'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import { postRequest } from '../../axiosRequests/PostAxios'
import useAuth from '../../hooks/useAuth'


export default function WatchGroupsCreate() {
  const { i18nData } = useLanguage();
  const emptyForm = {
    'title': '',
    'show': '',
    'description': '',
    'watch_date': '',
    'location': ''
  }
  const [createdId, setCreatedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [succesfullCreated, setSuccesfullCreated] = useState(false);
  const url = '/api/watch_groups';
  const { auth } = useAuth();
  const navigate = useNavigate();


  function setField(field, value) {
    const newForm = { ...form, [field]: value }
    setForm(newForm); // only changes value of the selected field
    let newErrors = { ...errors }
    if (!value || value === '') {
      newErrors = { ...errors, [field]: `empty_${field}` }
    } else if (errors[field] !== null) {
      newErrors = { ...errors, [field]: null }
    }
    setErrors(newErrors);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    let noErrors = true;
    const newErrors = {}
    for (const [key, value] of Object.entries(form)) {
      if (!value || value === '') {
        newErrors[key] = `empty_${key}`;
        noErrors = false;
      }
    }
    setErrors(newErrors);
    if (noErrors) {
      const formDataWithCreator = { ...form };
      formDataWithCreator['creator'] = auth.username;

      let created = false;
      postRequest(url, formDataWithCreator)
        .then((res) => {
          if (!res.error && res.statusCode === 201) {
            // 201 expected
            setCreatedId(res.data.id);
            created = true;
            // Clear form inputs
            setForm(emptyForm);

          }
          setSubmitError(res.errorMessage);
        })
        .catch((err) => {
          noErrors = false;
          console.log('Error during post request', err.message);
        })
        .finally(() => {
          setSuccesfullCreated(created);
        });
    } else {
      setSuccesfullCreated(false);
    }
  }

  return (
    <FormContainer className='form-container'>
      <Form className='justify-content-md-center mt-5' onSubmit={handleSubmit} >
        <h2 className='text-center'>{convertKeyToSelectedLanguage('create_wg', i18nData)}</h2>

        <FloatingLabel
          label={convertKeyToSelectedLanguage('title', i18nData)} className='mb-3 mt-2' >
          <Form.Control type='text' placeholder={convertKeyToSelectedLanguage('title', i18nData)}
            value={form.title} isInvalid={!!errors.title} autoComplete='off'
            onChange={e => { setField('title', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {convertKeyToSelectedLanguage(errors['title'], i18nData)}
          </Form.Control.Feedback>
        </FloatingLabel>

        <FloatingLabel
          label={convertKeyToSelectedLanguage('show', i18nData)} className='mb-3' >
          <Form.Control type='text' placeholder={convertKeyToSelectedLanguage('show', i18nData)}
            value={form.show} isInvalid={!!errors.show} autoComplete='off'
            onChange={e => { setField('show', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {convertKeyToSelectedLanguage(errors['show'], i18nData)}
          </Form.Control.Feedback>
        </FloatingLabel>

        <Form.Label>
          <b>{convertKeyToSelectedLanguage('description', i18nData)}</b>
        </Form.Label>
        <Form.Control as='textarea' rows={3} className='mb-3'
          placeholder={convertKeyToSelectedLanguage('description', i18nData)}
          value={form.description} isInvalid={!!errors.description} autoComplete='off'
          onChange={e => { setField('description', e.target.value) }} />
        <Form.Control.Feedback type='invalid' className='mb-3'>
          {convertKeyToSelectedLanguage(errors['description'], i18nData)}
        </Form.Control.Feedback>


        <FloatingLabel
          label={convertKeyToSelectedLanguage('watch_date', i18nData)} className='mb-3' >
          <Form.Control type='date' placeholder={convertKeyToSelectedLanguage('watch_date', i18nData)}
            value={form.watch_date} isInvalid={!!errors.watch_date} autoComplete='off'
            onChange={e => { setField('watch_date', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {convertKeyToSelectedLanguage(errors['watch_date'], i18nData)}
          </Form.Control.Feedback>
        </FloatingLabel>

        <FloatingLabel
          label={convertKeyToSelectedLanguage('location', i18nData)} className='mb-3' >
          <Form.Control type='text' placeholder={convertKeyToSelectedLanguage('location', i18nData)}
            value={form.location} isInvalid={!!errors.location} autoComplete='off'
            onChange={e => { setField('location', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {convertKeyToSelectedLanguage(errors['location'], i18nData)}
          </Form.Control.Feedback>
        </FloatingLabel>

        <Alert key='danger' variant='danger' show={submitError !== null}>
          {convertKeyToSelectedLanguage(submitError, i18nData)}
        </Alert>
        <Alert key='success' variant='success' show={succesfullCreated} onClose={() => setSuccesfullCreated(false)} dismissible >
          <Container>
            <Row>
              {convertKeyToSelectedLanguage('ot_succesfull_created', i18nData)}
            </Row>
            <Row className='mx-3'>
              <Nav.Link onClick={() => { navigate(`/watch_groups/${createdId}`) }}>
                {convertKeyToSelectedLanguage('go_to_page', i18nData)}
              </Nav.Link>
            </Row>
          </Container>
        </Alert>

        <Button type='submit' variant='secondary' className='col-md-6 offset-md-3 mb-5'>
          {convertKeyToSelectedLanguage('create', i18nData)}
        </Button>

      </Form>

    </FormContainer>
  )
}
