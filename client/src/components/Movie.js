import React from 'react'
//import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'

export default function Movie({ movie }) {
  //const navigate = useNavigate();

  const { i18nData } = useLanguage();

  return (
    <Card key={`container_${movie._key}`} className='mt-4 mb-3'>
      <Card.Header as='h5'>
        {movie.title}
        <Button className='btn btn-orange float-end' onClick={() => { }}>
          {convertKeyToSelectedLanguage('details', i18nData)} 
        </Button>
      </Card.Header>

      {Object.keys(movie).map((key, index) => {
        if (key === '_key' || key ==='title') {
          return null;
        }
        return (
          <Row key={`${movie._key}_${index}`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${movie._key}_label${index}`} >
              {convertKeyToSelectedLanguage(key, i18nData)}
            </Col>
            <Col xs lg={7}  key={`${movie._key}_value${index}`} >
              {movie[key]}
            </Col>

          </Row>
        );
      })}
    </Card>
  )
}
