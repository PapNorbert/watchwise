import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

export default function WatchGroup({watch_group}) {

  return (
    <Container className='watch_group mb-4 border rounded' key={`container_${watch_group.ID}`}>
      {Object.keys(watch_group).map((key, index) => {
        if (key === 'ID') {
          return (
            <Row key={`${watch_group.ID}_details`} >
              <Col md={{ offset: 9 }}>
                {watch_group.ID}
              </Col>
            </Row>
          )
        }
        return (
          <Row key={`${watch_group.ID}_${index}`} >
            <Col className='object-label' key={`${watch_group.ID}_label${index}`} >
              {key}
            </Col>
            <Col xs={9} key={`${watch_group.ID}_value${index}`} >
              {watch_group[key]}
            </Col>
            
          </Row>
        );
      })}
    </Container>
  )
}
