import { React, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Stack, Container } from 'react-bootstrap'
import { Rating } from 'react-simple-star-rating'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'


export default function MovieDetails({ movie, genres }) {
  const { i18nData } = useLanguage();
  const navigate = useNavigate();
  const [rating, setRating] = useState(4);

  const avgRatingMock = 4.89;
  const nrOfRatingsMock = 5326;

  function handleRating(rate) {
    setRating(rate);
  }

  return (
    <>
      <h1>{movie.name}</h1>

      <Stack direction='horizontal' className='mb-5'>
        <Stack direction='vertical' className='me-4'>
          <img className='cover_img_details corner-borders'
            src={`${process.env.PUBLIC_URL}/covers/${movie.img_name}`} alt={`${movie.name}_cover`} />
          <div className='d-flex justify-content-center your-rating mt-1'>
            <span className='mt-1'>Your rating: </span>
            <span className='ms-1'>
              <Rating onClick={handleRating} initialValue={rating} allowFraction transition/>
            </span>
          </div>
          <div className='d-flex justify-content-center watchwise-rating mt-1'>
            <span >WatchWise rating: </span>
            <span className='ms-1'>{avgRatingMock}/5 ({nrOfRatingsMock})</span>
          </div>
        </Stack>
        <Stack direction='vertical' className='mt-5'>
          <Row className='justify-content-md-center'>
            <Col xs lg={8} className='storyline'>
              <div className='border-top border-bottom border-3 border-secondary py-5'>
                {movie.storyline}
              </div>
            </Col>
          </Row>
        </Stack>
      </Stack >

      <Container >
        <Row className='ratio ratio-16x9 trailer' >
          <iframe src={movie.trailer_link} title="YouTube video player"
            allowFullScreen></iframe>
        </Row>
      </Container>

      <Container className='mb-3' >
        <span className='btn-link p-0 link-dark clickable h4' key={`${movie._key}_watch_groups`}
          onClick={() => navigate(`/watch_groups?show=${movie.name}`)}>
          {convertKeyToSelectedLanguage('wg_with_movie', i18nData)}
        </span>
      </Container>
      <Container className='mb-3 mt-3 ' >
        <span className='btn-link p-0 link-dark clickable h4' key={`${movie._key}_opinion_threads`}
          onClick={() => navigate(`/opinion_threads?show=${movie.name}`)}>
          {convertKeyToSelectedLanguage('ot_with_movie', i18nData)}
        </span>
      </Container>

      {
        genres &&
        genres.map((value, indexNr) => {
          return (
            <Container key={`container_${movie._key}_genre_${indexNr}`} >
              <Row key={`row_${movie._key}_genre_${indexNr}`} className='mb-1'>
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

      {
        Object.keys(movie).map((key, index) => {
          if (key === '_key' || key === 'img_name' || key === 'trailer_link'
            || key === 'name' || key === 'storyline') {
            return null;
          }
          if (Array.isArray(movie[key])) {
            // if value is an array show elements in different rows
            return (
              movie[key].map((value, indexNr) => {
                return (
                  <Container key={`container_${movie._key}_${index}_${indexNr}`} >
                    <Row key={`row_${movie._key}_${index}_${indexNr}`} className='mb-1'>
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
            <Container key={`container_${movie._key}_${index}`} >
              <Row key={`${movie._key}_${index}`} className='mb-2'>
                <h4 className='mt-3'>{convertKeyToSelectedLanguage(key, i18nData)}</h4>
                <hr className='short-hr'></hr>
              </Row>
              <Row>
                {key === 'imdb_link' ?
                  <a href={movie[key]} className='big-margin-left mb-5'>{movie[key]}</a>
                  :
                  <span className='big-margin-left'>{movie[key]}</span>}
              </Row>
            </Container>
          );
        })
      }
    </>
  )
}
