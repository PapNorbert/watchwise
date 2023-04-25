import React from 'react'
import { Row, Col, Stack, Container } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'


export default function SerieDetails({ serie, genres }) {
  const { i18nData } = useLanguage();

  return (
    <>
      <h1>{serie.name}</h1>

      <Stack direction='horizontal' className='mb-5'>
        <img className='cover_img_details corner-borders' src={`${process.env.PUBLIC_URL}/covers/${serie.img_name}`} alt={`${serie.title}_cover`} />
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
        if (key === '_key' || key === 'img_name' || key === 'trailer_link'
          || key === 'name' || key === 'storyline') {
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
