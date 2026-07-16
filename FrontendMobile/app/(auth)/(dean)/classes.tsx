import ClassesScreen from '../../../src/features/classes/screens/ClassesScreen';

export default function RoleClassesScreen() {
  return (
    <ClassesScreen 
      title="All Classes"
      description="Review classes, manage students, and track overall progress."
      emptyMessage="Classes will appear here once they are created or assigned."
      rolePath="/(dean)"
    />
  );
}
