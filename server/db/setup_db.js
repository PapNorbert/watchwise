import bcrypt from 'bcrypt'

import pool from './connection_db.js'
import { adminRoleCode } from '../config/UserRoleCodes.js'
import { adminFirstName, adminLastName, adminPassword, adminUsername, about_me } from '../config/adminUserData.js'
import { checkUserExistsWithUsername, insertUser } from './users_db.js'
import { checkEmploymentFileExists, insertEmploymentFile } from './moderator_req_db.js'

export async function createCollections() {
  if (! await pool.collection('movies').exists()) {
    await pool.collection('movies').create();
  }
  if (! await pool.collection('series').exists()) {
    await pool.collection('series').create();
  }
  if (! await pool.collection('users').exists()) {
    await pool.collection('users').create();
  }
  if (! await pool.collection('watch_groups').exists()) {
    await pool.collection('watch_groups').create();
    // group for watching series/movies
  }
  if (! await pool.collection('genres').exists()) {
    await pool.collection('genres').create();
  }
  if (! await pool.collection('opinion_threads').exists()) {
    await pool.collection('opinion_threads').create();
    // thread to share opinions on series/movies
  }
  if (! await pool.collection('moderator_requests').exists()) {
    await pool.collection('moderator_requests').create();
  }
  if (! await pool.collection('announcements').exists()) {
    await pool.collection('announcements').create();
  }
  if (! await pool.collection('watch_group_chats').exists()) {
    await pool.collection('watch_group_chats').create();
  }
  if (! await pool.collection('tags').exists()) {
    await pool.collection('tags').create();
  }
}

export async function createEdgeCollections() {
  if (! await pool.collection('joined_group').exists()) {
    await pool.createEdgeCollection('joined_group');
  }
  if (! await pool.collection('his_group_chat').exists()) {
    await pool.createEdgeCollection('his_group_chat');
  }
  if (! await pool.collection('join_request').exists()) {
    await pool.createEdgeCollection('join_request');
  }
  if (! await pool.collection('follows_thread').exists()) {
    await pool.createEdgeCollection('follows_thread');
  }
  if (! await pool.collection('his_type').exists()) {
    await pool.createEdgeCollection('his_type');
  }
  if (! await pool.collection('is_about_show').exists()) {
    await pool.createEdgeCollection('is_about_show');
  }
  if (! await pool.collection('has_rated').exists()) {
    await pool.createEdgeCollection('has_rated');
  }
}

export async function insertAdminUser() {
  const exists = await checkUserExistsWithUsername('admin');
  if (!exists) {
    const adminData = {
      first_name: adminFirstName,
      last_name: adminLastName,
      username: adminUsername,
      role: adminRoleCode,
      about_me: about_me,
      create_date: new Date(Date.now())
    }
    adminData['password'] = await bcrypt.hash(adminPassword, 10);
    await insertUser(adminData);
  }

}

export async function insertModeratorEmploymentFile() {
  const exists = await checkEmploymentFileExists();
  if (!exists) {
    await insertEmploymentFile();
  }

}