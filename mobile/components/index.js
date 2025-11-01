import { Platform } from 'react-native';

// This file exists to handle platform-specific imports
let BannerCarousel;

if (Platform.OS === 'web') {
  BannerCarousel = require('./BannerCarousel.web').default;
} else {
  BannerCarousel = require('./BannerCarousel').default;
}

export { BannerCarousel };
