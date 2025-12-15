import axios from 'axios';

const backendApi = axios.create({
    baseURL: '/api/webapp/v1/',
    
    // CRITICAL: This tells the browser to send the HttpOnly 'jwt' cookie automatically
    withCredentials: true 
});

export default backendApi;