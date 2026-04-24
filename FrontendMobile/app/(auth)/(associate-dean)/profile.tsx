import { View } from 'react-native';
import { useRouter } from 'expo-router';
import RoleProfileScreen from '../../../src/features/profile/screens/RoleProfileScreen';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';

export default function AssociateDeanProfileScreen() {
  const router = useRouter();

  useScreenFloatingTools([
    {
      key: 'announcement',
      icon: 'megaphone-outline',
      label: 'Announcement',
      onPress: () => router.push('/(auth)/(associate-dean)/create-announcement'),
    },
  ]);

  return (
    <View className="flex-1">
      <RoleProfileScreen roleLabel="Associate Dean" />
    </View>
  );
}
