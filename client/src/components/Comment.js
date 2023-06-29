import React, { useState } from 'react'
import { Row, Col, Container, Alert, Form, Button, OverlayTrigger, Popover } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import useAuth from '../hooks/useAuth'
import DeleteIcon from './icons/DeleteIcon'
import EditIcon from './icons/EditIcon'
import { deleteRequest } from '../axiosRequests/DeleteAxios'
import { putRequest } from '../axiosRequests/PutAxios'
import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertDateAndTimeToLocale } from '../i18n/conversion'
import { adminRoleCode, moderatorRoleCode } from '../config/UserRoleCodes'


export default function Comment({ comment, commentLocationType, commentLocationId, commentLocationCreator }) {
  const { auth, setAuth } = useAuth();
  const { language, i18nData } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [commentError, setCommentError] = useState(null);
  const [commentText, setCommentText] = useState(comment.text);
  const [oldCommentText, setOldCommentText] = useState(comment.text);
  const navigate = useNavigate();

  const popover = (
    <Popover>
      <Popover.Header as='h3' className='delete-popover-header'>
        {convertKeyToSelectedLanguage('delete_comment', i18nData)}
      </Popover.Header>
      <Popover.Body>
        {convertKeyToSelectedLanguage('delete_confirm_comment', i18nData)}
        <br></br>
        <Button variant='light' className='mx-1 border border-2 my-2 float-end'
          onClick={handleDeleteButton} >
          {convertKeyToSelectedLanguage('delete', i18nData)}
        </Button>
        <Button variant='light' className='mx-1 border border-2 my-2 float-end'
          onClick={() => document.body.click()} >
          {convertKeyToSelectedLanguage('cancel', i18nData)}
        </Button>
      </Popover.Body>
    </Popover>
  )

  async function handleDeleteButton() {
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    const { error, errorMessage, statusCode } =
      await deleteRequest(`/api/${commentLocationType}/${commentLocationId}/comments/${comment.key}`);
    if (statusCode === 204) {
      setSubmitError(null);
      setVisible(false);
    } else if (statusCode === 401) {
      setAuth({ logged_in: false });
    } else if (statusCode === 403) {
      navigate('/unauthorized');
    }
    if (error) {
      setSubmitError('del_comment_error');
      console.log(errorMessage);
    }
  }

  function handleEditButton() {
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    setEditing(!editing);
  }

  async function handleCommentEditSubmit(e) {
    e.preventDefault();
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    if (commentText === '' || commentText === undefined) {
      setCommentError('empty_comment');
    } else {
      const updateData = {
        text: commentText,
        creator: auth.username
      }
      const { error, errorMessage, statusCode } =
        await putRequest(`/api/${commentLocationType}/${commentLocationId}/comments/${comment.key}`, updateData);
      if (statusCode === 204) {
        setOldCommentText(commentText);
        setCommentError(null);
        setEditing(false);
      } else if (statusCode === 401) {
        setAuth({ logged_in: false });
      } else if (statusCode === 403) {
        navigate('/unauthorized');
      }
      if (error) {
        setCommentError('update_comment_error');
        console.log(errorMessage);
      }

    }
  }


  return (visible &&
    <Container className='border border-2 border-secondary rounded mb-3'>
      <Row className='justify-content-md-center mt-2 username-and-controlls'>
        {/* username and controll buttons */}
        {auth.username !== comment.user ?
          (
            (auth.role === adminRoleCode || auth.role === moderatorRoleCode) ?
              // moderator or admin
              <>
                <Col xs lg={9} className='bold' >
                  {comment.user}
                </Col>
                <Col xs lg={1} className='d-flex justify-content-end'>
                  <OverlayTrigger trigger='click' placement='bottom' rootClose={true}
                    overlay={popover}
                  >
                    <span>
                      <DeleteIcon />
                    </span>
                  </OverlayTrigger>
                </Col>
              </>
              :
              <Col xs lg={10} className='bold' >
                {comment.user}
              </Col>
          )
          :
          <>
            {/* logged in user is the creator of the comment */}
            <Col xs lg={8} className='bold' >
              {comment.user}
            </Col>
            <Col xs lg={1} className='d-flex justify-content-end'>
              <OverlayTrigger trigger='click' placement='bottom' rootClose={true}
                overlay={popover}
              >
                <span>
                  <DeleteIcon />
                </span>
              </OverlayTrigger>
            </Col>
            <Col xs lg={1} className='d-flex justify-content-end'>
              <EditIcon onClick={handleEditButton} />
            </Col>
          </>
        }
      </Row>
      <Row className='justify-content-md-center user-is-creator'>
        {/* user is creator  */}
        <Col xs lg={10} className='is_creator bold' >
          {
            commentLocationCreator &&
            <span className='ms-4'>
              ( creator )
            </span>
          }
        </Col>
      </Row>
      <Row className='justify-content-md-center creation-date-and-text'>
        {/* comment creation date and text */}
        <Col xs lg={3} className='ms-5'>
          {convertDateAndTimeToLocale(comment.creation_date, language)}
        </Col>
        {(editing && auth.logged_in) ?
          <Col xs lg={8} className='mb-4'>
            <Form onSubmit={handleCommentEditSubmit}>
              <Form.Control as='textarea' rows={5} className='mb-2 mt-3'
                value={commentText} isInvalid={!!commentError} autoComplete='off'
                onChange={e => { setCommentText(e.target.value) }}
              />
              <Alert key='danger' variant='danger' show={commentError !== null}
                onClose={() => setCommentError(null)} dismissible >
                {convertKeyToSelectedLanguage(commentError, i18nData)}
              </Alert>
              <Button type='submit' key={`add_edited_comment_${comment.key}`}
                className='insert-button border border-2 btn btn-light float-end mx-2'
                disabled={commentText === '' || commentError === undefined}>
                {convertKeyToSelectedLanguage('save', i18nData)}
              </Button>
              <Button key={`cancel_editing_${comment.key}`}
                className='border border-2 btn btn-light float-end'
                onClick={() => { setCommentText(oldCommentText); setEditing(false); }}>
                {convertKeyToSelectedLanguage('cancel', i18nData)}
              </Button>
            </Form>
          </Col> :
          <Col xs lg={8} className='mb-4'>
            {
              commentText.split('\n').map((textRow, i) => {
                return (
                  <span key={`text_row_container_${i}`}>
                    <span key={`text_row_${i}`}>
                      {textRow}
                    </span>
                    <br />
                  </span>
                )
              })
            }
          </Col>
        }
      </Row>

      <Alert key='danger' variant='danger' show={submitError !== null}
        onClose={() => setSubmitError(null)} dismissible >
        {convertKeyToSelectedLanguage(submitError, i18nData)}
      </Alert>
    </Container >
  )
}
