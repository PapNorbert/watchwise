import React from 'react'
import { Nav } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'

import useAuth from '../../hooks/useAuth'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'


export default function UsersTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();
  const { i18nData } = useLanguage();


  return (auth.logged_in &&
    <Nav variant='tabs' defaultActiveKey='/home' className='tabs-nav'
      activeKey={location.pathname}
      onSelect={(selectedKey) => { navigate(selectedKey) }}>
      <Nav.Item>
        <Nav.Link eventKey='/users'>
          {convertKeyToSelectedLanguage('all', i18nData)}
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey='/users/moderators'>
          {convertKeyToSelectedLanguage('moderators', i18nData)}
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey='/users/moderator_request'>
          {convertKeyToSelectedLanguage('mod_req', i18nData)}
        </Nav.Link>
      </Nav.Item>

    </Nav>
  );
}
