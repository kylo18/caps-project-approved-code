import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../src/contexts/ThemeContext';

const EBAO_IMAGE = require('../assets/ebao.jpg');
const TAN_IMAGE = require('../assets/tan.jpg');
const APAT_IMAGE = require('../assets/apat.jpg');
const SABS_IMAGE = require('../assets/sabs.png');

interface Developer {
  name: string;
  role: string;
  course: string;
  description: string;
  image: any;
  themeColor: string;
  facebook: string;
}

const developers: Developer[] = [
  {
    name: 'Darjay Roy S. Ebao',
    role: 'Project Manager',
    course: 'BSCpE 2',
    description:
      'Responsible for project scheduling, feature prioritization, and team coordination to deliver a responsive, role-based web application.',
    image: EBAO_IMAGE,
    themeColor: '#10B981',
    facebook: 'https://www.facebook.com/YezzDarj',
  },
  {
    name: 'Vincent Carl G. Tan',
    role: 'Frontend Developer',
    course: 'BSCpE 2',
    description:
      'Tasked with crafting responsive user interfaces, implementing dynamic interactions, and ensuring a smooth and consistent user experience across all devices.',
    image: TAN_IMAGE,
    themeColor: '#FE6902',
    facebook: 'https://www.facebook.com/vincent.tan.412338',
  },
  {
    name: 'Kent P. Apat',
    role: 'Backend Developer',
    course: 'BSCpE 2',
    description:
      'Responsible for developing and maintaining server-side logic, managing database interactions, and ensuring secure and efficient data flow across the system.',
    image: APAT_IMAGE,
    themeColor: '#FE6902',
    facebook: 'https://www.facebook.com/kent.toyex',
  },
  {
    name: 'Carlos Miguel P. Sabijon',
    role: 'QA Tester, Documentation and Deployment Specialist',
    course: 'BSCpE 2',
    description:
      'Tasked with verifying functionality, identifying UI/UX issues, and ensuring a consistent experience across devices and browsers.',
    image: SABS_IMAGE,
    themeColor: '#6366F1',
    facebook: 'https://www.facebook.com/carlos.sabijon',
  },
];

export default function TeamCapsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#0F0F0F' : '#F7F8FA',
    cardBg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#F5F5F5' : '#111827',
    textSecondary: isDark ? '#A3A3A3' : '#6B7280',
    border: isDark ? '#2A2A2A' : '#E5E7EB',
    headerBg: isDark ? '#141414' : '#FFFFFF',
    backBtnBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
  };

  const handleOpenFacebook = async (url: string) => {
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (err) {
      // Fallback to React Native linking
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3 border-b"
        style={{ backgroundColor: colors.headerBg, borderColor: colors.border }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: colors.backBtnBg }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Meet the Team
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Intro */}
        <View className="mb-6 items-center">
          <Text className="text-2xl font-black text-center mb-2" style={{ color: colors.text }}>
            Team Caps
          </Text>
          <Text className="text-center text-sm leading-5 px-2" style={{ color: colors.textSecondary }}>
            The talented developers behind CAPS who worked tirelessly to bring this vision to life.
          </Text>
        </View>

        {/* Developer List */}
        {developers.map((dev, index) => (
          <View
            key={index}
            className="mb-6 rounded-3xl border overflow-hidden"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {/* Developer Image */}
            <View style={{ height: 220, position: 'relative', width: '100%', overflow: 'hidden' }}>
              <Image
                source={dev.image}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>

            {/* Content info */}
            <View className="p-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                  {dev.name}
                </Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${dev.themeColor}15` }}
                >
                  <Text className="text-xs font-bold" style={{ color: dev.themeColor }}>
                    {dev.course}
                  </Text>
                </View>
              </View>

              <Text className="text-sm font-semibold mb-3" style={{ color: dev.themeColor }}>
                {dev.role}
              </Text>

              <Text className="text-sm leading-5 mb-4" style={{ color: colors.textSecondary }}>
                {dev.description}
              </Text>

              <TouchableOpacity
                onPress={() => handleOpenFacebook(dev.facebook)}
                className="flex-row items-center justify-center gap-2 py-3 rounded-xl w-full"
                style={{ backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }}
                activeOpacity={0.7}
              >
                <FontAwesome name="facebook-square" size={16} color="#1877F2" />
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  View Facebook Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Footer */}
        <View className="mt-8 mb-6 items-center">
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Built with ❤️ for Software Design Project
          </Text>
          <Text className="text-[10px] mt-1" style={{ color: colors.textSecondary }}>
            © {new Date().getFullYear()} All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
