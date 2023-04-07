import React, { useState } from 'react'
import { Form, FloatingLabel, Button, Alert, Nav } from 'react-bootstrap'
import FormContainer from '../components/FormContainer'
import { useNavigate, useLocation } from 'react-router-dom'

import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { postRequest } from '../axiosRequests/PostAxios'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import decodeJwtAccesToken from '../cookie/decodeJwt'

export default function Login() {

  const { i18nData } = useLanguage();
  const [form, setForm] = useState({
    'username': '',
    'passwd': ''
  });
  const [errors, setErrors] = useState({});
  // axios post 
  const url = '/api/auth/login'

  const [submitError, setSubmitError] = useState(null);
  // navigation
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';


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
      postRequest(url, form)
        .then((res) => {
          if (!res.error && res.statusCode === 200) {
            // logged in succesfully, 200 expected
            setAuth(decodeJwtAccesToken(res.data.accesToken));
            navigate(from, { replace: true });
          } else {
            let errorMessage = res.errorMessage;
            if (res.errorMessage === 'login_empty_field_error'
              || res.errorMessage === 'login_incorrect') {
              errorMessage = res.errorMessage;
            }
            setSubmitError(errorMessage);
          }

        })
        .catch((err) => {
          console.log('Error during post request', err.message);
        })
    }
  }


  return (
    <FormContainer className='form-container'>
      <Form className='justify-content-md-center mt-5 col-md-6 offset-md-3' onSubmit={handleSubmit} >
        <h2 className='text-center'>{convertKeyToSelectedLanguage('login', i18nData)}</h2>

        <FloatingLabel controlId='floatingUsernameInput'
          label={convertKeyToSelectedLanguage('username', i18nData)} className='mb-3' >
          <Form.Control type='text' placeholder={convertKeyToSelectedLanguage('username', i18nData)}
            value={form.username} isInvalid={!!errors.username} autoComplete='off'
            onChange={e => { setField('username', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {convertKeyToSelectedLanguage(errors['username'], i18nData)}
          </Form.Control.Feedback>
        </FloatingLabel>

        <FloatingLabel controlId='floatingPassword'
          label={convertKeyToSelectedLanguage('passwd', i18nData)} className='mb-3' >
          <Form.Control type='password' placeholder={convertKeyToSelectedLanguage('passwd', i18nData)}
            value={form.passwd} isInvalid={!!errors.passwd} autoComplete='off'
            onChange={e => { setField('passwd', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {convertKeyToSelectedLanguage(errors['passwd'], i18nData)}
          </Form.Control.Feedback>
        </FloatingLabel>


        <Alert key='danger' variant='danger' show={submitError !== null}>
          {convertKeyToSelectedLanguage(submitError, i18nData)}
        </Alert>
        <Button type='submit' variant='secondary' className='col-md-6 offset-md-3 '>
          {convertKeyToSelectedLanguage('login', i18nData)}
        </Button>
        <br />
        <div className='text-center text-muted mt-2'>
          {convertKeyToSelectedLanguage('no_account', i18nData)}
        </div>
        <Nav variant='pills' activeKey='Login' className='mt-2'>
          <Nav.Link eventKey='Login' onClick={() => { navigate('/register') }} className='col-md-6 offset-md-3 text-center '>
            {convertKeyToSelectedLanguage('register', i18nData)}
          </Nav.Link>
        </Nav>

      </Form>

    </FormContainer>
  )
}
