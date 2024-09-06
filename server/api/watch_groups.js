import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios'
import {
  insertWatchGroup, findWatchGroupByKey, findWatchGroups, updateWatchGroup, deleteWatchGroupAndChats,
  getWatchGroupCount, findWatchGroupsByCreator, getWatchGroupCountByCreator,
  findWatchGroupsByUserJoined, getWatchGroupCountByUserJoined, findWatchGroupsWithJoinedInformation,
  findWatchGroupByKeyWithoutComments, findWatchGroupByKeyWithJoinedInformation,
  handleJoinTransaction, findWatchGroupNamesAndKeyByUserJoinedOrCreator
} from '../db/watch_groups_db.js'
import {
  findJoinRequestByCreator, getJoinRequestCountByCreator, deleteJoinRequestEdge,
  deleteJoinRequestEdgeByKey, handleJoinReqAcceptTransaction, deleteJoinRequestEdgeByTo
} from '../db/join_requests_db.js'
import { getJoinedUsersByGroupKey, deleteJoinedGroupEdgeByTo } from '../db/joined_group_db.js'
import { getMovieKeyByName } from '../db/movies_db.js'
import { getSerieKeyByName } from '../db/series_db.js'
import {
  findComments, findCommentByKey, insertComment, deleteComment,
  getCommentCountForGroupByKey, updateComment
} from '../db/comments_db.js'
import { findUserByUsername } from '../db/users_db.js';
import { createPaginationInfo } from '../util/paginationInfo.js'
import { createResponseDtos, createResponseDtosLoggedIn } from '../dto/outgoing_dto.js'
import { validateWatchGroupCreation, validateWatchDate, validatePersonLimit } from '../util/watchGroupValidation.js'
import { validateCommentCreation } from '../util/commentValidation.js'
import { locationsToCoordCache } from '../util/locationsCache.js'
import { authorize } from '../middlewares/auth.js'
import { maxDistanceDefaultValue } from '../config/maxDistanceDefault.js'
import { adminRoleCode, moderatorRoleCode } from '../config/userRoleCodes.js';
import { insertHisGroupChatEdge, insertWatchGroupChat } from '../db/watch_groups_chats.js';
import { insertIsAboutShowEdge, deleteIsAboutShowEdge } from '../db/is_about_show_edge_db.js'

const router = express.Router();


// comments 


router.get('/:group_id/comments', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.group_id) == request.params.group_id
    && parseInt(request.params.group_id) > 0) { // correct parameter
    try {
      const comments = await findComments(request.params.group_id, 'watch_groups');
      response.json(comments);
    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: 'error'
      });
    }

  } else { // incorrect parameter
    response.status(400).json({ error: 'bad_req_par_number' });
  }

});

router.get('/:group_id/comments/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.group_id) == request.params.group_id
    && parseInt(request.params.group_id) > 0) { // correct parameter
    const group_id = request.params.group_id;
    const id = request.params.id;
    try {
      const comment = await findCommentByKey(group_id, id, 'watch_groups');
      if (comment) {
        response.json(comment);
      } else { // no entity found with id
        response.status(404).end();
      }
    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: err.message
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: 'bad_req_par_number' });
  }

});

router.post('/:group_id/comments', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  if (parseInt(request.params.group_id) == request.params.group_id
    && parseInt(request.params.group_id) > 0) { // correct parameter
    const group_id = request.params.group_id;
    try {
      let commentJson = request.body;
      const { correct, error } = await validateCommentCreation(commentJson);
      if (correct) {
        commentJson.creation_date = new Date(Date.now());
        commentJson.key = uuidv4();
        const id = await insertComment(group_id, commentJson, 'watch_groups');
        response.status(201).json({ id: id });
      } else { // invalid comment
        response.status(400).json({
          error: error
        });
      }
    } catch (err) {
      console.log(err);
      response.status(400).json({ error: 'error' });
    }
  } else { // incorrect parameter
    response.status(400).json({ error: 'bad_req_par_number' });
  }

});

router.put('/:group_id/comments/:id', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.group_id) == request.params.group_id
    && parseInt(request.params.group_id) > 0) { // correct parameter
    const group_id = request.params.group_id;
    const id = request.params.id;
    const comment = await findCommentByKey(group_id, id, 'watch_groups');
    if (comment.user !== response.locals.payload.username) {
      response.sendStatus(403);
      return
    }
    let commentJson = request.body;
    if (commentJson.text === undefined || commentJson.text === '') {
      response.status(400);
      response.json({ error: 'empty_comment' });
    } else {
      try {
        const succesfull = await updateComment(group_id, id, commentJson.text, 'watch_groups');
        // can only update the text
        if (!succesfull) {
          response.status(404);
        }
        response.end();
      } catch (err) {
        console.log(err);
        response.status(400);
        response.json({
          error: err.message
        });
      }
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: 'bad_req_par_number' });
  }
});

router.delete('/:group_id/comments/:id', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.group_id) == request.params.group_id
    && parseInt(request.params.group_id) > 0) { // correct parameter
    const group_id = request.params.group_id;
    const id = request.params.id;
    const comment = await findCommentByKey(group_id, id, 'watch_groups');
    if (comment.user !== response.locals.payload.username && response.locals.payload.role !== adminRoleCode
      && response.locals.payload.role !== moderatorRoleCode) {
      response.sendStatus(403);
      return
    }
    try {
      const succesfull = await deleteComment(group_id, id, 'watch_groups');
      if (!succesfull) {
        response.status(404);
      }
      response.end();

    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: err.message
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: 'bad_req_par_number' });
  }
});



// watchgroups


router.get('', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let {
      page = 1, limit = 5, creator, joined = false, userId, userLocLat, userLocLong,
      titleSearch = null, showSearch = null, creatorSearch = null, sortBy = 'newest',
      watchDateSearch = null, locationSearch = null, maxDistanceSearch = maxDistanceDefaultValue,
      onlyNotFullSearch = false
    } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit
      && parseInt(page) > 0 && parseInt(limit) > 0) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);
      if (userLocLat == parseFloat(userLocLat) && userLocLong == parseFloat(userLocLong)) {
        userLocLat = parseFloat(userLocLat);
        userLocLong = parseFloat(userLocLong);
      } else {
        if (locationSearch) {
          if (!locationsToCoordCache[locationSearch]) {
            // if this location is not cached so far make a request to translate it to coordinates
            const axiosRequest = axios.create({
              headers: { 'Content-Type': 'application/json' }
            });
            console.log('Request to: ', `https://geocode.maps.co/search?q=${locationSearch}`);
            const axiosResponse = await axiosRequest.get(
              `https://geocode.maps.co/search?q=${locationSearch}`);

            if (axiosResponse?.data[0].lat && axiosResponse?.data[0].lon) {
              locationsToCoordCache[locationSearch] = {
                lat: parseFloat(axiosResponse?.data[0].lat),
                long: parseFloat(axiosResponse?.data[0].lon)
              }
            }
          }
          userLocLat = locationsToCoordCache[locationSearch].lat;
          userLocLong = locationsToCoordCache[locationSearch].long;
        } else {
          userLocLat = null;
          userLocLong = null;
        }
      }

      if (creator) {
        // searching for watchgroups that the user created
        if (creator !== response.locals.payload.username) {
          response.sendStatus(403);
          return
        }
        const [watchGroups, count] = await Promise.all([
          findWatchGroupsByCreator(creator, page, limit, userLocLat, userLocLong,
            titleSearch, showSearch, null, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, sortBy),
          getWatchGroupCountByCreator(creator, userLocLat, userLocLong,
            titleSearch, showSearch, null, watchDateSearch, maxDistanceSearch, onlyNotFullSearch),
        ]);
        response.json({
          "data": createResponseDtos(watchGroups),
          "pagination": createPaginationInfo(page, limit, count)
        });

      } else if (joined && userId) {
        // searching for watchgroups that the user joined
        if (userId !== response.locals.payload?.userID) {
          response.sendStatus(403);
          return
        }
        const [watchGroups, count] = await Promise.all([
          findWatchGroupsByUserJoined(`users/${userId}`, page, limit, userLocLat, userLocLong,
            titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, sortBy),
          getWatchGroupCountByUserJoined(`users/${userId}`, userLocLat, userLocLong,
            titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch),
        ]);
        response.json({
          "data": createResponseDtos(watchGroups),
          "pagination": createPaginationInfo(page, limit, count)
        });


      } else {
        // searching for all watchgroups
        if (response.locals?.payload?.userID) {
          // logged in
          const [watchGroups, count] = await Promise.all([
            findWatchGroupsWithJoinedInformation(`users/${response.locals.payload.userID}`, page, limit, userLocLat, userLocLong,
              titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, sortBy),
            getWatchGroupCount(userLocLat, userLocLong,
              titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch),
          ]);
          response.json({
            "data": createResponseDtosLoggedIn(watchGroups),
            "pagination": createPaginationInfo(page, limit, count)
          });

        } else {
          // not logged in
          const [watchGroups, count] = await Promise.all([
            findWatchGroups(page, limit, userLocLat, userLocLong,
              titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch, sortBy),
            getWatchGroupCount(userLocLat, userLocLong,
              titleSearch, showSearch, creatorSearch, watchDateSearch, maxDistanceSearch, onlyNotFullSearch),
          ]);
          response.json({
            "data": createResponseDtos(watchGroups),
            "pagination": createPaginationInfo(page, limit, count)
          });
        }
      }
    } else {
      response.status(400).json({ error: "bad_paging" })
    }
  } catch (err) {
    console.log(err);
    response.status(400);
    response.json({
      error: "error"
    });
  }
});

router.get('/join_requests', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { page = 1, limit = 5, creator } = request.query;
    if (parseInt(page) == page && parseInt(limit) == limit
      && parseInt(page) > 0 && parseInt(limit) > 0) { // correct paging information
      page = parseInt(page);
      limit = parseInt(limit);

      if (creator) {
        if (creator !== response.locals.payload.username) {
          response.sendStatus(403);
          return
        }

        const [JoinRequests, count] = await Promise.all([
          findJoinRequestByCreator(creator, page, limit),
          getJoinRequestCountByCreator(creator),
        ]);
        response.json({
          "data": createResponseDtos(JoinRequests),
          "pagination": createPaginationInfo(page, limit, count)
        });

      } else {
        // no creator specified
        response.status(400).json({ error: "creator_required" })
      }
    } else {
      response.status(400).json({ error: "bad_paging" })
    }
  } catch (err) {
    console.log(err);
    response.status(400).json({
      error: "error"
    });
  }
});

router.get('/names', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  try {
    let { userId } = request.query;
    if (userId) {
      const watch_group_names = await findWatchGroupNamesAndKeyByUserJoinedOrCreator(`users/${userId}`);
      response.json(watch_group_names);
    } else {
      response.sendStatus(204);
    }
  } catch (err) {
    console.log(err);
    response.status(400).json({
      error: "error"
    });
  }
});

router.get('/:id', async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(200);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    try {
      let { page = 1, limit = 5 } = request.query;
      if (parseInt(page) == page && parseInt(limit) == limit
        && parseInt(page) > 0 && parseInt(limit) > 0) {  // correct paging information
        page = parseInt(page);
        limit = parseInt(limit);
        if (response.locals?.payload?.userID) {
          // logged in
          const [watchGroup, count] = await Promise.all([
            findWatchGroupByKeyWithJoinedInformation(
              `users/${response.locals.payload.userID}`, request.params.id, page, limit),
            getCommentCountForGroupByKey(request.params.id),
          ]);

          if (watchGroup != null) {
            if (watchGroup.doc.creator === response.locals.payload.username || watchGroup.joined) {
              // user is the creator              
              const joinedUsers = await getJoinedUsersByGroupKey(request.params.id);
              watchGroup.doc.joined_users = joinedUsers;
              response.json({
                'data': watchGroup,
                'pagination': createPaginationInfo(page, limit, count)
              });
            } else {

              response.json({
                'data': watchGroup,
                'pagination': createPaginationInfo(page, limit, count)
              });
            }
          } else { // no entity found with id
            response.status(404).end();
          }
        } else {
          // not logged in
          const [watchGroup, count] = await Promise.all([
            findWatchGroupByKey(request.params.id, page, limit),
            getCommentCountForGroupByKey(request.params.id),
          ]);

          if (watchGroup != null) {
            response.json({
              'data': watchGroup,
              'pagination': createPaginationInfo(page, limit, count)
            });
          } else { // no entity found with id
            response.status(404).end();
          }
        }

      } else {
        // page and limit not numbers
        response.status(400).json({ error: 'bad_paging' })
      }

    } catch (err) {
      console.log(err);
      response.status(400).json({
        error: err.message
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }

});

router.post('', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  try {
    let watchGroupJson = request.body;
    const { correct, error } = await validateWatchGroupCreation(watchGroupJson);
    if (correct) {
      watchGroupJson.creation_date = new Date(Date.now());
      watchGroupJson.comments = [];
      watchGroupJson.currentNrOfPersons = 1;
      watchGroupJson.personLimit = parseInt(watchGroupJson.personLimit);

      // get name of the location
      const axiosRequest = axios.create({
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Request to: ',
        `https://geocode.maps.co/reverse?lat=${watchGroupJson.location[0]}&lon=${watchGroupJson.location[1]}`);

      const axiosResponse = await axiosRequest.get(
        `https://geocode.maps.co/reverse?lat=${watchGroupJson.location[0]}&lon=${watchGroupJson.location[1]}`);
      if (axiosResponse?.data?.display_name) {
        watchGroupJson.locationName = axiosResponse.data.display_name;
      }

      const movieKey = await getMovieKeyByName(watchGroupJson.show);
      if (movieKey) {
        watchGroupJson['show_id'] = movieKey;
        watchGroupJson['show_type'] = 'movie';
        const wgId = await insertWatchGroup(watchGroupJson);
        const isAboutShowId = await insertIsAboutShowEdge(`watch_groups/${wgId}`, `movies/${movieKey}`);
        const wgChatId = await insertWatchGroupChat({ "chat_comments": [] });
        const hisGroupChatEdge = await insertHisGroupChatEdge(`watch_groups/${wgId}`, `watch_group_chats/${wgChatId}`);
        response.status(201).json({ id: wgId });
      } else {
        // movie not found, check series
        const seriesKey = await getSerieKeyByName(watchGroupJson.show);
        if (seriesKey) {
          watchGroupJson['show_id'] = seriesKey;
          watchGroupJson['show_type'] = 'serie';
          const wgId = await insertWatchGroup(watchGroupJson);
          const isAboutShowId = await insertIsAboutShowEdge(`watch_groups/${wgId}`, `series/${seriesKey}`);
          const wgChatId = await insertWatchGroupChat({ "chat_comments": [] });
          const hisGroupChatEdge = await insertHisGroupChatEdge(`watch_groups/${wgId}`, `watch_group_chats/${wgChatId}`);
          response.status(201).json({ id: wgId });
        } else {
          // show not found
          response.status(400).json({
            error: 'show_not_exists'
          });
        }
      }
    } else {
      response.status(400).json({
        error: error
      });
    }

  } catch (err) {
    console.log(err);
    response.status(400);
    response.json({
      error: "error"
    });
  }

});

router.post('/join_requests/:id', authorize(), async (request, response) => {
  // accepting join request with given id
  response.set('Content-Type', 'application/json');
  response.status(201);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    try {
      const transactionRespn = await handleJoinReqAcceptTransaction(request.params.id);
      if (transactionRespn.error) {
        if (transactionRespn.errorMessage === '404') {
          response.status(404).end();
        } else {
          response.status(400).json({ error: transactionRespn.errorMessage });
        }
      } else {
        //transaction completed succesfully
        response.json({ refetch: transactionRespn.groupBecameFull });
      }
    } catch (err) {
      console.log(err);
      response.status(400).json({
        error: "error"
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }
});

router.post('/:id/joines', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    try {
      const transactionRespn = await handleJoinTransaction(request.params.id, response.locals.payload.username);
      if (transactionRespn.error) {
        if (transactionRespn.errorMessage === '404') {
          response.status(404).end();
        } else {
          response.status(400).json({ error: transactionRespn.errorMessage });
        }

      } else {
        //transaction completed succesfully
        if (transactionRespn.actionPerformed === 'deleted') {
          response.end();
          return
        }
        if (transactionRespn.actionPerformed === 'created') {
          response.status(201).json({ id: transactionRespn.joinRequestKey })
          return
        }
        if (transactionRespn.actionPerformed === 'request_exists') {
          response.sendStatus(200);
          return
        }
      }

    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: err
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }

});

router.post('/:id/join_req/cancel', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    try {
      const user = await findUserByUsername(response.locals.payload.username);
      if (user !== null) {
        const deleted = await deleteJoinRequestEdge(user._id, `watch_groups/${request.params.id}`);
        if (deleted) {
          response.end();
        } else {
          response.sendStatus(404);
        }
      } else {
        // no user found
        response.status(400).json({
          error: 'user_not_exists'
        });
      }
    } catch (err) {
      console.log(err);
      response.status(400).json({
        error: err
      });
    }

  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }
});

router.put('/:id', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    const id = request.params.id;
    const newWatchGroupAttributes = request.body;
    if (newWatchGroupAttributes.watch_date !== undefined) {
      // changes the watch date
      const { correct, error } = validateWatchDate(newWatchGroupAttributes.watch_date);
      if (!correct) {
        response.status(400).json({
          error: error
        });
        return
      }
    }
    if (newWatchGroupAttributes.personLimit !== undefined) {
      // changes the person limit
      const { correct, error } = validatePersonLimit(newWatchGroupAttributes.personLimit);
      if (!correct) {
        response.status(400).json({
          error: error
        });
        return
      }
    }
    try {
      const watchGroup = await findWatchGroupByKeyWithoutComments(id);
      if (watchGroup.creator !== response.locals.payload.username) {
        response.sendStatus(403);
        return
      }

      if (newWatchGroupAttributes.show !== undefined && newWatchGroupAttributes.show !== '') {
        // new attributes change the show
        const movieKey = await getMovieKeyByName(opinionThreadJson.show);
        if (movieKey) {
          newWatchGroupAttributes['show_id'] = movieKey;
          newWatchGroupAttributes['show_type'] = 'movie';
          const succesfull = await updateWatchGroup(id, newWatchGroupAttributes);
          if (!succesfull) {
            response.status(404);
          }
          response.end();
        } else {
          // movie not found, check series
          const seriesKey = await getSerieKeyByName(newWatchGroupAttributes.show);
          if (seriesKey) {
            newWatchGroupAttributes['show_id'] = seriesKey;
            newWatchGroupAttributes['show_type'] = 'serie';
            const succesfull = await updateWatchGroup(id, newWatchGroupAttributes);
            if (!succesfull) {
              response.status(404);
            }
            response.end();
          } else {
            // show not found
            response.status(400).json({
              error: 'show_not_exists'
            });
          }
        }
      } else { // does not change the show
        const succesfull = await updateWatchGroup(id, newWatchGroupAttributes);
        if (!succesfull) {
          response.status(404);
        }
        response.end();
      }

    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: "error"
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }

});

router.delete('/join_requests/:id', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    try {
      const succesfull = await deleteJoinRequestEdgeByKey(request.params.id);
      if (!succesfull) {
        response.status(404);
      }
      response.end();
    } catch (err) {
      console.log(err);
      response.status(400).json({
        error: "error"
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }
});

router.delete('/:id', authorize(), async (request, response) => {
  response.set('Content-Type', 'application/json');
  response.status(204);
  if (parseInt(request.params.id) == request.params.id
    && parseInt(request.params.id) > 0) { // correct parameter
    const id = request.params.id;
    try {
      const watchGroup = await findWatchGroupByKeyWithoutComments(id);
      if (watchGroup.creator !== response.locals.payload.username && response.locals.payload.role !== adminRoleCode
        && response.locals.payload.role !== moderatorRoleCode) {
        response.sendStatus(403);
        return
      }
      const succesfull = await deleteWatchGroupAndChats(id);
      if (!succesfull) {
        response.status(404);
      }
      await deleteIsAboutShowEdge(`watch_groups/${id}`)
      await deleteJoinRequestEdgeByTo(`watch_groups/${id}`)
      await deleteJoinedGroupEdgeByTo(`watch_groups/${id}`)
      response.end();

    } catch (err) {
      console.log(err);
      response.status(400);
      response.json({
        error: err.message
      });
    }
  } else { // incorrect parameter
    response.status(400);
    response.json({ error: "bad_req_par_number" });
  }

});


export default router;
