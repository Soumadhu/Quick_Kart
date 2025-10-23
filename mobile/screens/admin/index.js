import { Platform } from 'react-native';

// Import the appropriate component based on the platform
const AdminPanel = Platform.select({
  web: () => require('./AdminPanel.web').default,
  default: () => require('./AdminPanel.native').default,
})();

export default AdminPanel;
