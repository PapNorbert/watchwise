import React from 'react'
import { Container, Alert, Nav } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'


export default function DeletedSuccesfully({ pagetype }) {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const { i18nData } = useLanguage();

  return (
    <Container className='text-center mt-5 w-50' >
      <Alert variant="success">
        <Alert.Heading>{convertKeyToSelectedLanguage('succesfull_del', i18nData)}</Alert.Heading>
      </Alert>
      <Container className='bold'>
        <Nav.Link onClick={() => { navigate('/'); }} >
          {convertKeyToSelectedLanguage('home', i18nData)}
        </Nav.Link>
        <Nav.Link onClick={() => { navigate('/' + pagetype); }} >
          {convertKeyToSelectedLanguage('cont_browsing_' + pagetype, i18nData)}
        </Nav.Link>
        {auth.logged_in &&
          <Nav.Link onClick={() => { navigate('/' + pagetype + '/create'); }} >
            {convertKeyToSelectedLanguage('create_new_' + pagetype, i18nData)}
          </Nav.Link>
        }
      </Container>
    </Container>
  )
}
