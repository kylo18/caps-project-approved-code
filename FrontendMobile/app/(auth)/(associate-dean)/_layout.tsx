import { Stack } from 'expo-router';

export default function AssociateDeanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="subjects" />
      <Stack.Screen name="users" />
    </Stack>
  );
}
