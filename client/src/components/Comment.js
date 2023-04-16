import React from 'react'
import { Row, Col, Container } from 'react-bootstrap'
import useAuth from '../hooks/useAuth'

import DeleteIcon from './icons/DeleteIcon'
import EditIcon from './icons/EditIcon'

export default function Comment({ comment }) {
  const { auth } = useAuth();


  function handleDeleteButton() {
    console.log('delete b')
  }
  function handleEditButton() {
    console.log('edit b')
  }

  return (
    <Container className='border border-2 border-secondary rounded mb-3'>
      <Row className='justify-content-md-center mb-1 mt-2'>
        {auth.username !== comment.user ?
          <Col xs lg={10} className='bold' >
            {comment.user}
          </Col> :
          <>
            <Col xs lg={8} className='bold' >
              {comment.user}
            </Col>
            <Col xs lg={1} className='d-flex justify-content-end'>
              <DeleteIcon onClick={handleDeleteButton} />
            </Col>
            <Col xs lg={1} className='d-flex justify-content-end'>
              <EditIcon onClick={handleEditButton} />
            </Col>
          </>
        }
      </Row>
      <Row className='justify-content-md-center'>
        <Col xs lg={3} >
          {comment.creation_date}
        </Col>
        <Col xs lg={8} className='mb-4'>
          {comment.text}
        </Col>
      </Row>
    </Container>
  )
}
