import React from "react";

import startImg from "../assets/help/start.png";

import loginImg from "../assets/help/login.png";

import register1Img from "../assets/help/register1.png";
import register2Img from "../assets/help/register2.png";
import register3Img from "../assets/help/register3.png";
import register4Img from "../assets/help/register4.png";

import forgotpassImg from "../assets/help/forgotpass.png";

/* ─── Reusable building blocks ─── */

export const ScreenshotPlaceholder = ({ label, caption, image }) => (
  <div className="my-6 rounded-xl border border-gray-200 bg-white p-2 shadow-sm sm:p-4">
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      {image ? (
        <img src={image} alt={label} className="block h-auto w-full" />
      ) : (
        <div className="flex h-52 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="text-center">
            <i className="bx bx-image text-5xl text-gray-300"></i>
            <p className="mt-2 text-sm font-medium text-gray-400">{label}</p>
          </div>
        </div>
      )}
    </div>
    {caption && (
      <div className="mt-3 px-2">
        <p className="text-center text-sm text-gray-500 italic">{caption}</p>
      </div>
    )}
  </div>
);

export const InfoBox = ({ children, type = "info" }) => {
  const styles = {
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: "bx-info-circle text-blue-500",
      text: "text-blue-800",
    },
    tip: {
      bg: "bg-emerald-50 border-emerald-200",
      icon: "bx-bulb text-emerald-500",
      text: "text-emerald-800",
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      icon: "bx-error text-amber-500",
      text: "text-amber-800",
    },
    important: {
      bg: "bg-purple-50 border-purple-200",
      icon: "bx-star text-purple-500",
      text: "text-purple-800",
    },
  };
  const s = styles[type] || styles.info;
  return (
    <div
      className={`my-4 flex items-start gap-3 rounded-lg border ${s.bg} p-4`}
    >
      <i className={`bx ${s.icon} mt-0.5 text-xl`}></i>
      <div className={`text-sm leading-relaxed ${s.text}`}>{children}</div>
    </div>
  );
};

export const StepList = ({ steps }) => (
  <div className="my-5 space-y-4">
    {steps.map((step, i) => {
      const isAfterImage = i > 0 && typeof steps[i - 1] !== "string";
      return typeof step === "string" ? (
        <p
          key={i}
          className={`text-sm leading-relaxed text-gray-700 ${
            isAfterImage ? "!mt-12" : ""
          }`}
        >
          {step}
        </p>
      ) : (
        <React.Fragment key={i}>{step}</React.Fragment>
      );
    })}
  </div>
);

export const FeatureCard = ({ icon, title, description }) => (
  <div className="group rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-orange-200 hover:shadow-md">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-500 transition-colors group-hover:bg-orange-100">
      <i className={`bx ${icon} text-xl`}></i>
    </div>
    <h4 className="mb-1 text-sm font-semibold text-gray-800">{title}</h4>
    <p className="text-xs leading-relaxed text-gray-500">{description}</p>
  </div>
);

export const SectionHeader = ({ tag, title, subtitle }) => (
  <div className="mb-6">
    {tag && (
      <span className="mb-2 inline-block text-xs font-bold tracking-widest text-orange-500 uppercase">
        {tag}
      </span>
    )}
    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    {subtitle && (
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{subtitle}</p>
    )}
  </div>
);

const Divider = () => <hr className="my-10 border-gray-200" />;

/* ─── SECTION: Introduction ─── */
export const IntroductionSection = () => (
  <div>
    <SectionHeader
      tag="Overview"
      title="Welcome to CAPS"
      subtitle="A comprehensive web-based platform designed to help students prepare for exams through practice tests, while giving faculty and administrators the tools they need to manage questions, subjects, and results."
    />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FeatureCard
        icon="bx-edit-alt"
        title="Practice Exams"
        description="Take timed practice exams with randomized questions across multiple subjects."
      />
      <FeatureCard
        icon="bx-whiteboard"
        title="Classes"
        description="Organize students, distribute custom quizzes, and track group performance."
      />
      <FeatureCard
        icon="bx-whiteboard-alt"
        title="Custom Quizzes"
        description="Faculty can create, manage, and assign specific quizzes directly to their classes."
      />
      <FeatureCard
        icon="bx-certification"
        title="Qualifying Exams"
        description="Prepare for your qualifying exams with targeted assessments designed to build mastery."
      />
      <FeatureCard
        icon="bx-chart-network"
        title="Performance Analytics"
        description="Track your progress with detailed score breakdowns and performance trends."
      />
      <FeatureCard
        icon="bx-bank"
        title="Question Bank"
        description="A growing library of categorized questions organized by subject and difficulty."
      />
      <FeatureCard
        icon="bx-badge-check"
        title="Approval System"
        description="Built-in review and approval workflow to ensure question quality."
      />
      <FeatureCard
        icon="bx-group"
        title="Role-Based Access"
        description="Tailored experiences for Students, Faculty, Program Chairs, and Admins."
      />
      <FeatureCard
        icon="bx-printer"
        title="Print Exams"
        description="Generate and print formatted exam papers for official use."
      />
    </div>
    <Divider />
  </div>
);

/* ─── SECTION: Quick Start ─── */
export const QuickStartSection = () => (
  <div>
    <SectionHeader
      tag="Getting Started"
      title="Quick Start Guide"
      subtitle="Get up and running in just a few simple steps."
    />
    <StepList
      steps={[
        "To get started, navigate to the login page and securely sign in using your credentials. If you are a new user, simply click the 'Register' button to create your account.",
        <ScreenshotPlaceholder
          label="Quic Start"
          caption="The landing page of CAPS"
          image={startImg}
        />,

        "Once you have successfully logged in, you will be automatically directed to your role-specific dashboard. Students will see their available exam options, while Faculty members will have access to question management tools.",
        "As a student, you can easily select a subject and immediately begin a timed practice exam to test your knowledge.",
        "After completing an exam, you can thoroughly review your results, which include question breakdowns and comprehensive performance analytics to help you identify areas for improvement.",
        "Feel free to explore the sidebar navigation at any time to access all the features and tools available specifically for your assigned role.",
      ]}
    />
    <Divider />
  </div>
);

/* ─── SECTION: Roles ─── */
export const RolesSection = () => (
  <div>
    <SectionHeader
      tag="Overview"
      title="User Roles"
      subtitle="The system supports four distinct roles, each with tailored access and capabilities."
    />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[
        {
          icon: "bx-user",
          role: "Student",
          desc: "Take practice exams, view scores, track performance, and access study materials.",
          color: "bg-blue-50 text-blue-500",
        },
        {
          icon: "bx-whiteboard",
          role: "Faculty",
          desc: "Create, edit, and manage questions. Submit questions for approval and print exams.",
          color: "bg-emerald-50 text-emerald-500",
        },
        {
          icon: "bx-shield-quarter",
          role: "Program Chair",
          desc: "Approve questions, manage subjects, and view analytical reports.",
          color: "bg-purple-50 text-purple-500",
        },
        {
          icon: "bx-crown",
          role: "Associate Dean / Dean",
          desc: "Full system oversight, user management, role assignment, and official exam printing.",
          color: "bg-amber-50 text-amber-500",
        },
      ].map((r) => (
        <div
          key={r.role}
          className="flex gap-4 rounded-xl border border-gray-200 p-5"
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r.color}`}
          >
            <i className={`bx ${r.icon} text-2xl`}></i>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800">{r.role}</h4>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {r.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
    <Divider />
  </div>
);

/* ─── SECTION: Login ─── */
export const LoginSection = () => (
  <div>
    <SectionHeader
      tag="Authentication"
      title="User Login"
      subtitle="Access your account securely with your registered email and password."
    />
    <StepList
      steps={[
        "Begin by opening the application in your preferred web browser to access the main landing page.",
        "In the provided login form, carefully enter your registered ID Code into the ID Code field.",

        <ScreenshotPlaceholder
          label="Login Page"
          caption="The login screen where users enter their credentials to access the system."
          image={loginImg}
        />,
        "Next, type your secure password into the Password field, ensuring that your caps lock is off.",
        "Finally, click the 'Log In' button to authenticate your credentials and access your personalized dashboard.",
        "You can also log in via your Google gmail account",
      ]}
    />
    <InfoBox type="info">
      If you forget your password, click the <strong>"Forgot Password"</strong>{" "}
      link below the login form to initiate a password reset.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Register ─── */
export const RegisterSection = () => (
  <div>
    <SectionHeader
      tag="Authentication"
      title="Registration"
      subtitle="New users can create an account to access the system."
    />
    <StepList
      steps={[
        "To begin the account creation process, click the 'Register' button located on the main login page.",
        "Start by filling out your personal details, including your First Name and Last Name.",
        <ScreenshotPlaceholder
          label="Personal Details"
          caption="Enter your first and last name."
          image={register1Img}
        />,
        "Next, provide your Student or Employee ID Code followed by your official school Email address.",
        <ScreenshotPlaceholder
          label="Account Identifiers"
          caption="Enter your ID code and email address."
          image={register2Img}
        />,
        "Use the dropdown menus to carefully select your specific Program and Department to ensure you are placed in the correct academic group.",
        <ScreenshotPlaceholder
          label="Academic Group"
          caption="Select your program from the dropdown menus."
          image={register3Img}
        />,
        "Create a strong, secure password that is a minimum of 8 characters long, and confirm it to protect your account.",
        <ScreenshotPlaceholder
          label="Password Creation"
          caption="Set and confirm a secure password for your new account."
          image={register4Img}
        />,
        "Once all fields are accurately filled out, click the 'Create Account' button to submit your registration.",
        "After submission, your account may temporarily show as 'Waiting for Approval'. However, if your provided details perfectly align with official school data, your account will be automatically approved for immediate access. Once approved, you will receive an email notification letting you know your account is ready to use.",
      ]}
    />
    <InfoBox type="warning">
      <strong>Important:</strong> Use your official school email address for
      registration. Contact your administrator if you encounter any issues
      during registration.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Password Recovery ─── */
export const PasswordRecoverySection = () => (
  <div>
    <SectionHeader
      tag="Authentication"
      title="Password Recovery"
      subtitle="Forgot your password? Here's how to reset it securely."
    />
    <StepList
      steps={[
        "If you have forgotten your password, start by clicking the 'Forgot Password' link situated on the login page.",
        "You will be prompted to enter the email address that is currently associated with your account.",
        <ScreenshotPlaceholder
          label="Password Recovery"
          caption="Use the forgot password link to receive a reset email."
          image={forgotpassImg}
        />,
        "After submitting your email, check your inbox for a password reset link sent by the system. Don't forget to check your spam folder just in case.",
        "Click the securely provided link in the email, which will redirect you to a page where you can enter your new password.",
        "Confirm your new password by typing it again, and then click the 'Reset Password' button to finalize the change and regain access.",
      ]}
    />

    <Divider />
  </div>
);



/* ─── SECTION: Taking Exams ─── */
export const TakingExamsSection = () => (
  <div>
    <SectionHeader
      tag="Student Features"
      title="Taking Mock Exams"
      subtitle="Step-by-step guide to starting and completing a mock exam."
    />
    <StepList
      steps={[
        "To begin a new session, navigate to the Exams section using the main sidebar menu.",
        "From the available list, select the specific subject area that you want to focus your practice on.",
        "Carefully review the exam details presented to you, which include the total number of questions, the time limit, and the overall difficulty level.",
        <ScreenshotPlaceholder
          label="Practice Exam Interface"
          caption="The exam-taking interface with questions, timer, and navigation."
        />,
        "When you feel prepared and are ready to begin, click the 'Start Exam' button to launch the interface and start the timer.",
        "Read each question thoroughly and select your chosen answer from the multiple choices provided on the screen.",
        "You can efficiently use the question navigation panel to jump between different questions or review your previous answers.",
        "Once you have answered all the questions, click the 'Submit' button. Alternatively, if the time runs out, the system will automatically submit your exam for you.",
      ]}
    />
    <InfoBox type="important">
      <strong>Remember:</strong> Once you submit an exam, you cannot change your
      answers. Make sure to review your responses before submitting.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Timer ─── */
export const TimerSection = () => (
  <div>
    <SectionHeader
      tag="Student Features"
      title="Timer Feature"
      subtitle="Timed exams simulate real test conditions to help you prepare effectively."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      When a practice exam has a time limit, a countdown timer is displayed
      prominently at the top of the exam interface. The timer helps you practice
      time management — a crucial skill for actual examinations.
    </p>
    <ScreenshotPlaceholder
      label="Timer Feature"
      caption="A countdown timer tracks remaining time during timed exams."
    />
    <InfoBox type="warning">
      <strong>Auto-Submit:</strong> When the timer reaches zero, your exam is
      automatically submitted with whatever answers you've provided. A warning
      modal will appear when time is almost up.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Scores ─── */
export const ScoresSection = () => (
  <div>
    <SectionHeader
      tag="Student Features"
      title="Scores & Results"
      subtitle="Review your performance after completing each practice exam."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      After submitting a practice exam, you'll immediately see your score along
      with a detailed breakdown of each question. Review which questions you got
      right or wrong, and learn from the correct answers.
    </p>
    <ScreenshotPlaceholder
      label="Scores & Results"
      caption="View detailed results after completing a practice exam."
    />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FeatureCard
        icon="bx-check-circle"
        title="Correct Answers"
        description="See which questions you answered correctly with green highlights."
      />
      <FeatureCard
        icon="bx-x-circle"
        title="Incorrect Answers"
        description="Review wrong answers and see the correct response for each."
      />
    </div>
    <Divider />
  </div>
);

/* ─── SECTION: Analytics ─── */
export const AnalyticsSection = () => (
  <div>
    <SectionHeader
      tag="Student Features"
      title="Performance Analytics"
      subtitle="Track your progress and identify areas for improvement."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      The analytics dashboard provides visual representations of your exam
      performance over time. Identify strong subjects and areas that need more
      practice through interactive charts and statistics.
    </p>
    <ScreenshotPlaceholder
      label="Performance Analytics"
      caption="Charts and graphs showing your performance trends over time."
    />
    <InfoBox type="tip">
      <strong>Study Tip:</strong> Focus your study sessions on subjects where
      your analytics show lower scores. Consistent practice in weak areas leads
      to the biggest improvements.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Subject Selection ─── */
export const SubjectSelectionSection = () => (
  <div>
    <SectionHeader
      tag="Student Features"
      title="Subject Selection"
      subtitle="Browse and choose from available subjects to practice."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      The subject selection screen lets you browse all available subjects
      organized by program. Select a subject to view available practice exams
      and start preparing for your tests.
    </p>
    <ScreenshotPlaceholder
      label="Subject Selection"
      caption="Browse and select subjects to practice."
    />
    <Divider />
  </div>
);

/* ─── SECTION: Adding Questions ─── */
export const AddingQuestionsSection = () => (
  <div>
    <SectionHeader
      tag="Faculty Features"
      title="Adding Questions"
      subtitle="Create new questions for the practice exam question bank."
    />
    <StepList
      steps={[
        "Begin by navigating to your assigned subject area using the main sidebar menu.",
        "Once you are in the correct subject module, click the prominent 'Add Question' button to open the question editor.",
        "In the provided text editor, carefully type out the main body of your question.",
        <ScreenshotPlaceholder
          label="Add Question Form"
          caption="Faculty can add new questions with multiple choices and correct answers."
        />,
        "Next, input the possible answer choices. Typically, this involves providing four distinct options (A, B, C, and D).",
        "Make sure to mark the correct answer by explicitly selecting the corresponding choice from the options you've just provided.",
        "Assess the complexity of your question and assign an appropriate difficulty level: Easy, Medium, or Hard.",
        "Finally, click the 'Save' button. This action will submit your newly created question to the Program Chair for their review and subsequent approval.",
      ]}
    />
    <InfoBox type="info">
      Questions are saved as drafts and sent to the Program Chair for approval
      before becoming available in the question bank.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Editing Questions ─── */
export const EditingQuestionsSection = () => (
  <div>
    <SectionHeader
      tag="Faculty Features"
      title="Editing Questions"
      subtitle="Modify existing questions to keep content accurate and up-to-date."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      Faculty can edit questions they've created. Changes to approved questions
      may require re-approval from the Program Chair depending on system
      settings.
    </p>
    <ScreenshotPlaceholder
      label="Edit Question"
      caption="Modify existing questions, choices, and difficulty settings."
    />
    <Divider />
  </div>
);

/* ─── SECTION: Approval Workflow ─── */
export const ApprovalWorkflowSection = () => (
  <div>
    <SectionHeader
      tag="Faculty Features"
      title="Question Approval Workflow"
      subtitle="Understand how questions move from draft to approved status."
    />
    <div className="my-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {[
          "Faculty Creates Question",
          "Submitted for Review",
          "Program Chair Reviews",
          "Approved / Returned",
        ].map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                {i + 1}
              </div>
              <span className="text-xs font-medium text-gray-700">{step}</span>
            </div>
            {i < 3 && (
              <i className="bx bx-right-arrow-alt hidden text-xl text-gray-300 sm:block"></i>
            )}
            {i < 3 && (
              <i className="bx bx-down-arrow-alt block text-xl text-gray-300 sm:hidden"></i>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
    <ScreenshotPlaceholder
      label="Approval Workflow"
      caption="Questions move through a review and approval pipeline."
    />
    <Divider />
  </div>
);

/* ─── SECTION: Difficulty ─── */
export const DifficultySection = () => (
  <div>
    <SectionHeader
      tag="Faculty Features"
      title="Difficulty Selection"
      subtitle="Categorize questions by difficulty to create balanced exams."
    />
    <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        {
          level: "Easy",
          color: "bg-green-50 border-green-200 text-green-700",
          desc: "Basic recall and fundamental concepts.",
        },
        {
          level: "Medium",
          color: "bg-yellow-50 border-yellow-200 text-yellow-700",
          desc: "Application and analysis of concepts.",
        },
        {
          level: "Hard",
          color: "bg-red-50 border-red-200 text-red-700",
          desc: "Complex problem-solving and critical thinking.",
        },
      ].map((d) => (
        <div key={d.level} className={`rounded-xl border p-4 ${d.color}`}>
          <h4 className="text-sm font-bold">{d.level}</h4>
          <p className="mt-1 text-xs opacity-80">{d.desc}</p>
        </div>
      ))}
    </div>
    <Divider />
  </div>
);

/* ─── SECTION: Printing Exams ─── */
export const PrintingExamsSection = () => (
  <div>
    <SectionHeader
      tag="Faculty Features"
      title="Printing Exams"
      subtitle="Generate formatted exam papers ready for printing."
    />
    <StepList
      steps={[
        "Start by navigating to the relevant subject area and carefully selecting the specific questions you want to include in the exam.",
        "Once you have finalized your question selection, locate and click the 'Print Exam' button to open the configuration options.",
        "Take a moment to configure your print settings by adjusting the layout, adding header information, and including any necessary instructions for the students.",
        <ScreenshotPlaceholder
          label="Print Exam Preview"
          caption="Preview and print formatted exam papers."
        />,
        "You will be presented with a preview of the formatted exam paper. Review it to ensure everything looks correct before proceeding.",
        "Finally, click the 'Print' button to send it directly to your printer, or choose 'Download PDF' to save the generated document to your device.",
      ]}
    />
    <Divider />
  </div>
);

/* ─── SECTION: Approving Questions ─── */
export const ApprovingQuestionsSection = () => (
  <div>
    <SectionHeader
      tag="Program Chair Features"
      title="Approving Questions"
      subtitle="Review and approve faculty-submitted questions for quality assurance."
    />
    <StepList
      steps={[
        "To begin the approval process, navigate to your assigned subject area to view the list of pending questions submitted by faculty members.",
        "Take the time to carefully review each submitted question to ensure it meets the required standards for accuracy, clarity, and relevance.",
        <ScreenshotPlaceholder
          label="Question Approval Panel"
          caption="Program Chairs review and approve pending questions."
        />,
        "If the question meets all criteria, you can approve it, which will immediately make it available in the main question bank for use in exams.",
        "Alternatively, if the question requires changes, you can return it to the original faculty member along with specific feedback for revision.",
      ]}
    />
    <Divider />
  </div>
);

/* ─── SECTION: Managing Subjects ─── */
export const ManagingSubjectsSection = () => (
  <div>
    <SectionHeader
      tag="Program Chair Features"
      title="Managing Subjects"
      subtitle="Add, edit, and organize subjects within your program."
    />
    <ScreenshotPlaceholder
      label="Subject Management"
      caption="Add, edit, or archive subjects within the system."
    />
    <InfoBox type="info">
      Archiving a subject hides it from active lists but preserves all
      associated questions and data for future reference.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Viewing Reports ─── */
export const ViewingReportsSection = () => (
  <div>
    <SectionHeader
      tag="Program Chair Features"
      title="Viewing Reports"
      subtitle="Access analytical reports on exam performance and question usage."
    />
    <ScreenshotPlaceholder
      label="Reports Dashboard"
      caption="View system-wide reports and analytics."
    />
    <Divider />
  </div>
);

/* ─── SECTION: User Management ─── */
export const UserManagementSection = () => (
  <div>
    <SectionHeader
      tag="Admin / Dean"
      title="User Management"
      subtitle="Manage all user accounts within the system."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      Administrators can view, search, and manage all user accounts. This
      includes activating or deactivating accounts, resetting passwords, and
      updating user information.
    </p>
    <ScreenshotPlaceholder
      label="User Management"
      caption="Manage user accounts, roles, and permissions."
    />
    <Divider />
  </div>
);

/* ─── SECTION: System Oversight ─── */
export const SystemOversightSection = () => (
  <div>
    <SectionHeader
      tag="Admin / Dean"
      title="System Oversight"
      subtitle="Monitor overall system health and activity."
    />
    <ScreenshotPlaceholder
      label="System Overview"
      caption="Monitor system health and overall statistics."
    />
    <Divider />
  </div>
);

/* ─── SECTION: Role Assignment ─── */
export const RoleAssignmentSection = () => (
  <div>
    <SectionHeader
      tag="Admin / Dean"
      title="Role Assignment"
      subtitle="Assign and modify user roles to control access levels."
    />
    <StepList
      steps={[
        "As an administrator, start by navigating to the User Management section located in the main sidebar.",
        "Use the provided search tools to quickly locate the specific user whose permissions you need to modify.",
        <ScreenshotPlaceholder
          label="Role Assignment"
          caption="Assign roles to users: Student, Faculty, Program Chair, or Admin."
        />,
        "Click on the user's profile to open up their detailed account information and settings panel.",
        "Find the role dropdown menu and select the appropriate new access level: Student, Faculty, Program Chair, or Admin.",
        "Make sure to securely save your changes. The user's access permissions will be updated and applied immediately across the system.",
      ]}
    />
    <InfoBox type="warning">
      <strong>Caution:</strong> Changing a user's role immediately affects their
      access permissions. Ensure role changes are authorized before making them.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Printing Official Exams ─── */
export const PrintingOfficialSection = () => (
  <div>
    <SectionHeader
      tag="Admin / Dean"
      title="Printing Official Exams"
      subtitle="Generate official qualifying examination papers."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      Administrators and Deans can generate official, formatted examination
      papers from the approved question bank. These papers follow standardized
      formatting suitable for formal academic use.
    </p>
    <ScreenshotPlaceholder
      label="Official Exam Print"
      caption="Generate and print official qualifying examination papers."
    />
    <Divider />
  </div>
);

/* ─── SECTION: Categorized Questions ─── */
export const CategorizedQuestionsSection = () => (
  <div>
    <SectionHeader
      tag="Question Bank"
      title="Categorized Questions"
      subtitle="Questions are organized by subject and category for easy management."
    />
    <ScreenshotPlaceholder
      label="Question Bank"
      caption="Browse the categorized question bank with filters."
    />
    <Divider />
  </div>
);

/* ─── SECTION: Subject Filtering ─── */
export const FilteringSection = () => (
  <div>
    <SectionHeader
      tag="Question Bank"
      title="Subject Filtering"
      subtitle="Quickly find questions using powerful filtering options."
    />
    <ScreenshotPlaceholder
      label="Subject Filtering"
      caption="Filter questions by subject, difficulty, and status."
    />
    <Divider />
  </div>
);

/* ─── SECTION: Difficulty Levels ─── */
export const DifficultyLevelsSection = () => (
  <div>
    <SectionHeader
      tag="Question Bank"
      title="Difficulty Levels"
      subtitle="Questions are categorized into three difficulty tiers."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      Each question in the bank is assigned a difficulty level. This allows the
      system to create balanced exams and lets students practice at their
      comfort level before progressing.
    </p>
    <ScreenshotPlaceholder
      label="Difficulty Levels"
      caption="Questions are categorized into Easy, Medium, and Hard."
    />
    <Divider />
  </div>
);

/* ─── SECTION: Randomization ─── */
export const RandomizationSection = () => (
  <div>
    <SectionHeader
      tag="Question Bank"
      title="Randomized Questions"
      subtitle="Each exam attempt features a unique set of randomly selected questions."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      The randomization engine selects questions from the bank based on subject
      and difficulty criteria. This ensures students get a fresh experience with
      each attempt and reduces the chance of memorizing answer patterns.
    </p>
    <ScreenshotPlaceholder
      label="Randomization Settings"
      caption="Configure how questions are randomized for each exam attempt."
    />
    <InfoBox type="tip">
      <strong>Tip:</strong> The more questions available in the question bank,
      the more varied each exam attempt will be. Faculty are encouraged to
      continuously add new questions.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Classes Overview ─── */
export const ClassesOverviewSection = () => (
  <div>
    <SectionHeader
      tag="Classes"
      title="Classes Overview"
      subtitle="Classes let teachers organize students and distribute quizzes efficiently."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      The Classes feature works similarly to Google Classroom. Faculty and
      Program Chairs can create classes, share a unique class code with
      students, and assign quizzes directly to enrolled students. Students join
      classes using a 6-character code and can view assigned quizzes, deadlines,
      and their quiz history.
    </p>
    <ScreenshotPlaceholder
      label="Classes Page"
      caption="View and manage all your classes in one place."
    />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FeatureCard
        icon="bx-plus-circle"
        title="Create Classes"
        description="Faculty create classes with a name, schedule, and auto-generated class code."
      />
      <FeatureCard
        icon="bx-log-in"
        title="Join with Code"
        description="Students join by entering the unique 6-character class code."
      />
      <FeatureCard
        icon="bx-share-alt"
        title="Assign Quizzes"
        description="Teachers assign quizzes with start dates, deadlines, and attempt limits."
      />
      <FeatureCard
        icon="bx-archive-in"
        title="Archive Classes"
        description="Completed classes can be archived to keep your workspace clean."
      />
    </div>
    <Divider />
  </div>
);

/* ─── SECTION: Creating a Class ─── */
export const CreatingClassSection = () => (
  <div>
    <SectionHeader
      tag="Classes"
      title="Creating a Class"
      subtitle="Set up a new class and share the code with your students."
    />
    <StepList
      steps={[
        "To set up a new class, first navigate to the main Classes page by selecting it from the sidebar navigation menu.",
        "Locate and click the '+' button, typically found in the header area, to initiate the class creation process.",
        <ScreenshotPlaceholder
          label="Create Class Modal"
          caption="Fill out the form to create a new class with a unique class code."
        />,
        "Provide a descriptive name for your class, such as 'CpE 301 — Digital Systems', to help students easily identify it.",
        "You may also optionally add a schedule, like 'MWF 9:00 AM — 10:30 AM', to provide more context to your students.",
        "Once you click 'Create', the system will automatically generate a unique 6-character class code for this specific group.",
        "Finally, share this generated class code with your students so they can easily enroll themselves in your new class.",
      ]}
    />
    <InfoBox type="tip">
      <strong>Tip:</strong> The class code is displayed on the class card. You
      can share it verbally, on a board, or through messaging.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Joining a Class ─── */
export const JoiningClassSection = () => (
  <div>
    <SectionHeader
      tag="Classes"
      title="Joining a Class"
      subtitle="Students can join a class using the code provided by their instructor."
    />
    <StepList
      steps={[
        "As a student, start by navigating to the Classes page from your main sidebar menu.",
        "Click the '+' button to open the Join Class form, where you can enroll in a new subject.",
        <ScreenshotPlaceholder
          label="Join Class Form"
          caption="Students enter a 6-character class code to join a class."
        />,
        "Carefully enter the specific 6-character class code that was provided to you by your instructor.",
        "Click the 'Join' button, and if the code is correct, you will be instantly enrolled in the class.",
        "The new class will now appear on your Classes list, giving you full access to any quizzes or materials assigned to it.",
      ]}
    />
    <InfoBox type="info">
      Class codes are case-insensitive and consist of letters and numbers. Ask
      your instructor if you're unsure of the code.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Managing Students ─── */
export const ManagingStudentsSection = () => (
  <div>
    <SectionHeader
      tag="Classes"
      title="Managing Students"
      subtitle="View enrolled students and manage your class roster."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      After creating a class, click on it to view the enrolled students. You can
      see student names, enrollment dates, and manage the roster. The class
      detail page also lets you assign quizzes and view class-level analytics.
    </p>
    <ScreenshotPlaceholder
      label="Class Students View"
      caption="Faculty can see enrolled students and manage the class roster."
    />
    <Divider />
  </div>
);

/* ─── SECTION: Archiving Classes ─── */
export const ArchivingClassesSection = () => (
  <div>
    <SectionHeader
      tag="Classes"
      title="Archiving Classes"
      subtitle="Archive completed classes to keep your workspace organized."
    />
    <StepList
      steps={[
        "When a semester or term ends, navigate to your Classes page and find the specific class you wish to archive.",
        "Locate and click the archive icon, which is usually found directly on the class card itself.",
        <ScreenshotPlaceholder
          label="Archive Confirmation"
          caption="Archiving a class moves it out of your active view."
        />,
        "A dialog box will appear asking you to confirm this action; proceed to confirm that you want to archive the class.",
        "Once confirmed, the class will be cleanly moved out of your active view and into the designated Archived Classes section.",
      ]}
    />
    <InfoBox type="info">
      Archived classes preserve all data including quizzes, results, and student
      enrollments. You can access archived classes from the archive page.
    </InfoBox>
    <InfoBox type="warning">
      <strong>Note:</strong> Students can also unenroll from a class using the
      exit button on the class card or within the class view.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Quizzes Overview ─── */
export const QuizzesOverviewSection = () => (
  <div>
    <SectionHeader
      tag="Quizzes"
      title="Quizzes Overview"
      subtitle="Create, manage, and distribute custom quizzes through the Libraries page."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      The Libraries page (also called Personal Quizzes) is where faculty create
      custom quizzes. Unlike practice exams that draw from the question bank,
      quizzes are fully customizable — you choose the questions, set the type,
      and can assign them to specific classes with deadlines and attempt limits.
    </p>
    <ScreenshotPlaceholder
      label="Quiz Library"
      caption="Browse, create, and manage personal quizzes from the Libraries page."
    />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FeatureCard
        icon="bx-notepad"
        title="Subject-Based Quizzes"
        description="Pull questions from an existing subject's question bank automatically."
      />
      <FeatureCard
        icon="bx-customize"
        title="Custom Quizzes"
        description="Create quizzes with your own custom questions from scratch."
      />
    </div>
    <Divider />
  </div>
);

/* ─── SECTION: Creating a Quiz ─── */
export const CreatingQuizSection = () => (
  <div>
    <SectionHeader
      tag="Quizzes"
      title="Creating a Quiz"
      subtitle="Use the step-by-step wizard to create a new quiz."
    />
    <StepList
      steps={[
        "To begin building a quiz, head over to the Libraries page using your sidebar navigation menu.",
        "Click the '+' button to launch the comprehensive quiz creation wizard that will guide you through the process.",
        "In the first step, provide a clear title for your quiz and include any optional descriptions or specific instructions for the students.",
        <ScreenshotPlaceholder
          label="Create Quiz Wizard"
          caption="Step-by-step wizard to create a new quiz: set title, type, subject, and coverage."
        />,
        "Next, decide on the type of quiz you want to create: you can choose between a Subject-Based auto-generated quiz or a Custom manual quiz.",
        "If you chose Subject-Based, you will need to specify the relevant subject and program from the available dropdown selectors.",
        "Still in the Subject-Based flow, choose the specific exam coverage, such as Midterm or Finals, to focus the generated questions.",
        "Take a moment to review all your selected configurations, and then click 'Create Quiz' to finalize and generate the assessment.",
      ]}
    />
    <InfoBox type="tip">
      <strong>Subject-Based vs Custom:</strong> Subject-based quizzes auto-pull
      questions from the question bank. Custom quizzes let you add your own
      questions manually after creation.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Assigning to Classes ─── */
export const AssigningQuizSection = () => (
  <div>
    <SectionHeader
      tag="Quizzes"
      title="Assigning Quizzes to Classes"
      subtitle="Distribute quizzes to your classes with custom settings."
    />
    <StepList
      steps={[
        "Start by opening the specific quiz you want to distribute from your Libraries page.",
        "Look for and click the 'Assign to Class' button to bring up the distribution configuration modal.",
        <ScreenshotPlaceholder
          label="Assign Quiz Modal"
          caption="Select a class and configure dates to assign a quiz to students."
        />,
        "From the list of your active classes, select one or multiple classes that should receive this quiz.",
        "Carefully set both the start date and the strict deadline for when the quiz must be completed by the students.",
        "You can also configure the allowed attempt limits, or choose to leave it completely unlimited for practice purposes.",
        "Click the 'Assign' button to publish the quiz; enrolled students will immediately see it appear in their respective class views.",
      ]}
    />
    <InfoBox type="important">
      <strong>Deadlines:</strong> When a deadline is approaching (within 12
      hours), the deadline text turns red in the student's view as a visual
      reminder.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: Taking a Quiz ─── */
export const TakingQuizSection = () => (
  <div>
    <SectionHeader
      tag="Quizzes"
      title="Taking a Quiz"
      subtitle="How students access and complete assigned quizzes."
    />
    <StepList
      steps={[
        "First, navigate to your Classes page and click into the specific class that has assigned the quiz.",
        "Inside the class view, switch to the 'Assigned Quizzes' tab to see all of your currently available assessments.",
        "Find the quiz you are ready to take and click the 'Start Quiz' button to proceed.",
        <ScreenshotPlaceholder
          label="Quiz Taking Interface"
          caption="Students answer questions within the quiz interface with a timer."
        />,
        "Carefully review the initial quiz information page, which displays the title, specific instructions, time limits, and your remaining attempts.",
        "When you are fully prepared to start the timer, click the 'Begin' button to launch the first question.",
        "Make sure to answer all the presented questions to the best of your ability, and submit your final answers when you are completely done.",
      ]}
    />
    <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        {
          label: "Start Quiz",
          color: "bg-orange-50 border-orange-200 text-orange-700",
          desc: "First time taking this quiz.",
        },
        {
          label: "Continue",
          color: "bg-blue-50 border-blue-200 text-blue-700",
          desc: "Resume an in-progress attempt.",
        },
        {
          label: "Retake",
          color: "bg-emerald-50 border-emerald-200 text-emerald-700",
          desc: "Start a new attempt (if allowed).",
        },
      ].map((s) => (
        <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
          <h4 className="text-sm font-bold">{s.label}</h4>
          <p className="mt-1 text-xs opacity-80">{s.desc}</p>
        </div>
      ))}
    </div>
    <Divider />
  </div>
);

/* ─── SECTION: Quiz Results & History ─── */
export const QuizResultsSection = () => (
  <div>
    <SectionHeader
      tag="Quizzes"
      title="Quiz Results & History"
      subtitle="Review your past quiz attempts and track your progress."
    />
    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      After completing a quiz, your results are saved automatically. You can
      access your quiz history from within the class view by switching to the
      "History" tab. Each entry shows the quiz name, your score, attempt number,
      and completion date.
    </p>
    <ScreenshotPlaceholder
      label="Quiz History View"
      caption="View past quiz attempts with scores and completion dates."
    />
    <InfoBox type="tip">
      <strong>Multiple Attempts:</strong> If the teacher allows multiple
      attempts, you can retake the quiz. All previous attempts are recorded in
      your history with individual scores.
    </InfoBox>
    <Divider />
  </div>
);

/* ─── SECTION: FAQ ─── */
export const FAQSection = ({ faqData }) => {
  const [openIndex, setOpenIndex] = React.useState(null);
  return (
    <div>
      <SectionHeader
        tag="Help"
        title="Frequently Asked Questions"
        subtitle="Find answers to the most common questions about the system."
      />
      <div className="space-y-3">
        {faqData.map((item, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-gray-200 transition-colors hover:border-gray-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
            >
              <span className="pr-4 text-sm font-semibold text-gray-800">
                {item.q}
              </span>
              <i
                className={`bx ${openIndex === i ? "bx-minus" : "bx-plus"} shrink-0 text-xl text-gray-400`}
              ></i>
            </button>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{
                maxHeight: openIndex === i ? "200px" : "0px",
                opacity: openIndex === i ? 1 : 0,
              }}
            >
              <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600">
                {item.a}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
