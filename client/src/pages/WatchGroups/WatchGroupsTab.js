import React from 'react'
import { Nav } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'


export default function WatchGroupsTab() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Nav variant="tabs" defaultActiveKey="/home" className='tabs-nav'
      activeKey={location.pathname}
      onSelect={ (selectedKey) =>{navigate(selectedKey)} }>
      <Nav.Item>
        <Nav.Link eventKey="/watch_groups">All</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="/watch_groups/joined">Joined Groups</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="/watch_groups/own">My Groups</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="/watch_groups/create">Create Group</Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

