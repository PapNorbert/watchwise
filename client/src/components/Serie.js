import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Stack } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertBasedOnRatingsToLanguage } from '../i18n/conversion'

export default function Serie({ serie }) {
  const navigate = useNavigate();
  const { i18nData, language } = useLanguage();
  const keysToIgnore = [
    '_key', 'title', 'img_name', 'average_rating', 'total_ratings'
  ]

  return (
    <Card key={`container_${serie._key}`} className='mt-4 mb-3'>
      <Card.Header as='h5'>
        {serie.title}
        <Button className='btn btn-orange float-end' onClick={() => { navigate(`/series/${serie._key}`) }}>
          {convertKeyToSelectedLanguage('details', i18nData)}
        </Button>
      </Card.Header>

      <Card.Body>
        <Stack direction='horizontal'>
          <img className='cover_img' src={`${process.env.PUBLIC_URL}/covers/${serie.img_name}`} alt={`${serie.title}_cover`} />
          <Stack direction='vertical' className='mt-5'>

            <Row key={`${serie._key}_rating_row`} className='justify-content-md-center mb-1'>
              <Col xs lg={4} className='object-label' key={`${serie._key}_label_rating`} >
                {convertKeyToSelectedLanguage('ww_rating', i18nData)}:
              </Col>
              <Col xs lg={7} key={`${serie._key}_value_rating`} >
                <span>{serie.average_rating} / 5</span>
                <span className='ms-2'>({convertBasedOnRatingsToLanguage(language, serie.total_ratings, i18nData)})</span>
              </Col>
            </Row>

            {Object.keys(serie).map((key, index) => {
              if (keysToIgnore.includes(key)) {
                return null;
              }
              if (key === 'genres') {
                return (
                  <Row key={`${serie._key}_genres`} className='justify-content-md-center'>
                    <Col xs lg={4} className='object-label' key={`${serie._key}_label_genres`} >
                      {convertKeyToSelectedLanguage('genres', i18nData)}:
                    </Col>
                    <Col xs lg={7} key={`${serie._key}_value_genres`} >
                      {serie.genres.map(genre => convertKeyToSelectedLanguage(genre, i18nData)).join(', ')}
                    </Col>
                  </Row>
                );
              }

              return (
                <Row key={`${serie._key}_${index}`} className='justify-content-md-center'>
                  <Col xs lg={4} className='object-label' key={`${serie._key}_label${index}`} >
                    {convertKeyToSelectedLanguage(key, i18nData)}:
                  </Col>
                  <Col xs lg={7} key={`${serie._key}_value${index}`} >
                    {serie[key]}
                  </Col>
                </Row>
              );
            })}

          </Stack>
        </Stack>
      </Card.Body>
    </Card>
  )
}
