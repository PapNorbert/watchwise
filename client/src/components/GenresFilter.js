import React from 'react'
import { Container } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'

export default function GenresFilter({ genres, selectedGenres, setSelectedGenres }) {
  const { i18nData } = useLanguage();

  return (
    <Container>
      <Container className='mb-3 bold'>
        {convertKeyToSelectedLanguage('genres', i18nData)}:
      </Container>
      <button key={`filter_button_all`}
        className={'all' === selectedGenres ?
          'btn-filter-selected' : 'btn-filter'}
        onClick={() => setSelectedGenres('all')}
      >
        {convertKeyToSelectedLanguage('all', i18nData)}
      </button>
      {
        genres.map((currentGenre) => {
          return (
            <button key={`filter_button_${currentGenre?._key}`}
              className={currentGenre._key === selectedGenres ?
                'btn-filter-selected' : 'btn-filter'}
              onClick={() => setSelectedGenres(currentGenre?._key)}
            >
              {convertKeyToSelectedLanguage(currentGenre?.name, i18nData)}
            </button>
          )
        })
      }
    </Container>
  )
}
