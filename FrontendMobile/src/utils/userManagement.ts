export type UserLike = {
  status?: string | null;
  isActive?: boolean | null;
  programName?: string | null;
  campusName?: string | null;
  yearLevel?: number | string | null;
  year_level?: number | string | null;
  yearLevelName?: string | null;
  year_level_name?: string | null;
  student_profile?: { year_level?: number | string | null; year_level_name?: string | null } | null;
  studentProfile?: { yearLevel?: number | string | null; yearLevelName?: string | null } | null;
  program?: any;
  campus?: any;
};

export type UserStatusFilter = 'all' | 'pending' | 'approved' | 'active' | 'inactive' | 'disapproved';

function normalizedStatus(value: string | null | undefined) {
  return String(value || 'pending').trim().toLowerCase();
}

export function isPendingUser(user: UserLike) {
  return normalizedStatus(user.status) === 'pending';
}

export function isDisapprovedUser(user: UserLike) {
  return normalizedStatus(user.status) === 'disapproved';
}

export function isRegisteredUser(user: UserLike) {
  return normalizedStatus(user.status) === 'registered';
}

export function isActiveUser(user: UserLike) {
  return isRegisteredUser(user) && user.isActive !== false;
}

export function isInactiveUser(user: UserLike) {
  return isRegisteredUser(user) && user.isActive === false;
}

export function canApproveUser(user: UserLike) {
  return isPendingUser(user);
}

export function getUserStatusFilterKey(user: UserLike): Exclude<UserStatusFilter, 'all'> {
  if (isPendingUser(user)) return 'pending';
  if (isDisapprovedUser(user)) return 'disapproved';
  if (isInactiveUser(user)) return 'inactive';
  if (isRegisteredUser(user)) return 'active';
  return 'pending';
}

export function matchesUserStatusFilter(user: UserLike, filter: UserStatusFilter) {
  if (filter === 'all') return true;
  if (filter === 'approved') return isRegisteredUser(user);
  return getUserStatusFilterKey(user) === filter;
}

export function getUserStatusLabel(user: UserLike) {
  const key = getUserStatusFilterKey(user);

  if (key === 'active') return 'Active';
  if (key === 'inactive') return 'Inactive';
  if (key === 'disapproved') return 'Disapproved';
  return 'Pending';
}

export function getUserProgramLabel(user: UserLike) {
  return user.programName || user.program?.programName || user.program?.name || (typeof user.program === 'string' ? user.program : '') || '';
}

export function getUserCampusLabel(user: UserLike) {
  return user.campusName || user.campus?.campusName || user.campus?.name || (typeof user.campus === 'string' ? user.campus : '') || '';
}

export function getUserYearLevelValue(user: UserLike) {
  return (
    user.yearLevel ||
    user.year_level ||
    user.student_profile?.year_level ||
    user.studentProfile?.yearLevel ||
    ''
  );
}

export function getUserYearLevelLabel(user: UserLike) {
  const yearValue = getUserYearLevelValue(user);
  if (yearValue) {
    return `Year ${yearValue}`;
  }

  return (
    user.yearLevelName ||
    user.year_level_name ||
    user.student_profile?.year_level_name ||
    user.studentProfile?.yearLevelName ||
    ''
  );
}

export function applyUserActionLocally<T extends UserLike>(user: T, action: 'approve' | 'activate' | 'deactivate') {
  if (action === 'approve') {
    return { ...user, status: 'registered', isActive: true };
  }

  if (action === 'activate') {
    return { ...user, status: isRegisteredUser(user) ? user.status : 'registered', isActive: true };
  }

  return { ...user, status: isRegisteredUser(user) ? user.status : 'registered', isActive: false };
}
