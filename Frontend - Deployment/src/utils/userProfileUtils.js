export function normalizeUserProfile(responseBody) {
  if (!responseBody) return null;

  const profile = responseBody.data ?? responseBody;

  const getLabel = (value, keys = ["name", "programName", "roleName"]) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    for (const key of keys) {
      if (value[key]) return value[key];
    }
    return "";
  };

  const firstName = profile.firstName || "";
  const lastName = profile.lastName || "";
  const fullName =
    profile.fullName || `${firstName} ${lastName}`.trim() || profile.name || "";

  const approvalStatus =
    typeof profile.status === "string"
      ? profile.status
      : getLabel(profile.status);

  const campusID =
    profile.campusID ??
    profile.campus?.campusID ??
    profile.campus?.id ??
    null;
  const programID =
    profile.programID ??
    profile.program?.programID ??
    profile.program?.id ??
    null;

  return {
    ...profile,
    firstName,
    lastName,
    fullName,
    roleID: profile.roleID ?? profile.role?.roleID ?? profile.role?.id,
    roleName:
      profile.roleName ||
      getLabel(profile.role, ["name", "roleName"]) ||
      profile.position ||
      "",
    campusID,
    campusName:
      profile.campusName || getLabel(profile.campus, ["name", "campusName"]),
    programID,
    programName:
      profile.programName ||
      getLabel(profile.program, ["programName", "name"]),
    approvalStatus,
    accountStatus:
      profile.accountStatus ||
      (profile.isActive === true
        ? "Active"
        : profile.isActive === false
          ? "Inactive"
          : ""),
  };
}
