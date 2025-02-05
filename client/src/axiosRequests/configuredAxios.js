import axios from 'axios'
import {serverUrl} from '../config/serverConfig.js'

export default axios.create({
  baseURL: serverUrl,
  headers: {'Content-Type': 'application/json'},
  withCredentials: true
});
