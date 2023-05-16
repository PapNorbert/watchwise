import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Nav, Container, Form, NavDropdown } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import useAuth from '../hooks/useAuth'
import { getAxios } from '../axiosRequests/GetAxios'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { adminRoleCode } from '../config/UserRoleCodes'


function Navigationbar() {
  const navigate = useNavigate();

  const { language, setLanguage, i18nData } = useLanguage();
  const { auth, setAuth } = useAuth();

  function logout() {
    getAxios('/api/auth/logout')
      .then((response) => {
        if (response.statusCode === 204) {
          setAuth({ logged_in: false });
          navigate('/');
        }
      })
      .catch((err) => {
        console.log(err);
      })
  }

  return (
    <Navbar collapseOnSelect expand='md' bg='customColor' sticky='top' >
      <Container fluid className='mx-5'>
        <Navbar.Brand>
          WatchWise
        </Navbar.Brand>

        <Navbar.Toggle aria-controls='navbar-nav' />
        <Navbar.Collapse id='navbar-nav'>
          <Nav className='me-auto'>
            <Nav.Link eventKey='home' onClick={() => { navigate('/'); }}>
              {convertKeyToSelectedLanguage('home', i18nData)}
            </Nav.Link>
            <Nav.Link eventKey='watch_groups' onClick={() => { navigate('/watch_groups') }}>
              {convertKeyToSelectedLanguage('watch_groups', i18nData)}
            </Nav.Link>
            <Nav.Link eventKey='opinion_threads' onClick={() => { navigate('/opinion_threads') }}>
              {convertKeyToSelectedLanguage('opinion_threads', i18nData)}
            </Nav.Link>
            <Nav.Link eventKey='movies' onClick={() => { navigate('/movies') }}>
              {convertKeyToSelectedLanguage('movies', i18nData)}
            </Nav.Link>
            <Nav.Link eventKey='series' onClick={() => { navigate('/series') }}>
              {convertKeyToSelectedLanguage('series', i18nData)}
            </Nav.Link>
            {
              auth.logged_in && auth?.role === adminRoleCode &&
              <Nav.Link className='me-4' onClick={() => { navigate('/users') }}>
                {convertKeyToSelectedLanguage('users', i18nData)}
              </Nav.Link>
            }
          </Nav>
        </Navbar.Collapse>

        {!auth.logged_in &&
          <>
            <Nav.Link className='me-4' onClick={() => { navigate('/login',) }}>
              {convertKeyToSelectedLanguage('login', i18nData)}
            </Nav.Link>
            <Nav.Link className='me-4' onClick={() => { navigate('/register') }}>
              {convertKeyToSelectedLanguage('register', i18nData)}
            </Nav.Link>
          </>
        }
        {
          auth.logged_in &&
          <>
            <Navbar.Text className='me-1'>
              {convertKeyToSelectedLanguage('logged_in_as', i18nData)}
            </Navbar.Text>
            <NavDropdown title={auth.username} className='me-4'>
              <NavDropdown.Item onClick={logout}>
                {convertKeyToSelectedLanguage('log_out', i18nData)}
              </NavDropdown.Item>
            </NavDropdown>
          </>
        }

        <Form className='d-flex'>
          <Form.Select aria-label='Default select example' className='lang-select'
            onChange={(e) => { setLanguage(e.target.value) }}
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