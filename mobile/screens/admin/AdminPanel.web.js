import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  SafeAreaView,
  Alert,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Icons from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const menuItems = [
  { 
    title: 'Dashboard', 
    screen: 'AdminDashboard',
    icon: 'speedometer',
    iconSet: 'Ionicons',
    count: 0
  },
  { 
    title: 'Home Content', 
    screen: 'HomeContentManager',
    icon: 'home',
    iconSet: 'Ionicons'
  },
  { 
    title: 'Products', 
    screen: 'AdminProducts',
    icon: 'shopping-bag',
    iconSet: 'Ionicons',
    count: 125
  },
  { 
    title: 'Categories', 
    screen: 'AdminCategories',
    icon: 'grid',
    iconSet: 'Ionicons',
    count: 12
  },
  { 
    title: 'Orders', 
    screen: 'AdminOrders',
    icon: 'cart',
    iconSet: 'Ionicons',
    count: 48
  },
  { 
    title: 'Dark Store', 
    screen: 'DarkStore',
    icon: 'storefront',
    iconSet: 'Ionicons',
    count: 0
  },
  { 
    title: 'Users', 
    screen: 'AdminUsers',
    icon: 'people',
    iconSet: 'Ionicons',
    count: 89
  },
  { 
    title: 'Riders', 
    screen: 'AdminRiders',
    icon: 'bicycle',
    iconSet: 'Ionicons',
    count: 15
  },
  { 
    title: 'Settings', 
    screen: 'AdminSettings',
    icon: 'settings',
    iconSet: 'Ionicons'
  },
];

const StatCard = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <Icons.Ionicons name={icon} size={24} color={color} />
    </View>
  </View>
);

export default function AdminPanel() {
  const navigation = useNavigation();
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isMenuOpen, setMenuOpen] = useState(width > 768);

  useEffect(() => {
    console.log('AdminPanel (Web) mounted');
    return () => console.log('AdminPanel (Web) unmounted');
  }, [navigation]);

  const handleMenuItemPress = (screen, title) => {
    console.log(`Navigating to: ${screen}`);
    setActiveItem(title);
    if (navigation?.navigate) {
      navigation.navigate(screen);
    } else {
      Alert.alert('Error', 'Navigation not available');
    }
  };

  const renderMenuItem = (item, index) => {
    const Icon = Icons[item.iconSet] || Icons.Ionicons;
    const isActive = activeItem === item.title;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.menuItem, 
          isActive && styles.activeMenuItem
        ]}
        onPress={() => handleMenuItemPress(item.screen, item.title)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer,
          isActive && { backgroundColor: '#3498db20' }
        ]}>
          <Icon 
            name={item.icon} 
            size={20} 
            color={isActive ? '#3498db' : '#7f8c8d'} 
          />
        </View>
        {isMenuOpen && (
          <>
            <Text style={[
              styles.menuText,
              isActive && { color: '#3498db', fontWeight: '600' }
            ]}>
              {item.title}
            </Text>
            {item.count !== undefined && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.count}</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const stats = [
    { title: 'Total Users', value: '1,234', icon: 'people', color: '#3498db' },
    { title: 'Total Orders', value: '567', icon: 'cart', color: '#2ecc71' },
    { title: 'Revenue', value: '$12,345', icon: 'cash', color: '#9b59b6' },
    { title: 'Success Rate', value: '89%', icon: 'trending-up', color: '#e74c3c' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        {/* Sidebar */}
        <View style={[
          styles.sidebar,
          !isMenuOpen && styles.collapsedSidebar
        ]}>
          <View style={styles.sidebarHeader}>
            {isMenuOpen && <Text style={styles.sidebarTitle}>Admin Panel</Text>}
            <TouchableOpacity 
              style={styles.menuToggle}
              onPress={() => setMenuOpen(!isMenuOpen)}
            >
              <Icons.Ionicons 
                name={isMenuOpen ? 'chevron-back' : 'menu'}
                size={24}
                color="#2c3e50"
              />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.menuContainer}>
            {menuItems.map(renderMenuItem)}
          </ScrollView>
          
          {isMenuOpen && (
            <View style={styles.sidebarFooter}>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.contentHeader}>
            <View style={styles.breadcrumb}>
              <Text style={styles.breadcrumbText}>Dashboard</Text>
              <Icons.Ionicons name="chevron-forward" size={16} color="#95a5a6" />
              <Text style={[styles.breadcrumbText, { color: '#3498db' }]}>{activeItem}</Text>
            </View>
            <View style={styles.userInfo}>
              <TouchableOpacity style={styles.notificationIcon}>
                <Icons.Ionicons name="notifications-outline" size={24} color="#7f8c8d" />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>AD</Text>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <StatCard 
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </View>

          {/* Recent Activity */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityList}>
              {[1, 2, 3, 4, 5].map((item) => (
                <View key={item} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Icons.Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      Order #{1000 + item} has been delivered successfully
                    </Text>
                    <Text style={styles.activityTime}>2 hours ago</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100vh',
  },
  // Sidebar Styles
  sidebar: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#eaeff2',
    transition: 'all 0.3s ease',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  collapsedSidebar: {
    width: 80,
  },
  sidebarHeader: {
    height: 70,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeff2',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  menuToggle: {
    padding: 5,
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 4,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  activeMenuItem: {
    backgroundColor: '#f0f7ff',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eaeff2',
  },
  versionText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
  },
  
  // Main Content Styles
  mainContent: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 24,
    overflow: 'auto',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Card Styles
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewAllText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Activity List
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
  
  // Responsive Styles
  '@media (max-width: 992px)': {
    statsContainer: {
      flexDirection: 'column',
    },
    statCard: {
      width: '100%',
    },
  },
  '@media (max-width: 768px)': {
    container: {
      flexDirection: 'column',
    },
    sidebar: {
      width: '100%',
      height: 60,
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      top: 'auto',
      borderRightWidth: 0,
      borderTopWidth: 1,
      borderTopColor: '#eaeff2',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 0,
    },
    collapsedSidebar: {
      width: '100%',
      height: 60,
    },
    sidebarHeader: {
      display: 'none',
    },
    menuContainer: {
      flexDirection: 'row',
      overflowX: 'auto',
      padding: 0,
      flex: 1,
      height: '100%',
    },
    menuItem: {
      flexDirection: 'column',
      padding: 8,
      minWidth: 70,
      margin: 0,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      borderRadius: 0,
    },
    menuText: {
      fontSize: 10,
      marginTop: 4,
      textAlign: 'center',
    },
    iconContainer: {
      margin: 0,
      width: 32,
      height: 32,
    },
    mainContent: {
      paddingBottom: 80,
      padding: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    statCard: {
      minWidth: 'calc(50% - 8px)',
    },
  },
  '@media (max-width: 480px)': {
    statCard: {
      minWidth: '100%',
    },
  },
});