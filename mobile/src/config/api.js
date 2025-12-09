// Base URL for your API
import { getApiBaseUrl } from '../services/apiConfig';

// Get the base URL and ensure it doesn't end with a slash
const baseUrl = getApiBaseUrl();
const API_URL = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

export { API_URL };
