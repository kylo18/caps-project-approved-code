import { useState, useEffect } from "react";
import {
  clearPersistedAvatarColor,
  getPersistedAvatarColor,
  getRandomAvatarColor,
  setPersistedAvatarColor,
} from "../components/ProfileModals";
import { normalizeUserProfile } from "../utils/userProfileUtils";
import { isAuthenticated } from "../utils/authStorage";
export function useUserProfile() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [userInfo, setUserInfo] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [avatarColor, setAvatarColor] = useState("bg-gray-300");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await fetch(`${apiUrl}/user/profile`, {
          credentials: "include",
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || "Failed to fetch user info");
        }

        setUserInfo(normalizeUserProfile(body));
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserInfo();
  }, [apiUrl]);

  useEffect(() => {
    if (!userInfo) return;

    let color = getPersistedAvatarColor(userInfo);
    if (!color) {
      color = getRandomAvatarColor();
      setPersistedAvatarColor(userInfo, color);
    }
    setAvatarColor(color);
  }, [userInfo]);

  const clearUserAvatarColor = () => {
    if (userInfo) clearPersistedAvatarColor(userInfo);
  };

  return {
    userInfo,
    setUserInfo,
    isLoadingProfile,
    avatarColor,
    showProfileModal,
    setShowProfileModal,
    showChangePassword,
    setShowChangePassword,
    clearUserAvatarColor,
  };
}
