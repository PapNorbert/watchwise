import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Container, Form, Alert } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import useAuth from '../hooks/useAuth'
import { postRequest } from '../axiosRequests/PostAxios'
import Limit from '../components/Limit'
import PaginationElements from '../components/PaginationElements'
import Comment from '../components/Comment'


export default function OpinionThreadDetails({ opinion_thread, buttonType, setUrl, totalPages, refetch }) {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { i18nData } = useLanguage();
  const [commentError, setCommentError] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    setUrl(`/api/opinion_threads/${opinion_thread._key}/?page=${page}&limit=${limit}`);
  }, [limit, page, setUrl, opinion_thread._key])

  async function handleFollowesButtonClicked(e) {
    if (e.target.textContent === convertKeyToSelectedLanguage('follow', i18nData)
      || e.target.textContent === convertKeyToSelectedLanguage('leave', i18nData)) {
      const { errorMessage, statusCode } = await postRequest(`/api/opinion_threads/${opinion_thread._key}/followes`);

      if (statusCode === 204) {
        // expected when edge was deleted
        e.target.textContent = convertKeyToSelectedLanguage('follow', i18nData);
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


  function handleCommentInsert(e) {
    e.preventDefault();
    if (!auth.logged_in) {
      navigate('/login');
      return;
    }
    if (commentText === '' || commentText === undefined) {
      setCommentError('empty_comment');
    } else {
      const commentData = { text: commentText };
      commentData['user'] = auth.username;
      postRequest(`/api/opinion_threads/${opinion_thread._key}/comments`, commentData)
        .then((res) => {
          if (!res.error && res.statusCode === 201) {
            // 201 expected
            setCommentText('');
            setCommentError(null);
            if (page === 1) {
              refetch();
            } else {
              setPage(1);
            }
          }
          setCommentError(res.errorMessage);
        })
        .catch((err) => {
          setCommentError('error');
          console.log('Error during post request', err.message);
        })
    }
  }

  function clearComment() {
    setCommentText('');
    setCommentError(null);
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
              {opinion_thread['creation_date']}
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

          <Row key={`${opinion_thread._key}_description`} className='justify-content-md-center'>
            <Col xs lg={4} className='object-label' key={`${opinion_thread._key}_label_description`} >
              {convertKeyToSelectedLanguage('description', i18nData)}
            </Col>
            <Col xs lg={7} key={`${opinion_thread._key}_value_description`} >
              {opinion_thread['description']}
            </Col>
          </Row>

          {
            auth.logged_in &&
            <Container>
              <Button className='btn btn-orange float-end mx-2' onClick={handleFollowesButtonClicked}
                key={`${opinion_thread._key}_follows_button`} >
                {convertKeyToSelectedLanguage(buttonType, i18nData)}
              </Button>
            </Container>
          }
        </Card.Body>

      </Card>

      <Container className='comments' key={`${opinion_thread._key}_comments`} >
        <h4>{convertKeyToSelectedLanguage('comments', i18nData)}</h4>

        {opinion_thread.comments.length > 0 &&
          <Limit limit={limit} setLimit={setLimit} setPage={setPage} key='limit' />
        }
        {opinion_thread.comments.length > 0 ?
          opinion_thread.comments.map(currentComment => {
            return (
              <Comment comment={currentComment}
                key={currentComment.key}
              />
            )
          })
          : null
        }
        {opinion_thread.comments.length > 0 &&
          <PaginationElements currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage} key='pagination' />
        }
        {auth.logged_in &&
          <Form className='mt-3' onSubmit={handleCommentInsert} >
            {/* form to add comment  */}
            <Form.Control as='textarea' rows={4} className='mb-3'
              placeholder={convertKeyToSelectedLanguage('comment_write', i18nData)}
              value={commentText} isInvalid={!!commentError} autoComplete='off'
              onChange={e => { setCommentText(e.target.value) }}
            />
            <Alert key='danger' variant='danger' show={commentError !== null}
              onClose={() => setCommentError(null)} dismissible >
              {convertKeyToSelectedLanguage(commentError, i18nData)}
            </Alert>
            <Button type='submit' variant='light' key='add_comment' className='comment-insert-button border border-2 mb-5'
              disabled={commentText === '' || commentError === undefined}>
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
