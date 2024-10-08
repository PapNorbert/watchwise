import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Row, Col, Button, Container, Form, Alert,
  OverlayTrigger, Popover, FloatingLabel
} from 'react-bootstrap'

import Limit from '../components/Limit'
import PaginationElements from '../components/PaginationElements'
import Comment from '../components/Comment'
import Map from '../components/Map'
import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage, convertDateAndTimeToLocale } from '../i18n/conversion'
import { convertDateToFormInput } from '../util/dateFormat'
import useAuth from '../hooks/useAuth'
import { postRequest } from '../axiosRequests/PostAxios'
import { buttonTypes } from '../config/buttonTypes'
import { deleteRequest } from '../axiosRequests/DeleteAxios'
import { putRequest } from '../axiosRequests/PutAxios'
import DeletedSuccesfully from './DeletedSuccesfully'
import { querryParamDefaultValues, querryParamNames, limitValues } from '../config/querryParams'
import { useSearchParamsState } from '../hooks/useSearchParamsState'
import { adminRoleCode, moderatorRoleCode } from '../config/UserRoleCodes'


export default function WatchGroupDetails({ watch_group, buttonType, setUrl, totalPages, refetch }) {
  const [limit, setLimit] =
    useSearchParamsState(querryParamNames.limit, querryParamDefaultValues.limit);
  const [page, setPage] = useSearchParamsState(querryParamNames.page, querryParamDefaultValues.page);
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const { language, i18nData } = useLanguage();
  const [insertCommentError, setInsertCommentError] = useState(null);
  const [insertCommentText, setInsertCommentText] = useState('');
  const [descriptionError, setDescriptionError] = useState(null);
  const [descriptionText, setDescriptionText] = useState(watch_group.description);
  const [oldDescriptionText, setOldDescriptionText] = useState(watch_group.description);
  const [watchDateError, setWatchDateError] = useState(null);
  const [watchDateText, setWatchDateText] = useState(watch_group.watch_date);
  const [oldWatchDateText, setOldWatchDateText] = useState(watch_group.watch_date);
  const [personLimitError, setPersonLimitError] = useState(null);
  const [personLimitText, setPersonLimitText] = useState(watch_group.personLimit);
  const [oldPersonLimitText, setOldPersonLimitText] = useState(watch_group.personLimit);
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
      setUrl(`/api/watch_groups/${watch_group._key}/?page=${page}&limit=${limit}`);
    }
  }, [limit, page, setLimit, setPage, setUrl, totalPages, watch_group._key])

  async function handleJoinButtonClicked(e) {
    if (buttonType === buttonTypes.cancel_req) {
      // delete join request
      const { errorMessage, statusCode } = await postRequest(`/api/watch_groups/${watch_group._key}/join_req/cancel`);
      if (statusCode === 204) {
        // expected when edge was deleted
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.join, i18nData);
        buttonType = buttonTypes.join;
      } else if (statusCode === 401) {
        setAuth({ logged_in: false });
      } else if (statusCode === 403) {
        navigate('/unauthorized');
      } else if (statusCode === 404) {
        setSubmitError('404_join_req');
      } else {
        setSubmitError(errorMessage);
      }
    }
    else if (buttonType === buttonTypes.join || buttonType === buttonTypes.leave) {
      const { errorMessage, statusCode } = await postRequest(`/api/watch_groups/${watch_group._key}/joines`);

      if (statusCode === 204) {
        // expected when edge was deleted
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.join, i18nData);
        buttonType = buttonTypes.join;
      } else if (statusCode === 201 || statusCode === 200) {
        // expected when edge was created
        e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.pendingJoin, i18nData);
        buttonType = buttonTypes.pendingJoin;
        setTimeout(() => {
          // after some time change text to cancel
          e.target.textContent = convertKeyToSelectedLanguage(buttonTypes.cancel_req, i18nData);
          buttonType = buttonTypes.cancel_req;
        }, 3000);
      } else if (statusCode === 401) {
        setAuth({ logged_in: false });
      } else if (statusCode === 403) {
        navigate('/unauthorized');
      } else if (statusCode === 404) {
        setSubmitError('404_group');
      } else {
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
      await deleteRequest(`/api/watch_groups/${watch_group._key}`);
    if (statusCode === 204) {
      setSubmitError(null);
      setDeleted(true);
    } else if (statusCode === 401) {
      setAuth({ logged_in: false });
    } else if (statusCode === 403) {
      navigate('/unauthorized');
    } else if (statusCode === 404) {
      setSubmitError('404_group');
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
    let noErrors = true;
    if (personLimitText === '' || personLimitText === undefined) {
      setPersonLimitError('empty_personLimit');
      noErrors = false;
    }
    if (descriptionText === '' || descriptionText === undefined) {
      setDescriptionError('empty_description');
      noErrors = false;
    }
    if (watchDateText === '' || watchDateText === undefined) {
      setWatchDateError('empty_watch_date');
      noErrors = false;
    }
    if (noErrors) {
      const updateData = {
        creator: auth.username
      }
      if (personLimitText !== oldPersonLimitText) {
        updateData.personLimit = personLimitText;
      }
      if (descriptionText !== oldDescriptionText) {
        updateData.description = descriptionText;
      }
      if (watchDateText !== oldWatchDateText) {
        updateData.watch_date = watchDateText;
      }
      const { errorMessage, statusCode } =
        await putRequest(`/api/watch_groups/${watch_group._key}`, updateData);
      if (statusCode === 204) {
        if (descriptionText !== oldDescriptionText) {
          setOldDescriptionText(descriptionText);
        }
        if (personLimitText !== oldPersonLimitText) {
          setOldPersonLimitText(personLimitText);
        }
        if (watchDateText !== oldWatchDateText) {
          setOldWatchDateText(watchDateText);
        }
        setDescriptionError(null);
        setWatchDateError(null);
        setPersonLimitError(null);
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
        } else if (watchDateText !== oldWatchDateText) {
          setWatchDateError(errorMessage);
        } else if (personLimitText !== oldPersonLimitText) {
          setPersonLimitError(errorMessage);
        } else {
          setSubmitError(errorMessage);
        }
      }
    }
  }

  function handleEditCancel() {
    setDescriptionText(oldDescriptionText);
    setWatchDateText(oldWatchDateText);
    setPersonLimitText(oldPersonLimitText);
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
          } else if (res.statusCode === 401) {
            setAuth({ logged_in: false });
          } else if (res.statusCode === 403) {
            navigate('/unauthorized');
          } else if (res.statusCode === 404) {
            setInsertCommentError('404_group');
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

          {(editing && auth.logged_in) ?
            // editing watch date
            <Row key={`${watch_group._key}_watch_date`} className='justify-content-md-center mb-3'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_watch_date`} >
                {convertKeyToSelectedLanguage('watch_date', i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value_watch_date`} >
                <Form onSubmit={(e) => e.preventDefault()}>
                  <Form.Control type='datetime-local' className='mb-2 mt-3'
                    value={convertDateToFormInput(watchDateText)} isInvalid={!!watchDateError}
                    min={new Date().toISOString().split('.')[0].slice(0, -3).toString()}
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
                {convertDateAndTimeToLocale(watchDateText, language)}
              </Col>
            </Row>
          }

          {(editing && auth.logged_in) ?
            //editing person limit
            <Row key={`${watch_group._key}_personLimit`} className='justify-content-md-center'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_personLimit`} >
                {convertKeyToSelectedLanguage('personLimit', i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value$_personLimit`} >
                <Form onSubmit={(e) => e.preventDefault()}>
                  <FloatingLabel
                    label={convertKeyToSelectedLanguage('personLimit', i18nData)} className='mb-2 mt-3' >
                    <Form.Control type='number' min={2} placeholder={convertKeyToSelectedLanguage('personLimit', i18nData)}
                      value={personLimitText} isInvalid={!!personLimitError} autoComplete='off'
                      onChange={e => { setPersonLimitText(e.target.value); setPersonLimitError(null) }} />
                    <Form.Control.Feedback type='invalid'>
                      {convertKeyToSelectedLanguage(personLimitError, i18nData)}
                    </Form.Control.Feedback>
                  </FloatingLabel>
                </Form>
              </Col>
            </Row>
            :
            // not editing
            <Row key={`${watch_group._key}_personLimit`} className='justify-content-md-center'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_personLimit`} >
                {convertKeyToSelectedLanguage('personLimit', i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value$_personLimit`} >
                {oldPersonLimitText}
              </Col>
            </Row>
          }

          <Row key={`${watch_group._key}_limit`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_limit`} >
              {convertKeyToSelectedLanguage('currentNrOfPersons', i18nData)}
            </Col>
            <Col xs lg={7} key={`${watch_group._key}_value$_limit`} >
              {watch_group['currentNrOfPersons']}/{oldPersonLimitText}
            </Col>
          </Row>

          {(editing && auth.logged_in) ?
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
                {
                  descriptionText.split('\n').map((textRow, i) => {
                    return (
                      <span key={`desc_row_container_${i}`}>
                        <span key={`desc_row_${i}`}>
                          {textRow}
                        </span>
                        <br />
                      </span>
                    )
                  })
                }
              </Col>
            </Row>
          }

          {watch_group['locationName'] &&
            <Row key={`${watch_group._key}_locationName`} className='justify-content-md-center'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_locationName`} >
                {convertKeyToSelectedLanguage('locationName', i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value_locationName`} >
                {watch_group['locationName']}
              </Col>
            </Row>
          }

          <div className='location'>
            <Row key={`${watch_group._key}_location`} className='justify-content-md-center'>
              <Col xs lg={11} className='object-label' key={`${watch_group._key}_label_location`} >
                {convertKeyToSelectedLanguage('location', i18nData)}
              </Col>
            </Row>
            <Row key={`${watch_group._key}_location_map`} className='justify-content-md-center'>
              <Col xs lg={6} key={`${watch_group._key}_value_location`} >
                <Map middlePosition={watch_group['location']} />
              </Col>
            </Row>
          </div>

          {auth.logged_in && (auth.username === watch_group.creator || buttonType === buttonTypes.leave) &&
            <Row key={`${watch_group._key}_joined_users`} className='justify-content-md-center'>
              <Col xs lg={4} className='object-label' key={`${watch_group._key}_label_joined_users`} >
                {convertKeyToSelectedLanguage('joined_users', i18nData)}
              </Col>
              <Col xs lg={7} key={`${watch_group._key}_value_joined_users`} >
                {watch_group['joined_users'].length > 0 ?
                  watch_group['joined_users'].join(', ')
                  :
                  convertKeyToSelectedLanguage('no_user_joined', i18nData)
                }
              </Col>
            </Row>
          }

          {
            auth.logged_in && auth.username === watch_group.creator ?
              // creator of group
              <Container className='mt-2 creator-buttons' >
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
              <Container className='mt-2 join-button' >
                {(auth.role === adminRoleCode || auth.role === moderatorRoleCode) &&
                  // moderator or admin can also delete
                  < OverlayTrigger trigger='click' placement='bottom' rootClose={true}
                    overlay={popover}
                  >
                    <span className='float-end'>
                      <Button className='btn btn-orange mx-2'
                        key={`${watch_group._key}_delete_button`} >
                        {convertKeyToSelectedLanguage('delete', i18nData)}
                      </Button>
                    </span>
                  </OverlayTrigger>
                }
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
          <Limit limit={limit} key='limit' />
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
          <PaginationElements currentPage={parseInt(page)}
            totalPages={totalPages}
            onPageChange={setPage} key='pagination' />
        }
        {watch_group.comments.length <= 0 &&
          <Container className='mb-5'>
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
          </Form>
        }

      </Container>
    </>
  )
}
