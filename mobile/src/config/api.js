// Base URL for your API
import { getApiBaseUrl } from '../services/apiConfig';
const API_URL = getApiBaseUrl(); // Get dynamic API URL server

// For Android emulator, use the following instead:
// const API_URL = 'http://10.0.2.2:3000';

// For physical device, use your computer's IP address:
// const API_URL = 'http://YOUR_COMPUTER_IP:3000';

export { API_URL };
