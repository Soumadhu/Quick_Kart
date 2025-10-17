import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, Easing } from 'react-native';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start fade out animation after 1.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // 0.5 second fade out
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('HomeTabs');
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim]);

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        <Animated.Text 
          style={[
            styles.title,
            {
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }],
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [0, 0.9, 1],
              })
            }
          ]}
        >
          QUICKKART
        </Animated.Text>
        <Animated.Text 
          style={[
            styles.subtitle,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.8, 1],
              }),
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }
          ]}
        >
          Your Quick Shopping Partner
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8C400',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontFamily: 'System',
    fontWeight: '500',
  },
});
