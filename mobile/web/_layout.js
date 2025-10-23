import { Stack } from 'expo-router';

export default function WebLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="admin" 
        options={{
          title: 'Admin Panel',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
