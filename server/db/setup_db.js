import pool from './connection_db.js'


export async function createCollections() {
  if( ! await pool.collection('movies').exists() ) {
    await pool.collection('movies').create();
  }
  if( ! await pool.collection('series').exists() ) {
    await pool.collection('series').create();
  }
  if( ! await pool.collection('users').exists() ) {
    await pool.collection('users').create();
  }
  if( ! await pool.collection('watch_groups').exists() ) {
    await pool.collection('watch_groups').create();
    // group for watching series/movies
  }
  if( ! await pool.collection('genres').exists() ) {
    await pool.collection('genres').create();
  }
  if( ! await pool.collection('opinion_threads').exists() ) {
    await pool.collection('opinion_threads').create();
    // thread to share opinions on series/movies
  }
  
}

export async function createEdgeCollections() {
  if( ! await pool.collection('joined_group').exists() ) {
    await pool.createEdgeCollection('joined_group');
  }
  if( ! await pool.collection('follows_thread').exists() ) {
    await pool.createEdgeCollection('follows_thread');
  }
  if( ! await pool.collection('likes').exists() ) {
    await pool.createEdgeCollection('likes');
  }
  if( ! await pool.collection('his_type').exists() ) {
    await pool.createEdgeCollection('his_type');
  }

}