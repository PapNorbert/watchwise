import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Container, Form, Alert, OverlayTrigger, Popover } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertDateAndTimeToLocale } from '../i18n/conversion'
import useAuth from '../hooks/useAuth'
import { postRequest } from '../axiosRequests/PostAxios'
import Limit from '../components/Limit'
import PaginationElements from '../components/PaginationElements'
import Comment from '../components/Comment'
import { buttonTypes } from '../util/buttonTypes'
import { deleteRequest } from '../axiosRequests/DeleteAxios'
import { putRequest } from '../axiosRequests/PutAxios'
import DeletedSuccesfully from './DeletedSuccesfully'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../config/querryParams'
import { useSearchParamsState } from '../hooks/useSearchParamsState'


export default function OpinionThreadDetails({ opinion_thread, buttonType, setUrl, totalPages, refetch }) {
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] = useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const { language, i18nData } = useLanguage();
  const [insertCommentError, setInsertCommentError] = useState(null);
  const [insertCommentText, setInsertCommentText] = useState('');
  const [descriptionError, setDescriptionError] = useState(null);
  const [descriptionText, setDescriptionText] = useState(opinion_thread.description);
  const [oldDescriptionText, setOldDescriptionText] = useState(opinion_thread.description);
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [deleted, setDeleted] = useState(false);

  const popover = (
    <Popover>
      <Popover.Header as='h3' className='delete-popover-header'>
        {convertKeyToSelectedLanguage('delete_comment', i18nData)}
      </Popover.Header>
      <Popover.Body>
        {convertKeyToSelectedLanguage('delete_confirm_thread', i18nData)}
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
    // eslint-disable-next-line eqeqeq
    if (parseInt(limit) != limit) {
      setLimit(querryParamDefaultValues.limit);
      // eslint-disable-next-line eqeqeq
    } else if (parseInt(page) != page) {
      setPage(querryParamDefaultValues.page);
    } else if (!limitValues.includes(parseInt(limit))) {
      setLimit(querryParamDefaultValues.limit);
    } else if (page > totalPages && page > 1) {
      setPage(totalPages);
    } else {
      // limit and page have correct values
      setUrl(`/api/opinion_threads/${opinion_thread._key}/?page=${page}&limit=${limit}`);
    }
  }, [limit, page, setUrl, opinion_thread._key, totalPages, setLimit, setPage])

  async function handleFollowesButtonClicked(e) {
    if (buttonType === buttonTypes.follow || buttonType === buttonTypes.leave) {
      const { errorMessage, statusCode } = await postRequest(`/api/opinion_threads/${opinion_thread._key}/followes`);

      if (statusCode === 204) {
        // expected when edge was deleted
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.follow, i18nData);
        buttonType = buttonTypes.follow;
      } else if (statusCode === 201) {
        // expected when edge was created
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.leave, i18nData);
        buttonType = buttonTypes.leave;
      } else if (statusCode === 401) {
        setAuth({ logged_in: false });
      } else if (statusCode === 403) {
        navigate('/unauthorized');
      } else if (statusCode === 404) {
        setSubmitError('404_thread');
      } else {
        // error
        setSubmitError(errorMessage);
      }
    }
  }

  async function handleDeleteButtonClicked(e) {
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    const { errorMessage, statusCode } =
      await deleteRequest(`/api/opinion_threads/${opinion_thread._key}`);
    if (statusCode === 204) {
      setSubmitError(null);
      setDeleted(true);
    } else if (statusCode === 401) {
      setAuth({ logged_in: false });
    } else if (statusCode === 403) {
      navigate('/unauthorized');
    } else if (statusCode === 404) {
      setSubmitError('404_thread');
    } else {
      setSubmitError(errorMessage);
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
    } else {
      const updateData = {
        creator: auth.username
      }
      if (descriptionText !== oldDescriptionText) {
        updateData.description = descriptionText;
      }
      const { errorMessage, statusCode } =
        await putRequest(`/api/opinion_threads/${opinion_thread._key}`, updateData);
      if (statusCode === 204) {
        setOldDescriptionText(descriptionText);
        setDescriptionError(null);
        setEditing(false);
      } else if (statusCode === 401) {
        setAuth({ logged_in: false });
      } else if (statusCode === 403) {
        navigate('/unauthorized');
      } else if (statusCode === 404) {
        setSubmitError('404_thread');
      } else {
        if (descriptionText !== oldDescriptionText) {
          setDescriptionError('update_desc_error');
        } else {
          setSubmitError(errorMessage);
        }
      }
    }
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
      postRequest(`/api/opinion_threads/${opinion_thread._key}/comments`, commentData)
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
          } else if (res.statusCode === 401) {
            setAuth({ logged_in: false });
          } else if (res.statusCode === 403) {
            navigate('/unauthorized');
          } else if (res.statusCode === 404) {
            setInsertCommentError('404_thread');
          } else {
            setInsertCommentError(res.errorMessage);
          }
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
      <DeletedSuccesfully pagetype='opinion_threads' />
    )
  }

  return (
    <>
      <Card key={`container_${opinion_thread._key}`} className='mt-4 mb-3'>
        <Card.Header as='h5' key={`header${opinion_thread._key}`} className="text-center" >
          <Card.Title>
            {opinion_thread.title}
          </Card.Title>
        </Card.Header>

        <Card.Body>
          <Row key={`${opinion_thread._key}_creation_date`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${opinion_thread._key}_label_creation_date`} >
              {convertKeyToSelectedLanguage('creation_date', i18nData)}
            </Col>
            <Col xs lg={7} key={`${opinion_thread._key}_value_creation_date`} >
              {convertDateAndTimeToLocale(opinion_thread['creation_date'], language)}
            </Col>
          </Row>

          <Row key={`${opinion_thread._key}_creator`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${opinion_thread._key}_label_creator`} >
              {convertKeyToSelectedLanguage('creator', i18nData)}
            </Col>
            <Col xs lg={7} key={`${opinion_thread._key}_value_creator`} >
              {opinion_thread['creator']}
            </Col>
          </Row>

          <Row key={`${opinion_thread._key}_show`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${opinion_thread._key}_label_show`} >
              {convertKeyToSelectedLanguage('show', i18nData)}
            </Col>
            <Col xs lg={7} key={`${opinion_thread._key}_value_show`} >
              <span className='btn btn-link p-0 link-dark' key={`${opinion_thread._key}_show_link_show`}
                onClick={() => navigate(`/${opinion_thread['show_type']}s/${opinion_thread['show_id']}`)}>
                {opinion_thread['show']}
              </span>
            </Col>
          </Row>

          {(editing && auth.logged_in) ?
            // editing
            <Row key={`${opinion_thread._key}_description`} className='justify-content-md-center mb-3'>
              <Col xs lg={4} className='object-label' key={`${opinion_thread._key}_label_description`} >
                {convertKeyToSelectedLanguage('description', i18nData)}
              </Col>
              <Col xs lg={7} key={`${opinion_thread._key}_value_description`} >
                <Form onSubmit={handleEditSubmit}>
                  <Form.Control as='textarea' rows={5} className='mb-2 mt-3'
                    value={descriptionText} isInvalid={!!descriptionError} autoComplete='off'
                    onChange={e => { setDescriptionText(e.target.value) }}
                  />
                  <Alert key='danger' variant='danger' show={descriptionError !== null}
                    onClose={() => setDescriptionError(null)} dismissible >
                    {convertKeyToSelectedLanguage(descriptionError, i18nData)}
                  </Alert>
                  <Button type='submit' key={`add_edited_description_${opinion_thread._key}`}
                    className='insert-button border border-2 btn btn-light float-end mx-2'
                    disabled={descriptionText === '' || descriptionText === undefined}>
                    {convertKeyToSelectedLanguage('save', i18nData)}
                  </Button>
                  <Button key={`cancel_editing_description_${opinion_thread._key}`}
                    className='border border-2 btn btn-light float-end'
                    onClick={() => { setDescriptionText(oldDescriptionText); setEditing(false); }}>
                    {convertKeyToSelectedLanguage('cancel', i18nData)}
                  </Button>
                </Form>
              </Col>
            </Row>
            :
            // not editing
            <Row key={`${opinion_thread._key}_description`} className='justify-content-md-center'>
              <Col xs lg={4} className='object-label' key={`${opinion_thread._key}_label_description`} >
                {convertKeyToSelectedLanguage('description', i18nData)}
              </Col>
              <Col xs lg={7} key={`${opinion_thread._key}_value_description`} >
                {descriptionText}
              </Col>
            </Row>
          }

          {
            auth.logged_in && auth.username === opinion_thread.creator ?
              // creator of thread
              <Container className='mt-2' >
                <OverlayTrigger trigger='click' placement='bottom' rootClose={true}
                  overlay={popover}
                >
                  <span className='float-end'>
                    <Button className='btn btn-orange mx-2'
                      key={`${opinion_thread._key}_delete_button`} >
                      {convertKeyToSelectedLanguage('delete', i18nData)}
                    </Button>
                  </span>
                </OverlayTrigger>
                <Button className='btn btn-orange float-end mx-2' onClick={handleEditButtonClicked}
                  key={`${opinion_thread._key}_edit_button`} >
                  {convertKeyToSelectedLanguage('edit', i18nData)}
                </Button>
              </Container>
              :
              // not creator of the thread
              auth.logged_in &&
              <Container className='mt-2' >
                <Button className='btn btn-orange float-end mx-2' onClick={handleFollowesButtonClicked}
                  key={`${opinion_thread._key}_follows_button`} >
                  {convertKeyToSelectedLanguage(buttonType, i18nData)}
                </Button>
              </Container>
          }
        </Card.Body>
      </Card>

      <Alert key='danger' variant='danger' show={submitError !== null}
        onClose={() => setSubmitError(null)} dismissible >
        {convertKeyToSelectedLanguage(submitError, i18nData)}
      </Alert>

      <Container className='comments' key={`${opinion_thread._key}_comments`} >
        <h4>{convertKeyToSelectedLanguage('comments', i18nData)}</h4>

        {opinion_thread.comments.length > 0 &&
          <Limit limit={limit} key='limit' />
        }
        {opinion_thread.comments.length > 0 ?
          opinion_thread.comments.map(currentComment => {
            return (
              <Comment comment={currentComment} commentLocationType='opinion_threads'
                commentLocationId={opinion_thread._key}
                commentLocationCreator={opinion_thread.creator === currentComment.user}
                key={currentComment.key}
              />
            )
          })
          : null
        }
        {opinion_thread.comments.length > 0 &&
          <PaginationElements currentPage={parseInt(page)}
            totalPages={totalPages}
            onPageChange={setPage} key='pagination' />
        }
        {opinion_thread.comments.length <= 0 &&
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
