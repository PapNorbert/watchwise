import React from 'react'
import { Nav } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth';


export default function OpinionThreadsTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();
  const joinedRoute = `/opinion_threads/followed/${auth?.userID}`
  const myGroupsRoute = `/opinion_threads/my_threads/${auth?.userID}`
  const createRoute = `/opinion_threads/create`

  return (
    <Nav variant='tabs' defaultActiveKey='/home' className='tabs-nav'
      activeKey={location.pathname}
      onSelect={(selectedKey) => { navigate(selectedKey) }}>
      <Nav.Item>
        <Nav.Link eventKey='/opinion_threads'>All</Nav.Link>
      </Nav.Item>
      {auth.logged_in &&
        <>
          <Nav.Item>
            <Nav.Link eventKey={joinedRoute} >Followed Threads</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={myGroupsRoute} >My Threads</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={createRoute} >Create Opinion Thread</Nav.Link>
          </Nav.Item>
        </>
      }
    </Nav>
  );
}
