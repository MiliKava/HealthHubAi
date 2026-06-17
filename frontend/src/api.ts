import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Note: use env variable in production
  withCredentials: true, // This is critical for sending and receiving cookies
});

export default api;
