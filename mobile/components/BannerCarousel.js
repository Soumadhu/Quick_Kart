import React, { useRef, useState, useContext } from 'react';
import { useBanners } from '../context/BannersContext';
import { View, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;
const BANNER_HEIGHT = BANNER_WIDTH * 0.4;

const BannerCarousel = () => {
  const { banners, isLoading } = useBanners();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  
  // Debug logging
  console.log('BannerCarousel - isLoading:', isLoading);
  console.log('BannerCarousel - banners:', banners);
  
  // Show loading indicator while banners are being loaded
  if (isLoading) {
    console.log('BannerCarousel - Loading banners...');
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color="#51CC5E" />
      </View>
    );
  }
  
  // Debug: Log when banners are loaded but empty
  if (!isLoading && (!banners || banners.length === 0)) {
    console.log('BannerCarousel - No banners available to display');
  }

  const renderBanner = ({ item, index }) => (
    <View style={[styles.bannerContainer, { width: BANNER_WIDTH }]}>
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.1)']}
        style={styles.gradient}
      />
      <View style={styles.bannerContent}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // If no banners, don't render anything
  if (!banners || banners.length === 0) {
    console.log('No banners to render');
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8F8F8' }]}>
      <Text style={{ color: 'black' }}>Banner Carousel</Text>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item, index) => `banner-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.paginationDot, 
              index === activeIndex && styles.activeDot
            ]} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
    minHeight: BANNER_HEIGHT,
    backgroundColor: '#F8F8F8',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  bannerContainer: {
    height: BANNER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  bannerTextContainer: {
    maxWidth: '70%',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: '#51CC5E',
  },
});

export default BannerCarousel;
