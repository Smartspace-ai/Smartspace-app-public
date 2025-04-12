import axios from 'axios';

// Create a Graph API instance with no baseURL and no default headers
// This allows full flexibility per request (e.g. for blobs, JSON, etc.)
const GraphAPI = axios.create();

export default GraphAPI;
