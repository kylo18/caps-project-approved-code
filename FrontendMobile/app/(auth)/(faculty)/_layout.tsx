import { Stack } from 'expo-router';

export default function FacultyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="subjects" />
      <Stack.Screen name="users" />
    </Stack>
  );
}
