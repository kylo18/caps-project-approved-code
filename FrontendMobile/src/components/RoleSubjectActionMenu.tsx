/**
 * @deprecated Use AdminFloatingTools from './admin/AdminFloatingTools' directly.
 * This component is kept for backward compatibility.
 */
import AdminFloatingTools, { AdminToolAction } from './admin/AdminFloatingTools';

export type MenuAction = AdminToolAction;

type RoleSubjectActionMenuProps = {
  actions: MenuAction[];
  bottom?: number;
  right?: number;
};

export default function RoleSubjectActionMenu({ actions, bottom = 96, right = 20 }: RoleSubjectActionMenuProps) {
  return <AdminFloatingTools actions={actions} bottom={bottom} right={right} />;
}
