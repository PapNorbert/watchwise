import React from 'react'
import { Nav } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'


export default function OpinionThreadsTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();
  const { i18nData } = useLanguage();
  const followedRoute = `/opinion_threads/followed/${auth?.userID}`;
  const myGroupsRoute = `/opinion_threads/my_threads/${auth?.userID}`;
  const createRoute = `/opinion_threads/create`;

  return (
    <Nav variant='tabs' defaultActiveKey='/home' className='tabs-nav'
      activeKey={location.pathname}
      onSelect={(selectedKey) => { navigate(selectedKey) }}>
      <Nav.Item>
        <Nav.Link eventKey='/opinion_threads'>
          {convertKeyToSelectedLanguage('all', i18nData)}
        </Nav.Link>
      </Nav.Item>
      {auth.logged_in &&
        <>
          <Nav.Item>
            <Nav.Link eventKey={followedRoute} >
              {convertKeyToSelectedLanguage('followed_threads', i18nData)}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={myGroupsRoute} >
              {convertKeyToSelectedLanguage('my_threads', i18nData)}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={createRoute} >
              {convertKeyToSelectedLanguage('create_ot_short', i18nData)}
            </Nav.Link>
          </Nav.Item>
        </>
      }
    </Nav>
  );
}
