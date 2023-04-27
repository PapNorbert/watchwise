import React from 'react'
import { Container, Nav } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'

export default function UnauthorizedPage() {
  const { i18nData } = useLanguage();
  const navigate = useNavigate();


  return (
    <Container className='text-center'>
      <h2 className='error'>
        {convertKeyToSelectedLanguage('unauth_page_acces', i18nData)}
      </h2>
      <Container className='bold'>
        <Nav.Link onClick={() => { navigate('/'); }} >
          {convertKeyToSelectedLanguage('home', i18nData)}
        </Nav.Link>
        <Nav.Link onClick={() => { navigate('/watch_groups' ); }} >
          {convertKeyToSelectedLanguage('cont_browsing_watch_groups', i18nData)}
        </Nav.Link>
        <Nav.Link onClick={() => { navigate('/opinion_threads' ); }} >
          {convertKeyToSelectedLanguage('cont_browsing_opinion_threads', i18nData)}
        </Nav.Link>
      </Container>
    </Container>
  )
}
