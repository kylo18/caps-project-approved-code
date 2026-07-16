import { View } from 'react-native';
import RoleProfileScreen from '../../../src/features/profile/screens/RoleProfileScreen';

export default function ProgramChairProfileScreen() {
  return (
    <View className="flex-1">
      <RoleProfileScreen roleLabel="Program Chair" />
    </View>
  );
}
