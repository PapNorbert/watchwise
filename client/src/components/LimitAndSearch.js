import React from 'react'
import { Container, Form, Row, Col, Button } from 'react-bootstrap'

import Limit from './Limit'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { querryParamNames } from '../config/querryParams'
import useLanguage from '../hooks/useLanguage'
import useSetMultipleSearchParams from '../hooks/useSetMultipleSearchParams'


export default function LimitAndSearch({ limit, currentNameSearch, setCurrentNameSearch }) {
  const { i18nData } = useLanguage();
  const [setMultipleSearchParams] = useSetMultipleSearchParams();

  function handleSearchButton() {
    setMultipleSearchParams(
      [querryParamNames.name],
      [currentNameSearch],
      [querryParamNames.genres, querryParamNames.page]
    );
  }

  return (
    <Container>
      <Row>
        <Col xs lg={8} >
          <Limit limit={limit} key='limit' />
        </Col>
        <Col xs lg={3} >
          <Form.Control type='text' value={currentNameSearch} onChange={e => setCurrentNameSearch(e.target.value)}
            placeholder={convertKeyToSelectedLanguage('search_name', i18nData)}
            className='dark-border' />
        </Col>
        <Col xs lg={1} >
          <Button className='btn-orange-dark' onClick={handleSearchButton} >
            {convertKeyToSelectedLanguage('search', i18nData)}
          </Button>
        </Col>
      </Row>
      <hr></hr>
    </Container>
  )
}
