import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Stack } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertBasedOnRatingsToLanguage } from '../i18n/conversion'

export default function Movie({ movie }) {
  const navigate = useNavigate();
  const { i18nData, language } = useLanguage();
  const keysToIgnore = [
    '_key', 'title', 'img_name', 'average_rating', 'total_ratings'
  ]

  return (
    <Card key={`container_${movie._key}`} className='mt-4 mb-3'>
      <Card.Header as='h5'>
        {movie.title}
        <Button className='btn btn-orange float-end' onClick={() => { navigate(`/movies/${movie._key}`) }}>
          {convertKeyToSelectedLanguage('details', i18nData)}
        </Button>
      </Card.Header>
      <Card.Body>
        <Stack direction='horizontal'>
          <img
            className='cover_img'
            src={
              movie.img_name
                ? movie.img_name.includes("http")
                  ? movie.img_name
                  : `${process.env.PUBLIC_URL}/covers/${movie.img_name}`
                : `${process.env.PUBLIC_URL}/covers/cover-placeholder.png`
            }
            alt={`${movie.name}_cover`}
          />
          <Stack direction='vertical' className='mt-5'>

            <Row key={`${movie._key}_rating_row`} className='justify-content-md-center mb-1'>
              <Col xs lg={4} className='object-label' key={`${movie._key}_label_rating`} >
                {convertKeyToSelectedLanguage('ww_rating', i18nData)}:
              </Col>
              <Col xs lg={7} key={`${movie._key}_value_rating`} >
                <span>{movie.average_rating} / 5</span>
                <span className='ms-2'>({convertBasedOnRatingsToLanguage(language, movie.total_ratings, i18nData)})</span>
              </Col>
            </Row>

            {Object.keys(movie).map((key, index) => {
              if (keysToIgnore.includes(key)) {
                return null;
              }
              if (key === 'release_date' || key === 'distributed_by') {
                return (
                  movie[key].map((value, indexNr) => {
                    // value is an array
                    return (
                      <Row key={`${movie._key}_${index}_${indexNr}`} className='justify-content-md-center mb-1'>
                        <Col xs lg={4} className='object-label' key={`${movie._key}_label${index}_${indexNr}`} >
                          {indexNr === 0 && `${convertKeyToSelectedLanguage(key, i18nData)}:`}
                        </Col>
                        <Col xs lg={7} key={`${movie._key}_value${index}_${indexNr}`} >
                          {value}
                        </Col>
                      </Row>
                    )
                  })
                );
              }

              if (key === 'genres') {
                return (
                  <Row key={`${movie._key}_genres`} className='justify-content-md-center'>
                    <Col xs lg={4} className='object-label' key={`${movie._key}_label_genres`} >
                      {convertKeyToSelectedLanguage('genres', i18nData)}:
                    </Col>
                    <Col xs lg={7} key={`${movie._key}_value_genres`} >
                      {movie.genres.map(genre => convertKeyToSelectedLanguage(genre, i18nData)).join(', ')}
                    </Col>
                  </Row>
                );
              }

              return (
                <Row key={`${movie._key}_${index}`} className='justify-content-md-center mb-1'>
                  <Col xs lg={4} className='object-label' key={`${movie._key}_label${index}`} >
                    {convertKeyToSelectedLanguage(key, i18nData)}:
                  </Col>
                  <Col xs lg={7} key={`${movie._key}_value${index}`} >
                    {movie[key]}
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
