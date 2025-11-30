import { Stack, router } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    // Redirect to /admin on initial load
    router.replace('/admin');
  }, []);

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="admin" 
        options={{
          title: 'Admin Dashboard',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
