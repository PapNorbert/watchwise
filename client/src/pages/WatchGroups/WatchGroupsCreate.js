import React, { useRef, useState, useEffect } from 'react'
import { Form, FloatingLabel, Alert, Button, Container, Row, Nav } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import AsyncSelect from 'react-select/async'

import FormContainer from '../../components/FormContainer'
import Map from '../../components/Map'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'
import { postRequest } from '../../axiosRequests/PostAxios'
import { getAxios } from '../../axiosRequests/GetAxios'
import useAuth from '../../hooks/useAuth'
import { mapDefaultStartingPosition } from '../../config/mapStartingPos'


export default function WatchGroupsCreate() {
  const { i18nData } = useLanguage();
  const emptyForm = {
    'title': '',
    'show': '',
    'description': '',
    'personLimit': '',
    'watch_date': '',
    'location': ''
  }
  const [selectedPosition, setSelectedPosition] = useState(mapDefaultStartingPosition);
  const showSelectRef = useRef();
  const [createdId, setCreatedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [succesfullCreated, setSuccesfullCreated] = useState(false);
  const { auth, setAuth } = useAuth();
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
    if (field === 'personLimit') {
      // eslint-disable-next-line eqeqeq
      if (parseInt(value) != value || parseInt(value) <= 1) {
        // check if the limit is a number > 1
        newErrors = { ...errors, [field]: `incorrect_${field}` }
      }
    }
    setErrors(newErrors);
  }

  useEffect(() => {
    // update middle position if location of user is available
    navigator.geolocation.getCurrentPosition((position) => {
      setSelectedPosition([
        position.coords.latitude,
        position.coords.longitude
      ]);
    },
      (err) => {
        if (err.code === 1) {
          // user denied location
        } else {
          console.log(err.message);
        }
      }
    );
  }, [setSelectedPosition])

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

  function handleSubmit(e) {
    e.preventDefault();
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    let noErrors = true;
    const newErrors = {}
    for (const [key, value] of Object.entries(form)) {
      if (key !== 'location' && (!value || value === '')) {
        newErrors[key] = `empty_${key}`;
        noErrors = false;
      }
    }
    if (!Array.isArray(selectedPosition)) {
      newErrors['location'] = `incorrect_location`;
      noErrors = false;
    } else
      // location is an array
      if (selectedPosition.length !== 2
        // eslint-disable-next-line eqeqeq
        || parseFloat(selectedPosition[0]) != selectedPosition[0]
        // eslint-disable-next-line eqeqeq
        || parseFloat(selectedPosition[1]) != selectedPosition[1]) {

        newErrors['location'] = `incorrect_location`;
        noErrors = false;
      }
    // eslint-disable-next-line eqeqeq
    if (parseInt(form.personLimit) != form.personLimit || parseInt(form.personLimit) <= 1) {
      // check if the limit is a number > 1
      newErrors['personLimit'] =  `incorrect_personLimit`;
      noErrors = true;
    }

    setErrors(newErrors);
    if (noErrors) {
      const formDataWithCreator = { ...form, location: selectedPosition };
      formDataWithCreator['creator'] = auth.username;

      let created = false;
      postRequest('/api/watch_groups', formDataWithCreator)
        .then((res) => {
          if (!res.error && res.statusCode === 201) {
            // 201 expected
            setCreatedId(res.data.id);
            created = true;
            // Clear form inputs
            showSelectRef.current.clearValue();
            setForm(emptyForm);
            setErrors({});
          } else if (res.statusCode === 401) {
            setAuth({ logged_in: false });
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

        <FloatingLabel
          label={convertKeyToSelectedLanguage('personLimit', i18nData)} className='mb-3 mt-2' >
          <Form.Control type='number' min={2} placeholder={convertKeyToSelectedLanguage('personLimit', i18nData)}
            value={form.personLimit} isInvalid={!!errors.personLimit} autoComplete='off'
            onChange={e => { setField('personLimit', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {convertKeyToSelectedLanguage(errors['personLimit'], i18nData)}
          </Form.Control.Feedback>
        </FloatingLabel>

        <FloatingLabel
          label={convertKeyToSelectedLanguage('watch_date', i18nData)} className='mb-3 mt-3' >
          <Form.Control type='datetime-local' placeholder={convertKeyToSelectedLanguage('watch_date', i18nData)}
            value={form.watch_date} isInvalid={!!errors.watch_date} autoComplete='off'
            min={new Date().toISOString().split('.')[0].slice(0, -3).toString()}
            onChange={e => { setField('watch_date', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {convertKeyToSelectedLanguage(errors['watch_date'], i18nData)}
          </Form.Control.Feedback>
        </FloatingLabel>

        <Form.Label >
          {convertKeyToSelectedLanguage('location', i18nData)}
        </Form.Label>
        <Map editEnabled={true} middlePosition={selectedPosition} setLocation={setSelectedPosition} />
        {!!errors['location'] &&
          <div className='invalid-field' >
            {convertKeyToSelectedLanguage(errors['location'], i18nData)}
          </div>
        }

        <Alert key='danger' variant='danger' show={submitError !== null}
          onClose={() => setSubmitError(null)} dismissible >
          {convertKeyToSelectedLanguage(submitError, i18nData)}
        </Alert>
        <Alert key='success' variant='success' show={succesfullCreated}
          onClose={() => setSuccesfullCreated(false)} dismissible >
          <Container>
            <Row>
              {convertKeyToSelectedLanguage('wg_succesfull_created', i18nData)}
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
