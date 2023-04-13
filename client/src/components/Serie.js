import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Stack } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'

export default function Serie({ serie }) {
  const navigate = useNavigate();

  const { i18nData } = useLanguage();

  return (
    <Card key={`container_${serie._key}`} className='mt-4 mb-3'>
      <Card.Header as='h5'>
        {serie.title}
        <Button className='btn btn-orange float-end' onClick={() => { navigate(`/series/${serie._key}`) }}>
          {convertKeyToSelectedLanguage('details', i18nData)}
        </Button>
      </Card.Header>


      <Stack direction='horizontal'>
        <img className='cover_img' src={`${process.env.PUBLIC_URL}/covers/${serie.img_name}`} alt={`${serie.title}_cover`} />
        <Stack direction='vertical' className='mt-5'>

          {Object.keys(serie).map((key, index) => {
            if (key === '_key' || key === 'title' || key === 'img_name') {
              return null;
            }
            return (
              <Row key={`${serie._key}_${index}`} className='justify-content-md-center'>
                <Col xs lg={4} className='object-label' key={`${serie._key}_label${index}`} >
                  {convertKeyToSelectedLanguage(key, i18nData)}
                </Col>
                <Col xs lg={7} key={`${serie._key}_value${index}`} >
                  {serie[key]}
                </Col>

              </Row>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  )
}
