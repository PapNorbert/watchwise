import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Container, Form, Alert, OverlayTrigger, Popover } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertDateAndTimeToLocale, convertDateToLocale } from '../i18n/conversion'
import { convertDateToFromInput } from '../util/dateFormat'
import useAuth from '../hooks/useAuth'
import { postRequest } from '../axiosRequests/PostAxios'
import Limit from '../components/Limit'
import PaginationElements from '../components/PaginationElements'
import Comment from '../components/Comment'
import { buttonTypes } from '../util/buttonTypes'
import { deleteRequest } from '../axiosRequests/DeleteAxios'
import { putRequest } from '../axiosRequests/PutAxios'
import DeletedSuccesfully from './DeletedSuccesfully'


export default function WatchGroupDetails({ watch_group, buttonType, setUrl, totalPages, refetch }) {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { language, i18nData } = useLanguage();
  const [insertCommentError, setInsertCommentError] = useState(null);
  const [insertCommentText, setInsertCommentText] = useState('');
  const [descriptionError, setDescriptionError] = useState(null);
  const [descriptionText, setDescriptionText] = useState(watch_group.description);
  const [oldDescriptionText, setOldDescriptionText] = useState(watch_group.description);
  const [watchDateError, setWatchDateError] = useState(null);
  const [watchDateText, setWatchDateText] = useState(watch_group.watch_date);
  const [oldWatchDateText, setOldWatchDateText] = useState(watch_group.watch_date);
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [deleted, setDeleted] = useState(false);

  const popover = (
    <Popover>
      <Popover.Header as='h3' className='delete-popover-header'>
        {convertKeyToSelectedLanguage('delete_comment', i18nData)}
      </Popover.Header>
      <Popover.Body>
        {convertKeyToSelectedLanguage('delete_confirm_group', i18nData)}
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

  useEffect(() => {
    setUrl(`/api/watch_groups/${watch_group._key}/?page=${page}&limit=${limit}`);
  }, [limit, page, setUrl, watch_group._key])

  async function handleJoinButtonClicked(e) {
    if (e.target.textContent === convertKeyToSelectedLanguage(buttonTypes.join, i18nData)
      || e.target.textContent === convertKeyToSelectedLanguage(buttonTypes.leave, i18nData)) {
      const { errorMessage, statusCode } = await postRequest(`/api/watch_groups/${watch_group._key}/joines`);

      if (statusCode === 204) {
        // expected when edge was deleted
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.join, i18nData);
      } else if (statusCode === 201) {
        // expected when edge was created
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.leave, i18nData);
      } else if (statusCode === 404) {
        console.log('not found');
      } else {
        // error
        console.log(errorMessage);
      }
    }
  }

  async function handleDeleteButtonClicked(e) {
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    const { error, errorMessage, statusCode } =
      await deleteRequest(`/api/watch_groups/${watch_group._key}`);
    if (statusCode === 204) {
      setSubmitError(null);
      setDeleted(true);
    }
    if (error) {
      setSubmitError('del_group_error');
      console.log(errorMessage);
    }
  }

  function handleEditButtonClicked() {
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    setEditing(!editing);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    if (descriptionText === '' || descriptionText === undefined) {
      setDescriptionError('empty_description');
    }
    else if (watchDateText === '' || watchDateText === undefined) {
      setWatchDateError('empty_watch_date');
    } else {
      const updateData = {
        creator: auth.username
      }
      if (descriptionText !== oldDescriptionText) {
        updateData.description = descriptionText;
      }
      if (watchDateText !== oldWatchDateText) {
        updateData.watch_date = watchDateText;
      }
      const { error, errorMessage, statusCode } =
        await putRequest(`/api/watch_groups/${watch_group._key}`, updateData);
      if (statusCode === 204) {
        if (descriptionText !== oldDescriptionText) {
          setOldDescriptionText(descriptionText);
        }
        if (watchDateText !== oldWatchDateText) {
          setOldWatchDateText(watchDateText);
        }
        setDescriptionError(null);
        setWatchDateError(null);
        setEditing(false);
      }
      if (error) {
        if (descriptionText !== oldDescriptionText) {
          setDescriptionError('update_desc_error');
        } else if (watchDateText !== oldWatchDateText) {
          setWatchDateError('update_desc_error');
        } else {
          setSubmitError(errorMessage);
        }
      }

    }
  }

  function handleEditCancel() {
    setDescriptionText(oldDescriptionText);
    setWatchDateText(oldWatchDateText);
    setEditing(false);
  }

  function handleCommentInsert(e) {
    e.preventDefault();
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    if (insertCommentText === '' || insertCommentText === undefined) {
      setInsertCommentError('empty_comment');
    } else {
      const commentData = { text: insertCommentText };
      commentData['user'] = auth.username;
      postRequest(`/api/watch_groups/${watch_group._key}/comments`, commentData)
        .then((res) => {
          if (!res.error && res.statusCode === 201) {
            // 201 expected
            setInsertCommentText('');
            setInsertCommentError(null);
            if (page === 1) {
              refetch();
            } else {
              setPage(1);
            }
          }
          setInsertCommentError(res.errorMessage);
        })
        .catch((err) => {
          setInsertCommentError('error');
          console.log('Error during post request', err.message);
        })
    }
  }

  function clearComment() {
    setInsertCommentText('');
    setInsertCommentError(null);
  }

  if (deleted) {
    return (
      <DeletedSuccesfully pagetype='watch_groups' />
    )
  }


  return (
    <>
      <Card key={`container_${watch_group._key}`} className='mt-4 mb-3'>
        <Card.Header as='h5' key={`header${watch_group._key}`} className="text-center" >
          <Card.Title>
            {watch_group.title}
          </Card.Title>
        </Card.Header>

        <Card.Body>
          <Row key={`${watch_group._key}_creation_date`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_creation_date`} >
              {convertKeyToSelectedLanguage('creation_date', i18nData)}
            </Col>
            <Col xs lg={7} key={`${watch_group._key}_value_creation_date`} >
              {convertDateAndTimeToLocale(watch_group['creation_date'], language)}
            </Col>
          </Row>

          <Row key={`${watch_group._key}_creator`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_creator`} >
              {convertKeyToSelectedLanguage('creator', i18nData)}
            </Col>
            <Col xs lg={7} key={`${watch_group._key}_value_creator`} >
              {watch_group['creator']}
            </Col>
          </Row>

          <Row key={`${watch_group._key}_show`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_show`} >
              {convertKeyToSelectedLanguage('show', i18nData)}
            </Col>
            <Col xs lg={7} key={`${watch_group._key}_value_show`} >
              <span className='btn btn-link p-0 link-dark' key={`${watch_group._key}_show_link_show`}
                onClick={() => navigate(`/${watch_group['show_type']}s/${watch_group['show_id']}`)}>
                {watch_group['show']}
              </span>
            </Col>
          </Row>

          {editing ?
            // editing watch date
            <Row key={`${watch_group._key}_watch_date`} className='justify-content-md-center mb-3'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_watch_date`} >
                {convertKeyToSelectedLanguage('watch_date', i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value_watch_date`} >
                <Form onSubmit={(e) => e.preventDefault()}>
                  <Form.Control type='date' className='mb-2 mt-3'
                    value={convertDateToFromInput(watchDateText)} isInvalid={!!watchDateError} autoComplete='off'
                    onChange={e => { setWatchDateText(e.target.value) }}
                  />
                  <Alert key='danger' variant='danger' show={watchDateError !== null}
                    onClose={() => setWatchDateError(null)} dismissible >
                    {convertKeyToSelectedLanguage(watchDateError, i18nData)}
                  </Alert>
                </Form>
              </Col>
            </Row>
            :
            // not editing
            <Row key={`${watch_group._key}_watch_date`} className='justify-content-md-center'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_watch_date`} >
                {convertKeyToSelectedLanguage('watch_date', i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value_watch_date`} >
                {convertDateToLocale(watchDateText, language)}
              </Col>
            </Row>
          }

          <Row key={`${watch_group._key}_location`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_location`} >
              {convertKeyToSelectedLanguage('location', i18nData)}
            </Col>
            <Col xs lg={7} key={`${watch_group._key}_value_location`} >
              {watch_group['location']}
            </Col>
          </Row>

          {editing ?
            // editing description
            <Row key={`${watch_group._key}_description`} className='justify-content-md-center mb-3'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_description`} >
                {convertKeyToSelectedLanguage('description', i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value_description`} >
                <Form onSubmit={handleEditSubmit}>
                  <Form.Control as='textarea' rows={5} className='mb-2 mt-3'
                    value={descriptionText} isInvalid={!!descriptionError} autoComplete='off'
                    onChange={e => { setDescriptionText(e.target.value) }}
                  />
                  <Alert key='danger' variant='danger' show={descriptionError !== null}
                    onClose={() => setDescriptionError(null)} dismissible >
                    {convertKeyToSelectedLanguage(descriptionError, i18nData)}
                  </Alert>
                  <Button type='submit' key={`add_edited_description_${watch_group._key}`}
                    className='insert-button border border-2 btn btn-light float-end mx-2'
                    disabled={descriptionText === '' || descriptionText === undefined}>
                    {convertKeyToSelectedLanguage('save', i18nData)}
                  </Button>
                  <Button key={`cancel_editing_watch_date_${watch_group._key}`}
                    className='border border-2 btn btn-light float-end'
                    onClick={handleEditCancel}>
                    {convertKeyToSelectedLanguage('cancel', i18nData)}
                  </Button>
                </Form>
              </Col>
            </Row>
            :
            <Row key={`${watch_group._key}_description`} className='justify-content-md-center'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_description`} >
                {convertKeyToSelectedLanguage('description', i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value_description`} >
                {descriptionText}
              </Col>
            </Row>
          }

          {
            auth.logged_in && auth.username === watch_group.creator ?
              // creator of group
              <Container className='mt-2' >
                <OverlayTrigger trigger='click' placement='bottom' rootClose={true}
                  overlay={popover}
                >
                  <span className='float-end'>
                    <Button className='btn btn-orange mx-2'
                      key={`${watch_group._key}_delete_button`} >
                      {convertKeyToSelectedLanguage('delete', i18nData)}
                    </Button>
                  </span>
                </OverlayTrigger>
                <Button className='btn btn-orange float-end mx-2' onClick={handleEditButtonClicked}
                  key={`${watch_group._key}_edit_button`} >
                  {convertKeyToSelectedLanguage('edit', i18nData)}
                </Button>
              </Container>
              :
              // not creator
              auth.logged_in &&
              <Container className='mt-2' >
                <Button className='btn btn-orange float-end mx-2' onClick={handleJoinButtonClicked}
                  key={`${watch_group._key}_join_button`} >
                  {convertKeyToSelectedLanguage(buttonType, i18nData)}
                </Button>
              </Container>
          }
        </Card.Body>
      </Card >

      <Alert key='danger' variant='danger' show={submitError !== null}
        onClose={() => setSubmitError(null)} dismissible >
        {convertKeyToSelectedLanguage(submitError, i18nData)}
      </Alert>

      <Container className='comments' key={`${watch_group._key}_comments`} >
        <h4>{convertKeyToSelectedLanguage('comments', i18nData)}</h4>

        {watch_group.comments.length > 0 &&
          <Limit limit={limit} setLimit={setLimit} setPage={setPage} key='limit' />
        }
        {watch_group.comments.length > 0 &&
          watch_group.comments.map(currentComment => {
            return (
              <Comment comment={currentComment} commentLocationType='watch_groups'
                commentLocationId={watch_group._key}
                commentLocationCreator={watch_group.creator === currentComment.user}
                key={currentComment.key}
              />
            )
          })
        }
        {watch_group.comments.length > 0 &&
          <PaginationElements currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage} key='pagination' />
        }
        {watch_group.comments.length <= 0 &&
          <Container>
            {convertKeyToSelectedLanguage('no_comment', i18nData)}
          </Container>
        }
        {auth.logged_in &&
          <Form className='mt-3' onSubmit={handleCommentInsert} >
            {/* form to add comment  */}
            <Form.Control as='textarea' rows={4} className='mb-3'
              placeholder={convertKeyToSelectedLanguage('comment_write', i18nData)}
              value={insertCommentText} isInvalid={!!insertCommentError} autoComplete='off'
              onChange={e => { setInsertCommentText(e.target.value) }}
            />
            <Alert key='danger' variant='danger' show={insertCommentError !== null}
              onClose={() => setInsertCommentError(null)} dismissible >
              {convertKeyToSelectedLanguage(insertCommentError, i18nData)}
            </Alert>
            <Button type='submit' variant='light' key='add_comment' className='insert-button border border-2 mb-5'
              disabled={insertCommentText === '' || insertCommentError === undefined}>
              {convertKeyToSelectedLanguage('add_comment', i18nData)}
            </Button>
            <Button variant='light' key='clear' className='mx-2 border border-2 mb-5' onClick={clearComment}>
              {convertKeyToSelectedLanguage('cancel', i18nData)}
            </Button>
          </Form>}

      </Container>
    </>
  )
}
