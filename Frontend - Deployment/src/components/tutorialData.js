// Documentation content data for TutorialLayout
export const navSections = [
  {
    label: "OVERVIEW",
    items: [
      { id: "introduction", title: "Introduction", icon: "bx-home-circle" },
      { id: "quick-start", title: "Quick Start Guide", icon: "bx-rocket" },
      { id: "roles", title: "User Roles", icon: "bx-group" },
    ],
  },
  {
    label: "GETTING STARTED",
    items: [
      { id: "login", title: "Login", icon: "bx-arrow-in-right-square-half" },
      { id: "register", title: "Registration", icon: "bx-user-plus" },
      {
        id: "password-recovery",
        title: "Password Recovery",
        icon: "bx-lock-open-alt",
      },
    ],
  },
  {
    label: "STUDENT GUIDE",
    items: [
      {
        id: "taking-exams",
        title: "Taking Practice Exams",
        icon: "bx-edit-alt",
      },
      { id: "timer", title: "Timer Feature", icon: "bx-timer" },
      { id: "scores", title: "Scores & Results", icon: "bx-poll" },
      {
        id: "analytics",
        title: "Performance Analytics",
        icon: "bx-chart-network",
      },
      {
        id: "subject-selection",
        title: "Subject Selection",
        icon: "bx-book-open",
      },
    ],
  },
  {
    label: "CLASSES",
    items: [
      {
        id: "classes-overview",
        title: "Classes Overview",
        icon: "bx-whiteboard-alt",
      },
      {
        id: "creating-class",
        title: "Creating a Class",
        icon: "bx-copy-plus",
      },
      { id: "joining-class", title: "Joining a Class", icon: "bx-git-merge" },
      {
        id: "managing-students",
        title: "Managing Students",
        icon: "bx-user-check",
      },
      {
        id: "archiving-classes",
        title: "Archiving Classes",
        icon: "bx-folder-zip",
      },
    ],
  },
  {
    label: "QUIZZES",
    items: [
      {
        id: "quizzes-overview",
        title: "Quizzes Overview",
        icon: "bx-whiteboard",
      },
      {
        id: "creating-quiz",
        title: "Creating a Quiz",
        icon: "bx-book-add",
      },
      {
        id: "assigning-quiz",
        title: "Assigning to Classes",
        icon: "bx-share",
      },
      { id: "taking-quiz", title: "Taking a Quiz", icon: "bx-play-circle" },
      {
        id: "quiz-results",
        title: "Quiz Results & History",
        icon: "bx-history",
      },
    ],
  },
  {
    label: "FACULTY GUIDE",
    items: [
      {
        id: "adding-questions",
        title: "Adding Questions",
        icon: "bx-plus-circle",
      },
      {
        id: "editing-questions",
        title: "Editing Questions",
        icon: "bx-pencil",
      },
      {
        id: "approval-workflow",
        title: "Approval Workflow",
        icon: "bx-badge-check",
      },
      {
        id: "difficulty",
        title: "Difficulty Selection",
        icon: "bx-slider-alt",
      },
      { id: "printing-exams", title: "Printing Exams", icon: "bx-printer" },
    ],
  },
  {
    label: "PROGRAM CHAIR",
    items: [
      {
        id: "approving-questions",
        title: "Approving Questions",
        icon: "bx-check-shield",
      },
      {
        id: "managing-subjects",
        title: "Managing Subjects",
        icon: "bx-library",
      },
      { id: "viewing-reports", title: "Viewing Reports", icon: "bx-file" },
    ],
  },
  {
    label: "ADMIN / DEAN",
    items: [
      {
        id: "user-management",
        title: "User Management",
        icon: "bx-user-check",
      },
      { id: "system-oversight", title: "System Oversight", icon: "bx-cog" },
      { id: "role-assignment", title: "Role Assignment", icon: "bx-id-card" },
      {
        id: "printing-official",
        title: "Printing Official Exams",
        icon: "bx-printer",
      },
    ],
  },
  {
    label: "QUESTION BANK",
    items: [
      {
        id: "categorized-questions",
        title: "Categorized Questions",
        icon: "bx-category",
      },
      { id: "filtering", title: "Subject Filtering", icon: "bx-filter-alt" },
      {
        id: "difficulty-levels",
        title: "Difficulty Levels",
        icon: "bx-signal-4",
      },
      {
        id: "randomization",
        title: "Randomized Questions",
        icon: "bx-shuffle",
      },
    ],
  },
  {
    label: "HELP",
    items: [{ id: "faq", title: "FAQ", icon: "bx-help-circle" }],
  },
];

// Placeholder screenshot component props
export const placeholderImages = {
  login: {
    label: "Login Page",
    caption:
      "The login screen where users enter their credentials to access the system.",
  },
  register: {
    label: "Registration Form",
    caption:
      "New users can register by filling out the registration form with required details.",
  },
  recovery: {
    label: "Password Recovery",
    caption: "Use the forgot password link to receive a reset email.",
  },
  dashboard: {
    label: "Student Dashboard",
    caption:
      "Overview of your recent activity, scores, and upcoming practice exams.",
  },
  exam: {
    label: "Practice Exam Interface",
    caption: "The exam-taking interface with questions, timer, and navigation.",
  },
  timer: {
    label: "Timer Feature",
    caption: "A countdown timer tracks remaining time during timed exams.",
  },
  results: {
    label: "Scores & Results",
    caption: "View detailed results after completing a practice exam.",
  },
  analytics: {
    label: "Performance Analytics",
    caption: "Charts and graphs showing your performance trends over time.",
  },
  subjects: {
    label: "Subject Selection",
    caption: "Browse and select subjects to practice.",
  },
  addQuestion: {
    label: "Add Question Form",
    caption:
      "Faculty can add new questions with multiple choices and correct answers.",
  },
  editQuestion: {
    label: "Edit Question",
    caption: "Modify existing questions, choices, and difficulty settings.",
  },
  approvalFlow: {
    label: "Approval Workflow",
    caption: "Questions move through a review and approval pipeline.",
  },
  difficultySelect: {
    label: "Difficulty Selection",
    caption: "Set difficulty levels: Easy, Medium, or Hard.",
  },
  printExam: {
    label: "Print Exam Preview",
    caption: "Preview and print formatted exam papers.",
  },
  approveQ: {
    label: "Question Approval Panel",
    caption: "Program Chairs review and approve pending questions.",
  },
  manageSubjects: {
    label: "Subject Management",
    caption: "Add, edit, or archive subjects within the system.",
  },
  reports: {
    label: "Reports Dashboard",
    caption: "View system-wide reports and analytics.",
  },
  userMgmt: {
    label: "User Management",
    caption: "Manage user accounts, roles, and permissions.",
  },
  systemOverview: {
    label: "System Overview",
    caption: "Monitor system health and overall statistics.",
  },
  roleAssign: {
    label: "Role Assignment",
    caption:
      "Assign roles to users: Student, Faculty, Program Chair, or Admin.",
  },
  printOfficial: {
    label: "Official Exam Print",
    caption: "Generate and print official qualifying examination papers.",
  },
  questionBank: {
    label: "Question Bank",
    caption: "Browse the categorized question bank with filters.",
  },
  filtering: {
    label: "Subject Filtering",
    caption: "Filter questions by subject, difficulty, and status.",
  },
  diffLevels: {
    label: "Difficulty Levels",
    caption: "Questions are categorized into Easy, Medium, and Hard.",
  },
  randomize: {
    label: "Randomization Settings",
    caption: "Configure how questions are randomized for each exam attempt.",
  },
  classOverview: {
    label: "Classes Page",
    caption: "View and manage all your classes in one place.",
  },
  createClass: {
    label: "Create Class Modal",
    caption:
      "Fill out the form to create a new class with a unique class code.",
  },
  joinClass: {
    label: "Join Class Form",
    caption: "Students enter a 6-character class code to join a class.",
  },
  manageStudents: {
    label: "Class Students View",
    caption: "Faculty can see enrolled students and manage the class roster.",
  },
  quizLibrary: {
    label: "Quiz Library",
    caption:
      "Browse, create, and manage personal quizzes from the Libraries page.",
  },
  createQuiz: {
    label: "Create Quiz Wizard",
    caption:
      "Step-by-step wizard to create a new quiz: set title, type, subject, and coverage.",
  },
  assignQuiz: {
    label: "Assign Quiz Modal",
    caption: "Select a class and configure dates to assign a quiz to students.",
  },
  takeQuiz: {
    label: "Quiz Taking Interface",
    caption:
      "Students answer questions within the quiz interface with a timer.",
  },
  quizHistory: {
    label: "Quiz History View",
    caption: "View past quiz attempts with scores and completion dates.",
  },
};

export const faqData = [
  {
    q: "How do I reset my password?",
    a: 'Click the "Forgot Password" link on the login page. Enter your registered email address, and you will receive a password reset link. Follow the instructions in the email to create a new password.',
  },
  {
    q: "Can I retake a practice exam?",
    a: "Yes! You can retake practice exams as many times as you like. Each attempt generates a new set of randomized questions from the question bank, so you'll get a different experience each time.",
  },
  {
    q: "How are questions approved?",
    a: "Faculty members create and submit questions. These go through an approval workflow where the Program Chair reviews each question for accuracy and relevance before it becomes available in the question bank.",
  },
  {
    q: "What roles are available in the system?",
    a: "There are four main roles: Student (take exams, view results), Faculty (create/manage questions), Program Chair (approve questions, manage subjects), and Admin/Dean (system oversight, user management).",
  },
  {
    q: "How does the timer work during exams?",
    a: "When you start a timed practice exam, a countdown timer appears at the top of the screen. The exam automatically submits when the timer reaches zero. You can also submit early if you finish before time runs out.",
  },
  {
    q: "Can I print my exam results?",
    a: "Faculty and Admin roles can print formatted exam papers. Students can view their results on-screen with detailed breakdowns of correct and incorrect answers.",
  },
  {
    q: "How are questions randomized?",
    a: "The system randomly selects questions from the question bank based on the subject and difficulty settings configured for each exam. This ensures each attempt provides a unique experience.",
  },
  {
    q: "Who can I contact for technical support?",
    a: "Use the Support link in the top-right menu of the application. You can also reach out to your Program Chair or the system administrator for assistance.",
  },
  {
    q: "How do I create a class?",
    a: "Faculty, Program Chairs, and Admins can create classes from the Classes page. Click the '+' button, fill in the class name and schedule, and a unique 6-character class code will be generated automatically.",
  },
  {
    q: "How do students join a class?",
    a: "Students can join a class by entering the 6-character class code provided by their instructor. Go to the Classes page and click 'Join a Class' to enter the code.",
  },
  {
    q: "What's the difference between a practice exam and a quiz?",
    a: "Practice exams draw questions from the official question bank and are available to all students for a subject. Quizzes are custom-created by faculty in the Libraries section and can be assigned to specific classes with deadlines and attempt limits.",
  },
];
