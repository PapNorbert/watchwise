import { React, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Stack, Container, Alert } from 'react-bootstrap'

import Ratings from './Ratings'
import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { postRequest } from '../axiosRequests/PostAxios'
import { getAxios } from '../axiosRequests/GetAxios'
import useAuth from '../hooks/useAuth'
import RecommendationCarousel from './recommendation/RecommendationCarousel'
import SectionName from './SectionName'


export default function MovieDetails({ movie, genres, refetch }) {
  const { auth, setAuth } = useAuth();
  const { i18nData } = useLanguage();
  const navigate = useNavigate();
  const [ratingRequestError, setRatingRequestError] = useState(null);
  const keysToIgnore = [
    '_key', 'img_name', 'trailer_link', 'storyline', 'name',
    'average_rating', 'sum_of_ratings', 'total_ratings'
  ]
  const [rating, setRating] = useState(0);
  const [finishedRatingRequest, setFinishedRatingRequest] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [finishedRecommendationsRequest, setFinishedRecommendationsRequest] = useState(false);

  useEffect(() => {
    async function fetchRatingData() {
      const { data, statusCode } = await getAxios(`/api/ratings?show=movies/${movie._key}`);
      if (statusCode === 200 && data) {
        setRating(data);
      }
      setFinishedRatingRequest(true);
    }

    async function fetchRecommendationData() {
      const { data, statusCode } = await getAxios(`/api/recommendations/${movie._key}`);
      if (statusCode === 200 && data) {
        setRecommendations(data);
      }
      setFinishedRecommendationsRequest(true);
    }

    fetchRatingData();
    fetchRecommendationData();
  }, [movie._key]);


  async function handleRating(rating) {
    if (!auth.logged_in) {
      navigate('/login');
      return
    }
    const body = {
      showType: 'movie',
      showKey: movie._key,
      newRating: rating
    }
    const { errorMessage, statusCode } = await postRequest(`/api/ratings`, body);
    if (statusCode === 201) {
      // rating saved
      refetch();
    } else if (statusCode === 204) {
      // rating updated
      refetch();
    } else if (statusCode === 401) {
      setAuth({ logged_in: false });
    } else if (statusCode === 403) {
      navigate('/unauthorized');
    } else if (statusCode === 404) {
      setRatingRequestError('404_rating');
    } else {
      setRatingRequestError(errorMessage);
    }
  }

  return (
    <>
      <h1>{movie.name}</h1>

      <Stack direction='horizontal' className='mb-5'>
        <Stack direction='vertical' className='me-4  image-stack'>
          <img
            className='cover_img_details corner-borders'
            src={
              movie.img_name
                ? movie.img_name.includes("http")
                  ? movie.img_name
                  : `${process.env.PUBLIC_URL}/covers/${movie.img_name}`
                : `${process.env.PUBLIC_URL}/covers/cover-placeholder.png`
            }
            alt={`${movie.name}_cover`}
          />
          {finishedRatingRequest &&
            <Ratings handleRating={handleRating} avgRating={movie.average_rating}
              initialRating={rating} nrOfRatings={movie.total_ratings} />
          }
          <Alert key='danger' variant='danger' show={ratingRequestError !== null}
            onClose={() => setRatingRequestError(null)} dismissible className='mt-1'>
            {convertKeyToSelectedLanguage(ratingRequestError, i18nData)}
          </Alert>
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

      {movie.trailer_link &&
        <Container >
          <Row className='ratio ratio-16x9 trailer' >
            <iframe src={movie.trailer_link} title="YouTube video player"
              allowFullScreen></iframe>
          </Row>
        </Container>
      }

      <Container className='mt-5 mb-5'>
        <SectionName name={convertKeyToSelectedLanguage('links', i18nData)} />
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
      </Container>

      {finishedRecommendationsRequest && recommendations.length > 0 &&
        <Container className='mt-5 mb-5'>
          <SectionName name={convertKeyToSelectedLanguage('similar_shows', i18nData)} />
          <RecommendationCarousel recommendations={recommendations} />
        </Container>
      }

      <Container className='mt-5 mb-5'>
        <SectionName name={convertKeyToSelectedLanguage('details', i18nData)} />
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
            if (keysToIgnore.includes(key)) {
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
      </Container>

    </>
  )
}
