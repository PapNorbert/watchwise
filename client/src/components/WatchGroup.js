import React from 'react'
//import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'

export default function WatchGroup({ watch_group, buttonType }) {
  //const navigate = useNavigate();

  const { i18nData } = useLanguage();

  return (
    <Card key={`container_${watch_group._key}`} className='mt-4 mb-3'>
      <Card.Header as='h5'>
        {watch_group.title}
        <Button className='btn btn-orange float-end' onClick={() => { }}>
          {convertKeyToSelectedLanguage(buttonType, i18nData)}
        </Button>
      </Card.Header>

      {Object.keys(watch_group).map((key, index) => {
        if (key === 'show_type' || key === 'show_id' || key === 'title' || key === 'key') {
          return null;
        }
        if (key === 'show') {
          return (
            <Row key={`${watch_group._key}_${index}`} className='justify-content-md-center'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label${index}`} >
                {convertKeyToSelectedLanguage(key, i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value${index}`}  >
                {watch_group[key]}
              </Col>

            </Row>
          )
        }
        return (
          <Row key={`${watch_group._key}_${index}`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${watch_group._key}_label${index}`} >
              {convertKeyToSelectedLanguage(key, i18nData)}
            </Col>
            <Col xs lg={7} key={`${watch_group._key}_value${index}`} >
              {watch_group[key]}
            </Col>

          </Row>
        );
      })}
    </Card>
  )
}
