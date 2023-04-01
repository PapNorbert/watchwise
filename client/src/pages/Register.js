import React, { useContext, useState } from 'react'
import { Form, FloatingLabel, Button, Alert, Nav } from 'react-bootstrap'
import FormContainer from '../components/FormContainer'
import { useNavigate } from 'react-router-dom'

import { LanguageContext } from '../context/LanguageContextProvider'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { postRequest } from '../axiosRequests/PostAxios'


export default function Register() {
  const {i18nData} = useContext(LanguageContext);
  const [form, setForm] = useState({
    'first_name': '',
    'last_name': '',
    'username': '',
    'passwd': '',
    'passwd_confirm': ''
  });
  const [errors, setErrors] = useState({});
  // axios post 
  const url = '/api/auth/register'
  const [submitError, setSubmitError] = useState(null);
  // navigation
  const navigate = useNavigate();


  function setField(field, value) {
    const newForm = {...form, [field]: value}
    setForm(newForm); // only changes value of the selected field
    let newErrors = {...errors}
    if( !value || value === '' ) {
      newErrors = {...errors, [field]: convertKeyToSelectedLanguage(`empty_${field}`, i18nData)}
    } else if (errors[field] !== null) {
      newErrors = {...errors, [field]: null}
    }
    setErrors(newErrors);
  }

  function handleSubmit(e) {
    e.preventDefault();
    let noErrors = true;
    const newErrors = {}
    for (const [key, value] of Object.entries(form)) {
      if(!value || value === '') {
        newErrors[key] = convertKeyToSelectedLanguage(`empty_${key}`, i18nData);
        noErrors = false;
      }
      if (key === 'passwd') { 
        if ( !value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\-_*!@#$%^&*()<>.,~|:;]{8,}$/gm)) {
          // password must be at least 8 long, with 1 digit, lowercase letter, uppercase letter
          noErrors = false;
          newErrors[key] = convertKeyToSelectedLanguage(`error_passwd`, i18nData);
        }
      }
      if (key === 'passwd_confirm' && value !== form['passwd'] ) {
        noErrors = false;
        newErrors[key] = convertKeyToSelectedLanguage(`match_error_passwd`, i18nData);
      } 
    }

    setErrors(newErrors);
    if( noErrors ) {
      postRequest(url, form)
        .then((res) => {
          if ( !res.error ) {
            navigate('/login');
          }
          setSubmitError(res.errorMessage);
        })
        .catch((err) => {
          console.log('Error during post request', err.message);
        })
    }
  }

  return (
    <FormContainer className='form-container'>
      <Form className='justify-content-md-center mt-5' onSubmit={handleSubmit} >
        <h2 className='text-center'>{convertKeyToSelectedLanguage('registration', i18nData)}</h2>
        <FloatingLabel controlId='floatingFirstNameInput' 
            label={convertKeyToSelectedLanguage('first_name', i18nData)} className='mb-3' >
          <Form.Control type='text' placeholder={convertKeyToSelectedLanguage('first_name', i18nData)}
            value = {form.first_name} isInvalid={errors.first_name}
            onChange={e => { setField('first_name', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {errors['first_name']}
          </Form.Control.Feedback>
        </FloatingLabel>

        <FloatingLabel controlId='floatingLastNameInput' 
            label={convertKeyToSelectedLanguage('last_name', i18nData)} className='mb-3' >
          <Form.Control type='text' placeholder={convertKeyToSelectedLanguage('last_name', i18nData)}
            value = {form.last_name} isInvalid={!!errors.last_name}
            onChange={e => { setField('last_name', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {errors['last_name']}
          </Form.Control.Feedback>
        </FloatingLabel>

        <FloatingLabel  controlId='floatingUsernameInput' 
            label={convertKeyToSelectedLanguage('username', i18nData)} className='mb-3' >
          <Form.Control type='text' placeholder={convertKeyToSelectedLanguage('username', i18nData)}
            value = {form.username} isInvalid={!!errors.username}
            onChange={e => { setField('username', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {errors['username']}
          </Form.Control.Feedback>
        </FloatingLabel>

        <FloatingLabel controlId='floatingPassword' 
            label={convertKeyToSelectedLanguage('passwd', i18nData)} className='mb-3' >
          <Form.Control type='password' placeholder={convertKeyToSelectedLanguage('passwd', i18nData)}
            value = {form.passwd} isInvalid={!!errors.passwd}
            onChange={e => { setField('passwd', e.target.value) }} />
          <Form.Text className='text-muted'>
            {convertKeyToSelectedLanguage('allowed_spec_char', i18nData)}
          </Form.Text>
          <Form.Control.Feedback type='invalid'>
            {errors['passwd']}
          </Form.Control.Feedback>
        </FloatingLabel>

        <FloatingLabel controlId='floatingPasswordConfirm' 
            label={convertKeyToSelectedLanguage('passwd_confirm', i18nData)} className='mb-3'>
          <Form.Control type='password' placeholder={convertKeyToSelectedLanguage('passwd_confirm', i18nData)}
            value = {form.passwd_confirm} isInvalid={!!errors.passwd_confirm}
            onChange={e => { setField('passwd_confirm', e.target.value) }} />
          <Form.Control.Feedback type='invalid'>
            {errors['passwd_confirm']}
          </Form.Control.Feedback>
        </FloatingLabel>

        <Alert key='danger' variant='danger' show={submitError !== null}>
            {submitError}
        </Alert>
        <Button type='submit' variant='secondary' className='col-md-6 offset-md-3' >
          {convertKeyToSelectedLanguage('register', i18nData)}
        </Button>  
        <Nav variant='pills' activeKey='Login' className='mt-2'>
        <Nav.Link eventKey='Login' onClick={() => {navigate('/login')} }  className='col-md-6 offset-md-3 text-center'>
          {convertKeyToSelectedLanguage('login', i18nData)}
        </Nav.Link>   
      </Nav>
      
      </Form>
    </FormContainer>
  )
}
