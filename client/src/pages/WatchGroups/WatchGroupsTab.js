import React from 'react'
import { Nav } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import useLanguage from '../../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../../i18n/conversion'


export default function WatchGroupsTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();
  const { i18nData } = useLanguage();
  const joinedRoute = `/watch_groups/joined/${auth?.userID}`
  const myGroupsRoute = `/watch_groups/my_groups/${auth?.userID}`
  const joinReqRoute = `/watch_groups/my_groups/join_requests`
  const createRoute = `/watch_groups/create`

  return (
    <Nav variant='tabs' defaultActiveKey='/home' className='tabs-nav'
      activeKey={location.pathname}
      onSelect={(selectedKey) => { navigate(selectedKey) }}>
      <Nav.Item>
        <Nav.Link eventKey='/watch_groups'>
          {convertKeyToSelectedLanguage('all', i18nData)}
        </Nav.Link>
      </Nav.Item>
      {auth.logged_in &&
        <>
          <Nav.Item>
            <Nav.Link eventKey={joinedRoute} >
              {convertKeyToSelectedLanguage('joined_groups', i18nData)}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={myGroupsRoute} >
              {convertKeyToSelectedLanguage('my_groups', i18nData)}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={joinReqRoute} >
              {convertKeyToSelectedLanguage('join_req', i18nData)}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={createRoute} >
              {convertKeyToSelectedLanguage('create_wg_short', i18nData)}
            </Nav.Link>
          </Nav.Item>
        </>
      }
    </Nav>
  );
}

