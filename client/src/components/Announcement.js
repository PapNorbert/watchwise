import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Alert, Popover, OverlayTrigger } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import useAuth from '../hooks/useAuth'
import { deleteRequest } from '../axiosRequests/DeleteAxios'
import { adminRoleCode } from '../config/UserRoleCodes'
import { buttonTypes } from '../config/buttonTypes'
import { convertDateToTimeElapsed } from '../util/dateFormat'

export default function Announcement({ announcement }) {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const { language, i18nData } = useLanguage();
  const [requestError, setRequestError] = useState(null);
  const [visible, setVisible] = useState(true);

  const popover = (
    <Popover>
      <Popover.Header as='h3' className='delete-popover-header'>
        {convertKeyToSelectedLanguage('delete_announcement', i18nData)}
      </Popover.Header>
      <Popover.Body>
        {convertKeyToSelectedLanguage('delete_confirm_announcement', i18nData)}
        <br></br>
        <Button variant='light' className='mx-1 border border-2 my-2 float-end'
          onClick={handleDeleteButtonClicked} >
          {convertKeyToSelectedLanguage('delete', i18nData)}
        </Button>
        <Button variant='light' className='mx-1 border border-2 my-2 float-end'
          onClick={() => document.body.click()} >
          {convertKeyToSelectedLanguage('cancel', i18nData)}
        </Button>
      </Popover.Body>
    </Popover>
  )

  async function handleDeleteButtonClicked(e) {
    const { errorMessage, statusCode } = await deleteRequest(`/api/announcements/${announcement._key}`);
    if (statusCode === 204) {
      // expected when it was deleted
      setVisible(false);
    } else if (statusCode === 401) {
      setAuth({ logged_in: false });
    } else if (statusCode === 403) {
      navigate('/unauthorized');
    } else if (statusCode === 404) {
      setRequestError('404_announcement');
    } else {
      setRequestError(errorMessage);
    }
  }


  return (visible && announcement &&
    <>
      <Card key={`container_${announcement._key}`} className='mt-4 mb-3'>
        <Card.Header key={`header${announcement._key}`} >
          <Card.Title>
            {announcement.title}
            {auth.role === adminRoleCode &&
              <OverlayTrigger trigger='click' placement='bottom' rootClose={true}
                overlay={popover}
              >
                <Button className='btn btn-orange float-end'
                  key={`${announcement._key}_button`}>
                  {convertKeyToSelectedLanguage(buttonTypes.delete, i18nData)}
                </Button>
              </OverlayTrigger>
            }
          </Card.Title>
          <Card.Text>
            {convertDateToTimeElapsed(announcement.creation_date, language)}
          </Card.Text>
        </Card.Header>

        <Card.Body>
          <Card.Text className='ms-5'>
            {convertKeyToSelectedLanguage('dear_users', i18nData)}
          </Card.Text>
          {
            announcement.text.split('\n').map((textRow, i) => {
              return (
                <Card.Text className='ms-3' key={`announcement_row_${i}`}>
                  {textRow}
                </Card.Text>
              )
            })
          }
          <Card.Text className='ms-3'>
            {convertKeyToSelectedLanguage('staff', i18nData)}
          </Card.Text>
        </Card.Body>
      </Card>
      <Alert key='danger' variant='danger' show={requestError !== null}
        onClose={() => setRequestError(null)} dismissible >
        {convertKeyToSelectedLanguage(requestError, i18nData)}
      </Alert>
    </>
  )
}
