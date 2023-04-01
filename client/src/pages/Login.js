import React, { useContext, useState } from 'react'
import { Form, FloatingLabel, Button, Alert, Nav } from 'react-bootstrap'
import FormContainer from '../components/FormContainer'
import { useNavigate } from 'react-router-dom'

import { LanguageContext } from '../context/LanguageContextProvider'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { postRequest } from '../axiosRequests/PostAxios'


export default function Login() {

  const {i18nData} = useContext(LanguageContext);
  const [form, setForm] = useState({
    'username': '',
    'passwd': ''
  });
  const [errors, setErrors] = useState({});
  // axios post 
  const url ='/api/auth/login'

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
    }

    setErrors(newErrors);
    if( noErrors ) {
      postRequest(url, form)
        .then((res) => {
          if ( !res.error ) {
            console.log('logged in')
            // TODO auth context
          }
          let errorMessage = res.errorMessage;
          if (res.errorMessage === 'login_empty_field_error' 
              || res.errorMessage === 'login_incorrect') {
            errorMessage = convertKeyToSelectedLanguage(res.errorMessage, i18nData);
          } 
          setSubmitError(errorMessage);
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
          <Form.Control.Feedback type='invalid'>
            {errors['passwd']}
          </Form.Control.Feedback>
        </FloatingLabel>


        <Alert key='danger' variant='danger' show={submitError !== null}>
            {submitError}
        </Alert>
        <Button type='submit' variant='secondary' className='col-md-6 offset-md-3'>
          {convertKeyToSelectedLanguage('login', i18nData)}
        </Button>  
        <br />
        <div className='text-center text-muted mt-2'>
            {convertKeyToSelectedLanguage('no_account', i18nData)}
        </div>
        <Nav variant='pills' activeKey='Login' className='mt-2'>
          <Nav.Link eventKey='Login' onClick={() => {navigate('/register')} }  className='col-md-6 offset-md-3 text-center'>
            {convertKeyToSelectedLanguage('register', i18nData)}
          </Nav.Link>   
        </Nav>
        
      </Form>
      
    </FormContainer>
  )
}
