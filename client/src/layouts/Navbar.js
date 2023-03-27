import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Nav, Container } from 'react-bootstrap'


function Navigationbar() {
  const navigate = useNavigate();

  return (
    <Navbar bg='customColor' sticky='top'>
      <Container>
        <Navbar.Brand>
          WatchWise
        </Navbar.Brand>
          <Nav className='me-auto'>
            <Nav.Link onClick={() =>{navigate('/');} }>
              Home
              </Nav.Link>
            <Nav.Link onClick={() => {navigate('/watch_groups')} }>Watch Groups</Nav.Link>
          </Nav>
        </Container>

    </Navbar>
  )
}

export default Navigationbar;