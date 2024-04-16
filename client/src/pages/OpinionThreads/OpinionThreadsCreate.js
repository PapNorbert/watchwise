import React, { useState, useRef } from 'react'
import { Form, FloatingLabel, Alert, Button, Container, Row, Nav } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import AsyncSelect from 'react-select/async'

import FormContainer from '../../components/FormContainer'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import { postRequest } from '../../axiosRequests/PostAxios'
import { getAxios } from '../../axiosRequests/GetAxios'
import useAuth from '../../hooks/useAuth'


export default function OpinionThreadsCreate() {
  const { i18nData } = useLanguage();
  const emptyForm = {
    'title': '',
    'show': '',
    'description': '',
    'tags': ''
  }
  const showSelectRef = useRef();
  const [createdId, setCreatedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [succesfullCreated, setSuccesfullCreated] = useState(false);
  const { auth } = useAuth();
  const navigate = useNavigate();


  async function loadShowOptions(inputValue) {
    let url = '/api/shows';
    if (inputValue !== '') {
      url = `/api/shows?nameFilter=${inputValue}`
    }
    const { data, errorMessage, statusCode } = await getAxios(url);
    if (statusCode === 200) {
      const values = []
      data?.shows.forEach(currentShow => {
        values.push({ value: currentShow, label: currentShow })
      });
      return values;
    } else {
      setSubmitError(errorMessage);
    }
  }

  async function loadTagOptions(inputValue) {
    let url = '/api/tags';
    if (inputValue !== '') {
      url = `/api/tags?nameFilter=${inputValue}`
    }
    const { data, errorMessage, statusCode } = await getAxios(url);
    if (statusCode === 200) {
      const values = []
      data?.tags.forEach(currentTag => {
        values.push({ value: currentTag, label: currentTag })
      });
      return values;
    } else {
      setSubmitError(errorMessage);
    }
  }

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
    if (form.tags && form.tags.split(',').length < 2) {
      newErrors['tags'] = `empty_tags`;
      noErrors = false;
    }
    setErrors(newErrors);
    if (noErrors) {
      const formDataWithCreator = { ...form };
      formDataWithCreator['creator'] = auth.username;

      let created = false;
      postRequest('/api/opinion_threads', formDataWithCreator)
        .then((res) => {
          if (!res.error && res.statusCode === 201) {
            // 201 expected
            setCreatedId(res.data.id);
            created = true;
            // Clear form inputs
            showSelectRef.current.clearValue();
            setForm(emptyForm);
            setErrors({});
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
        <h2 className='text-center'>{convertKeyToSelectedLanguage('create_ot', i18nData)}</h2>

        <FloatingLabel
          label={convertKeyToSelectedLanguage('title', i18nData)} className='mb-3 mt-2' >
          <Form.Control type='text' placeholder={convertKeyToSelectedLanguage('title', i18nData)}
            value={form.title} isInvalid={!!errors.title} autoComplete='off'
            onChange={e => { setField('title', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {convertKeyToSelectedLanguage(errors['title'], i18nData)}
          </Form.Control.Feedback>
        </FloatingLabel>

        <Form.Label>
          {convertKeyToSelectedLanguage('show', i18nData)}
        </Form.Label>
        <AsyncSelect cacheOptions loadOptions={loadShowOptions} defaultOptions
          isSearchable={true} isClearable={true} ref={showSelectRef}
          onChange={(newValue) => { setField('show', newValue?.value || '') }}
          noOptionsMessage={() => convertKeyToSelectedLanguage('no_shows_found', i18nData)}
          placeholder={convertKeyToSelectedLanguage('show', i18nData)}
        />
        {!!errors['show'] &&
          <div className='invalid-field' >
            {convertKeyToSelectedLanguage(errors['show'], i18nData)}
          </div>
        }

        <Form.Label>
          {convertKeyToSelectedLanguage('tags', i18nData)}
        </Form.Label>
        <AsyncSelect cacheOptions loadOptions={loadTagOptions} defaultOptions
          isSearchable={true} isClearable={true} ref={showSelectRef} isMulti
          onChange={(newValue) => {
            setField('tags',
              newValue.map(selectedTag => { return selectedTag.value }).join(',') || '')
          }}
          noOptionsMessage={() => convertKeyToSelectedLanguage('no_tags_found', i18nData)}
          placeholder={convertKeyToSelectedLanguage('tags', i18nData)}
        />
        {!!errors['tags'] &&
          <div className='invalid-field' >
            {convertKeyToSelectedLanguage(errors['tags'], i18nData)}
          </div>
        }

        <Form.Label className='mt-3'>
          {convertKeyToSelectedLanguage('description', i18nData)}
        </Form.Label>
        <Form.Control as='textarea' rows={3}
          placeholder={convertKeyToSelectedLanguage('description', i18nData)}
          value={form.description} isInvalid={!!errors.description} autoComplete='off'
          onChange={e => { setField('description', e.target.value) }} />
        <Form.Control.Feedback type='invalid' >
          {convertKeyToSelectedLanguage(errors['description'], i18nData)}
        </Form.Control.Feedback>

        <Alert key='danger' variant='danger' show={submitError !== null} className='mt-3'
          onClose={() => setSubmitError(null)} dismissible >
          {convertKeyToSelectedLanguage(submitError, i18nData)}
        </Alert>
        <Alert key='success' variant='success' show={succesfullCreated} className='mt-3'
          onClose={() => setSuccesfullCreated(false)} dismissible >
          <Container>
            <Row>
              {convertKeyToSelectedLanguage('ot_succesfull_created', i18nData)}
            </Row>
            <Row className='mx-3'>
              <Nav.Link onClick={() => { navigate(`/opinion_threads/${createdId}`) }}>
                {convertKeyToSelectedLanguage('go_to_page', i18nData)}
              </Nav.Link>
            </Row>
          </Container>
        </Alert>

        <Button type='submit' variant='secondary' className='col-md-6 offset-md-3 mb-5 mt-3'>
          {convertKeyToSelectedLanguage('create', i18nData)}
        </Button>

      </Form>

    </FormContainer>
  )
}
