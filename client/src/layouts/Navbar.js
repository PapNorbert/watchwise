import React, {useContext} from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Nav, Container, Form } from 'react-bootstrap'

import {LanguageContext} from '../components/LanguageContextProvider'

function Navigationbar() {
  const navigate = useNavigate();

  const {language, setLanguage} = useContext(LanguageContext)

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
          <Form className="d-flex">
            <Form.Select aria-label='Default select example' className='lang-input' 
                onChange={(e) => {setLanguage(e.target.value)}}
                defaultValue={language}>
              <option value='eng'>English</option>
              <option value='hu' >Magyar</option>
            </Form.Select>
          </Form>
        </Container>
    </Navbar>
  )
}

export default Navigationbar;