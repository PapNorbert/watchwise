import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import useAuth from '../hooks/useAuth'
import { postRequest } from '../axiosRequests/PostAxios'

export default function WatchGroup({ watch_group, buttonType, removeOnLeave = false, refetch }) {
  // watch_group - group doc, buttonType - leave / join group, 
  // removeOnLeave - remove element on leave event, refetch the groups

  const navigate = useNavigate();
  const { auth } = useAuth();
  const { i18nData } = useLanguage();


  async function handleButtonClicked(e) {
    if (e.target.textContent === convertKeyToSelectedLanguage('join', i18nData)
      || e.target.textContent === convertKeyToSelectedLanguage('leave', i18nData)) {
      const { errorMessage, statusCode } = await postRequest(`/api/watch_groups/${watch_group._key}/joines`);

      if (statusCode === 204) {
        // expected when edge was deleted
        e.target.textContent = convertKeyToSelectedLanguage('join', i18nData);
        if (removeOnLeave) {
          refetch();
        }
      } else if (statusCode === 201) {
        // expected when edge was created
        e.target.textContent = convertKeyToSelectedLanguage('leave', i18nData);
      } else if (statusCode === 404) {
        console.log('not found');
      } else {
        // error
        console.log(errorMessage);
      }
    }
  }

  return (
    <Card key={`container_${watch_group._key}`} className='mt-4 mb-3'>
      <Card.Header as='h5' key={`header${watch_group._key}`} >
        {watch_group.title}
        {auth.logged_in &&
          <Button className='btn btn-orange float-end' onClick={handleButtonClicked} key={`${watch_group._key}button`}>
            {convertKeyToSelectedLanguage(buttonType, i18nData)}
          </Button>
        }
      </Card.Header>

      {Object.keys(watch_group).map((key, index) => {
        if (key === 'show_type' || key === 'show_id' || key === 'title' || key === '_key') {
          return null;
        }
        if (key === 'show') {
          return (
            <Row key={`${watch_group._key}_${index}`} className='justify-content-md-center'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label${index}`} >
                {convertKeyToSelectedLanguage(key, i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value${index}`}  >
                <span className='btn btn-link p-0 link-dark' key={`${watch_group._key}_show_link_${index}`}
                  onClick={() => navigate(`/${watch_group['show_type']}s/${watch_group['show_id']}`)}>
                  {watch_group[key]}
                </span>
              </Col>

            </Row>
          )
        }
        return (
          <Row key={`${watch_group._key}_${index}`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${watch_group._key}_label${index}`} >
              {convertKeyToSelectedLanguage(key, i18nData)}
            </Col>
            <Col xs lg={7} key={`${watch_group._key}_value${index}`} >
              {watch_group[key]}
            </Col>

          </Row>
        );
      })}
    </Card>
  )
}
