import React from 'react'
import { Row } from 'react-bootstrap'


export default function SectionName({ name }) {
  return (
    <Row as='h2' className='section-name'>
      {name}
    </Row>
  )
}
