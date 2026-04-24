import ClassesScreen from '../../../src/features/classes/screens/ClassesScreen';

export default function RoleClassesScreen() {
  return (
    <ClassesScreen 
      title="My Classes"
      description="Open a class to manage students, assign subjects, and configure assessments."
      emptyMessage="Your assigned classes will appear here."
      rolePath="/(faculty)"
    />
  );
}
