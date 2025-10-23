import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          // This hides the home screen from the stack header
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
