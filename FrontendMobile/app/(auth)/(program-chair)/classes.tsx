import ClassesScreen from '../../../src/features/classes/screens/ClassesScreen';

export default function RoleClassesScreen() {
  return (
    <ClassesScreen 
      title="Program Classes"
      description="Review classes, manage enrolled students, and track progress within your program."
      emptyMessage="Program classes will appear here once they are assigned."
      rolePath="/(program-chair)"
    />
  );
}
