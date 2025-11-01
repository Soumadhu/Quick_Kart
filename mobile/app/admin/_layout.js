import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8f9fa',
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#2c3e50',
        },
        headerTintColor: '#3498db',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen 
        name="panel" 
        options={{
          title: 'Admin Panel',
        }}
      />
      <Stack.Screen 
        name="HomeContentManager" 
        options={{
          title: 'Manage Home Content',
        }}
      />
      <Stack.Screen 
        name="AdminProducts" 
        options={{
          title: 'Manage Products',
        }}
      />
      <Stack.Screen 
        name="AdminCategories" 
        options={{
          title: 'Manage Categories',
        }}
      />
      <Stack.Screen 
        name="AdminOrders" 
        options={{
          title: 'Manage Orders',
        }}
      />
      <Stack.Screen 
        name="AdminUsers" 
        options={{
          title: 'Manage Users',
        }}
      />
      <Stack.Screen 
        name="AdminSettings" 
        options={{
          title: 'Admin Settings',
        }}
      />
    </Stack>
  );
}
