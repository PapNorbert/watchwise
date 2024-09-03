import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Stack, Container } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import Ratings from './Ratings'


export default function SerieDetails({ serie, genres }) {
  const { i18nData } = useLanguage();
  const navigate = useNavigate();
  const keysToIgnore = [
    '_key', 'img_name', 'trailer_link', 'storyline', 'name',
    'average_rating', 'sum_of_ratings', 'total_ratings'
  ]

  function handleRating(rating) {
    console.log(rating)
  }

  return (
    <>
      <h1>{serie.name}</h1>

      <Stack direction='horizontal' className='mb-5'>
        <Stack direction='vertical' className='me-4'>
          <img className='cover_img_details corner-borders'
            src={`${process.env.PUBLIC_URL}/covers/${serie.img_name}`} alt={`${serie.title}_cover`} />
          <Ratings handleRating={handleRating} />
        </Stack>
        <Stack direction='vertical' className='mt-5'>
          <Row className='justify-content-md-center'>
            <Col xs lg={8} className='storyline'>
              <div className='border-top border-bottom border-3 border-secondary py-5'>
                {serie.storyline}
              </div>
            </Col>
          </Row>
        </Stack>
      </Stack>

      <Container >
        <Row className='ratio ratio-16x9 trailer' >
          <iframe src={serie.trailer_link} title="YouTube video player"
            allowFullScreen></iframe>
        </Row>
      </Container>

      <Container className='mb-3' >
        <span className='btn-link p-0 link-dark clickable h4' key={`${serie._key}_watch_groups`}
          onClick={() => navigate(`/watch_groups?show=${serie.name}`)}>
          {convertKeyToSelectedLanguage('wg_with_serie', i18nData)}
        </span>
      </Container>
      <Container className='mb-3 mt-3 ' >
        <span className='btn-link p-0 link-dark clickable h4' key={`${serie._key}_opinion_threads`}
          onClick={() => navigate(`/opinion_threads?show=${serie.name}`)}>
          {convertKeyToSelectedLanguage('ot_with_serie', i18nData)}
        </span>
      </Container>

      {genres &&
        genres.map((value, indexNr) => {
          return (
            <Container key={`container_${serie._key}_genres_${indexNr}`} >
              <Row key={`row_${serie._key}_genres_${indexNr}`} className='mb-1'>
                {indexNr === 0 &&
                  <>
                    <h4 className='mt-3'>{convertKeyToSelectedLanguage('genres', i18nData)}</h4>
                    <hr className='short-hr'></hr>
                  </>
                }
              </Row>
              <Row className='big-margin-left'>
                {value.name}
              </Row>
            </Container>
          )
        })
      }

      {Object.keys(serie).map((key, index) => {
        if (keysToIgnore.includes(key)) {
          return null;
        }
        if (Array.isArray(serie[key])) {
          // if value is an array show elements in different rows
          return (
            serie[key].map((value, indexNr) => {
              return (
                <Container key={`container_${serie._key}_${index}_${indexNr}`} >
                  <Row key={`row_${serie._key}_${index}_${indexNr}`} className='mb-1'>
                    {indexNr === 0 &&
                      <>
                        <h4 className='mt-3'>{convertKeyToSelectedLanguage(key, i18nData)}</h4>
                        <hr className='short-hr'></hr>
                      </>
                    }
                  </Row>
                  <Row className='big-margin-left'>
                    {value}
                  </Row>
                </Container>
              )
            })
          );
        }

        return (
          <Container key={`container_${serie._key}_${index}`} >
            <Row key={`${serie._key}_${index}`} className='mb-2'>
              <h4 className='mt-3'>{convertKeyToSelectedLanguage(key, i18nData)}</h4>
              <hr className='short-hr'></hr>
            </Row>
            <Row>
              {key === 'imdb_link' ?
                <a href={serie[key]} className='big-margin-left mb-5'>{serie[key]}</a>
                :
                <span className='big-margin-left'>{serie[key]}</span>}
            </Row>
          </Container>
        );
      })}
    </>
  )
}
