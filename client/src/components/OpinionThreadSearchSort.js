import React, { useState, useRef } from 'react'
import { Card, Form, Row, Col, Container, Alert, Button } from 'react-bootstrap'
import AsyncSelect from 'react-select/async'

import SearchIcon from './icons/SearchIcon'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { querryParamDefaultValues, querryParamNames } from '../config/querryParams'
import useLanguage from '../hooks/useLanguage'
import useSetMultipleSearchParams from '../hooks/useSetMultipleSearchParams'
import { getAxios } from '../axiosRequests/GetAxios'

export default function OpinionThreadSearchSort({ currentNameSearch, setCurrentNameSearch, currentShowSearch,
  setCurrentShowSearch, currentCreatorSearch, setCurrentCreatorSearch, currentSortBy, setCurrentSortBy,
  withCreator = true }) {

  const { i18nData } = useLanguage();
  const [setMultipleSearchParams] = useSetMultipleSearchParams();
  const [submitError, setSubmitError] = useState(null);
  const showSelectRef = useRef();


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
      [querryParamNames.name, querryParamNames.page, querryParamNames.show,
      querryParamNames.creator, querryParamNames.sortBy]
    )
    setCurrentCreatorSearch(querryParamDefaultValues.creator);
    setCurrentNameSearch(querryParamDefaultValues.name);
    setCurrentShowSearch(querryParamDefaultValues.show);
    setCurrentSortBy(querryParamDefaultValues.sortBy);
    showSelectRef.current.clearValue();
  }

  return (
    <Container>
      <Card className='mb-3 bg-sort-filter'>
        <Card.Title as='h4' className='mx-5 mt-2' >
          {convertKeyToSelectedLanguage('search_sort', i18nData)}
        </Card.Title>
        <Card.Body>
          <Row className='mx-5 search-row'>
            <Col xs lg={{ span: 3, offset: 0 }} >
              <Form.Control type='text' value={currentNameSearch} onChange={e => setCurrentNameSearch(e.target.value)}
                placeholder={convertKeyToSelectedLanguage('search_ot_title', i18nData)} />
            </Col>
            <Col xs lg={{ span: 4, offset: 0 }} >
              <AsyncSelect cacheOptions loadOptions={loadShowOptions} defaultOptions ref={showSelectRef}
                isSearchable={true} isClearable={true} defaultInputValue={currentShowSearch}
                onChange={(newValue) => { setCurrentShowSearch(newValue?.value || '') }}
                noOptionsMessage={() => convertKeyToSelectedLanguage('no_shows_found', i18nData)}
                placeholder={convertKeyToSelectedLanguage('search_show', i18nData)}
              />
            </Col>
            {withCreator &&
              <Col xs lg={{ span: 3, offset: 0 }} >
                <Form.Control type='text' value={currentCreatorSearch} onChange={e => setCurrentCreatorSearch(e.target.value)}
                  placeholder={convertKeyToSelectedLanguage('search_creator', i18nData)} />
              </Col>
            }

            <Col xs lg={{ offset: withCreator ? 1 : 4 }} className='mt-1'>
              <span onClick={handleSearchButton}>
                <SearchIcon />
              </span>
            </Col>
          </Row>
          <Row>
            <Col className='mt-3 mx-5 sortByRow'>
              <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_newest', i18nData)}
                name='sortAttributeRadios' inline className='mx-3' value='newest'
                checked={currentSortBy === 'newest'} onChange={handleSortByRadioClicked} />

              <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_oldest', i18nData)}
                name='sortAttributeRadios' inline className='mx-3' value='oldest'
                checked={currentSortBy === 'oldest'} onChange={handleSortByRadioClicked} />

              <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_show', i18nData)}
                name='sortAttributeRadios' inline className='mx-3' value='show'
                checked={currentSortBy === 'show'} onChange={handleSortByRadioClicked} />

              <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_title', i18nData)}
                name='sortAttributeRadios' inline className='mx-3' value='title'
                checked={currentSortBy === 'title'} onChange={handleSortByRadioClicked} />

              {withCreator &&
                <Form.Check type='radio' label={convertKeyToSelectedLanguage('sort_creator', i18nData)}
                  name='sortAttributeRadios' inline className='mx-3' value='creator'
                  checked={currentSortBy === 'creator'} onChange={handleSortByRadioClicked} />
              }
            </Col>
          </Row>
          <Row>
            <Col>
              <Button className='btn btn-orange-dark float-end mx-5' onClick={handleClearButtonClicked} >
                {convertKeyToSelectedLanguage('clear', i18nData)}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Alert key='danger' variant='danger' show={submitError !== null} className='mt-3'
        onClose={() => setSubmitError(null)} dismissible >
        {convertKeyToSelectedLanguage(submitError, i18nData)}
      </Alert>
    </Container>
  )
}
