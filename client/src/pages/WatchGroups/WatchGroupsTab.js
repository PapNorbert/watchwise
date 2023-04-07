import React from 'react'
import { Nav } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth';


export default function WatchGroupsTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();

  const joinedRoute = `/watch_groups/joined/${auth?.userID}`
  const myGroupsRoute = `/watch_groups/my_groups/${auth?.username}`
  const createRoute = `/watch_groups/create`

  return (
    <Nav variant='tabs' defaultActiveKey='/home' className='tabs-nav'
      activeKey={location.pathname}
      onSelect={(selectedKey) => { navigate(selectedKey) }}>
      <Nav.Item>
        <Nav.Link eventKey='/watch_groups'>All</Nav.Link>
      </Nav.Item>
      {auth.logged_in &&
        <>
          <Nav.Item>
            <Nav.Link eventKey={joinedRoute} >Joined Groups</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={myGroupsRoute} >My Groups</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={createRoute} >Create Group</Nav.Link>
          </Nav.Item>
        </>
      }
    </Nav>
  );
}

