import ProfileModals from "./ProfileModals";

const ProfileModalsHost = ({ profile, showToast }) => (
  <ProfileModals
    showProfileModal={profile.showProfileModal}
    setShowProfileModal={profile.setShowProfileModal}
    showChangePassword={profile.showChangePassword}
    setShowChangePassword={profile.setShowChangePassword}
    userInfo={profile.userInfo}
    setUserInfo={profile.setUserInfo}
    isLoadingProfile={profile.isLoadingProfile}
    avatarColor={profile.avatarColor}
    showToast={showToast}
  />
);

export default ProfileModalsHost;
