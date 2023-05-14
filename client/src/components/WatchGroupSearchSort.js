import React, { useState, useRef } from 'react'
import { Card, Form, Row, Col, Container, Alert, Button } from 'react-bootstrap'
import AsyncSelect from 'react-select/async'

import SearchIcon from './icons/SearchIcon'
import CaretDownIcon from './icons/CaretDownIcon'
import CaretUpIcon from './icons/CaretUpIcon'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { querryParamDefaultValues, querryParamNames } from '../config/querryParams'
import useLanguage from '../hooks/useLanguage'
import useSetMultipleSearchParams from '../hooks/useSetMultipleSearchParams'
import { getAxios } from '../axiosRequests/GetAxios'
import { convertDateWithoutTimeToFormInput } from '../util/dateFormat'
import { maxDistanceDefaultValue } from '../config/maxDistanceDefault'


export default function WatchGroupSearchSort({ currentNameSearch, setCurrentNameSearch, currentShowSearch,
  setCurrentShowSearch, currentCreatorSearch, setCurrentCreatorSearch, currentSortBy, setCurrentSortBy,
  currentWatchDateSearch, setCurrentWatchDateSearch, currentLocationSearch, setCurrentLocationSearch,
  currentMaxDistanceSearch, setCurrentMaxDistanceSearch, locationAvailable = false,
  currentOnlyNotFullGroupsSearch, setCurrentOnlyNotFullGroupsSearch,
  withCreator = true }) {

  const { i18nData } = useLanguage();
  const [setMultipleSearchParams] = useSetMultipleSearchParams();
  const [submitError, setSubmitError] = useState(null);
  const [maxDistanceError, setMaxDistanceError] = useState(null);
  const showSelectRef = useRef();
  const [visible, setVisible] = useState(false);


  function handleSearchButton() {
    const paramNamesToUpdate = []
    const paramValuesToUpdate = []
    const paramNamesToDelete = [querryParamNames.page]

    if (currentNameSearch) {
      paramNamesToUpdate.push(querryParamNames.name);
      paramValuesToUpdate.push(currentNameSearch);
    } else {
      paramNamesToDelete.push(querryParamNames.name);
    }
    if (currentShowSearch) {
      paramNamesToUpdate.push(querryParamNames.show);
      paramValuesToUpdate.push(currentShowSearch);
    } else {
      paramNamesToDelete.push(querryParamNames.show);
    }
    if (currentCreatorSearch) {
      paramNamesToUpdate.push(querryParamNames.creator);
      paramValuesToUpdate.push(currentCreatorSearch);
    } else {
      paramNamesToDelete.push(querryParamNames.creator);
    }
    if (currentWatchDateSearch) {
      paramNamesToUpdate.push(querryParamNames.watchDate);
      paramValuesToUpdate.push(currentWatchDateSearch);
    } else {
      paramNamesToDelete.push(querryParamNames.watchDate);
    }
    if (currentLocationSearch) {
      paramNamesToUpdate.push(querryParamNames.location);
      paramValuesToUpdate.push(currentLocationSearch);
    } else {
      paramNamesToDelete.push(querryParamNames.location);
    }
    if (currentOnlyNotFullGroupsSearch) {
      paramNamesToUpdate.push(querryParamNames.onlyGroupFull);
      paramValuesToUpdate.push(currentOnlyNotFullGroupsSearch);
    } else {
      paramNamesToDelete.push(querryParamNames.onlyGroupFull);
    }

    if (currentMaxDistanceSearch
      // eslint-disable-next-line eqeqeq
      && parseInt(currentMaxDistanceSearch) == currentMaxDistanceSearch
      && parseInt(currentMaxDistanceSearch) >= 1) {
      // distance must be a number at least 1
      paramNamesToUpdate.push(querryParamNames.distance);
      paramValuesToUpdate.push(currentMaxDistanceSearch);
    } else {
      paramNamesToDelete.push(querryParamNames.distance);
      if (currentMaxDistanceSearch) {
        setMaxDistanceError('incorrect_distance');
      } else {
        setMaxDistanceError(null);
      }
    }

    if (currentSortBy) {
      paramNamesToUpdate.push(querryParamNames.sortBy);
      paramValuesToUpdate.push(currentSortBy);
    } else {
      paramNamesToDelete.push(querryParamNames.sortBy);
    }

    if (paramNamesToUpdate.length > 0) {
      setMultipleSearchParams(
        paramNamesToUpdate,
        paramValuesToUpdate,
        paramNamesToDelete
      );
    }
  }

  async function loadShowOptions(inputValue) {
    let url = '/api/shows';
    if (inputValue !== '') {
      url = `/api/shows?nameFilter=${inputValue}`
    }
    const { data, errorMessage, statusCode } = await getAxios(url);
    if (statusCode === 200) {
      const values = []
      data?.shows.forEach(currentShow => {
        values.push({ value: currentShow, label: currentShow })
      });
      return values;
    } else {
      setSubmitError(errorMessage);
    }
  }

  function handleSortByRadioClicked({ target: { value } }) {
    setCurrentSortBy(value);
  }

  function handleClearButtonClicked() {
    setMultipleSearchParams(
      [],
      [],
      [
        querryParamNames.name, querryParamNames.page, querryParamNames.show, querryParamNames.watchDate,
        querryParamNames.creator, querryParamNames.sortBy, querryParamNames.location,
        querryParamNames.distance, querryParamNames.onlyGroupFull
      ]
    )
    setCurrentCreatorSearch(querryParamDefaultValues.creator);
    setCurrentNameSearch(querryParamDefaultValues.name);
    setCurrentShowSearch(querryParamDefaultValues.show);
    if (locationAvailable) {
      setCurrentSortBy(querryParamDefaultValues.WGsortBy);
    } else {
      setCurrentSortBy(querryParamDefaultValues.OTsortBy);
    }
    setCurrentWatchDateSearch(querryParamDefaultValues.watchDate);
    setCurrentLocationSearch(querryParamDefaultValues.location);
    setCurrentMaxDistanceSearch(querryParamDefaultValues.distance);
    setCurrentOnlyNotFullGroupsSearch(querryParamDefaultValues.onlyGroupFull);
    showSelectRef.current.clearValue();
  }

  function setDistance(e) {
    setCurrentMaxDistanceSearch(e.target.value);
    // eslint-disable-next-line eqeqeq
    if (parseInt(e.target.value) == e.target.value
      && parseInt(e.target.value) >= 1) {
      setMaxDistanceError(null);
    }
    else {
      if (e.target.value) {
        setMaxDistanceError('incorrect_distance');
      }
    }
  }

  return (
    <Container>
      <Card className='mb-3 bg-sort-filter'>
        <Card.Title as='h4' className='mx-5 mt-2 search-sort-title' onClick={() => setVisible(!visible)}>
          {convertKeyToSelectedLanguage('search_sort', i18nData)}
          {visible ?
            <span className='float-end' >
              <CaretUpIcon />
            </span>
            :
            <span className='float-end' >
              <CaretDownIcon />
            </span>
          }
        </Card.Title>
        {visible &&
          <Card.Body>
            <Row className='mx-5 search-row'>
              <Col xs lg={{ span: 4, offset: withCreator ? 0 : 1 }} >
                <Form.Text>
                  {convertKeyToSelectedLanguage('search_wg_title', i18nData)}
                </Form.Text>
                <Form.Control type='text' value={currentNameSearch} onChange={e => setCurrentNameSearch(e.target.value)}
                  placeholder={convertKeyToSelectedLanguage('title', i18nData)} />
              </Col>
              <Col xs lg={{ span: 4, offset: 0 }} >
                <Form.Text>
                  {convertKeyToSelectedLanguage('search_show', i18nData)}
                </Form.Text>
                <AsyncSelect cacheOptions loadOptions={loadShowOptions} defaultOptions ref={showSelectRef}
                  isSearchable={true} isClearable={true} defaultInputValue={currentShowSearch}
                  onChange={(newValue) => { setCurrentShowSearch(newValue?.value || '') }}
                  noOptionsMessage={() => convertKeyToSelectedLanguage('no_shows_found', i18nData)}
                  placeholder={convertKeyToSelectedLanguage('show', i18nData)}
                />
              </Col>
              {withCreator &&
                <Col xs lg={{ span: 3, offset: 0 }} >
                  <Form.Text>
                    {convertKeyToSelectedLanguage('search_creator', i18nData)}
                  </Form.Text>
                  <Form.Control type='text' value={currentCreatorSearch} onChange={e => setCurrentCreatorSearch(e.target.value)}
                    placeholder={convertKeyToSelectedLanguage('creator', i18nData)} />
                </Col>
              }

              <Col xs lg={{ offset: withCreator ? 0 : 2 }} className='mt-4' >
                <span onClick={handleSearchButton}>
                  <SearchIcon />
                </span>
              </Col>
            </Row>
            <Row className='mt-2 mx-5 search-row-group-specific justify-content-center ' >
              <Col xs lg={{ span: 3, offset: 0 }} >
                <Form.Text>
                  {convertKeyToSelectedLanguage('search_watch_date', i18nData)}
                </Form.Text>
                <Form.Control type='date' autoComplete='off'
                  value={convertDateWithoutTimeToFormInput(currentWatchDateSearch)}
                  onChange={e => { setCurrentWatchDateSearch(e.target.value) }} />
              </Col>
              <Col xs lg={{ span: 4, offset: 0 }} >
                <Form.Text>
                  {convertKeyToSelectedLanguage('search_max_distance', i18nData)}
                </Form.Text>
                <Form.Control type='number' value={currentMaxDistanceSearch} min={1}
                  onChange={setDistance} isInvalid={!!maxDistanceError}
                  placeholder={maxDistanceDefaultValue} />
                <Form.Control.Feedback type='invalid'>
                  {convertKeyToSelectedLanguage(maxDistanceError, i18nData)}
                </Form.Control.Feedback>
              </Col>
              <Col xs lg={{ span: 4, offset: 0 }} >
                <Form.Text>
                  {convertKeyToSelectedLanguage('search_location', i18nData)}
                </Form.Text>
                <Form.Control type='text' value={currentLocationSearch} onChange={e => setCurrentLocationSearch(e.target.value)}
                  placeholder={convertKeyToSelectedLanguage('location', i18nData)} />
              </Col>
            </Row>
            <Row className='mt-4 mx-5'>
              <Col>
                <Form.Check type='switch' label={convertKeyToSelectedLanguage('search_full', i18nData)}
                  name='search_full' className='mx-3'
                  checked={currentOnlyNotFullGroupsSearch} onChange={e => setCurrentOnlyNotFullGroupsSearch(e.target.checked)} />
              </Col>
            </Row>

            <Row className='mt-3 mx-5 sortByRow'>
              <Col >
                <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_dist', i18nData)}
                  name='sortAttributeRadios' inline className='mx-3' value='distance'
                  checked={currentSortBy === 'distance'} onChange={handleSortByRadioClicked} />

                <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_newest', i18nData)}
                  name='sortAttributeRadios' inline className='mx-3' value='newest'
                  checked={currentSortBy === 'newest'} onChange={handleSortByRadioClicked} />

                <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_oldest', i18nData)}
                  name='sortAttributeRadios' inline className='mx-3' value='oldest'
                  checked={currentSortBy === 'oldest'} onChange={handleSortByRadioClicked} />

                <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_show', i18nData)}
                  name='sortAttributeRadios' inline className='mx-3' value='show'
                  checked={currentSortBy === 'show'} onChange={handleSortByRadioClicked} />

                <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_watch_date', i18nData)}
                  name='sortAttributeRadios' inline className='mx-3' value='watch_date'
                  checked={currentSortBy === 'watch_date'} onChange={handleSortByRadioClicked} />

                <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_wg_title', i18nData)}
                  name='sortAttributeRadios' inline className='mx-3' value='title'
                  checked={currentSortBy === 'title'} onChange={handleSortByRadioClicked} />

                {withCreator &&
                  <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_creator', i18nData)}
                    name='sortAttributeRadios' inline className='mx-3' value='creator'
                    checked={currentSortBy === 'creator'} onChange={handleSortByRadioClicked} />
                }
              </Col>
            </Row>
            <Row className='button-clear'>
              <Col>
                <Button className='btn btn-orange-dark float-end mx-5' onClick={handleClearButtonClicked} >
                  {convertKeyToSelectedLanguage('clear', i18nData)}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        }
      </Card>
      <Alert key='danger' variant='danger' show={submitError !== null} className='mt-3'
        onClose={() => setSubmitError(null)} dismissible >
        {convertKeyToSelectedLanguage(submitError, i18nData)}
      </Alert>
    </Container>
  )
}
