const { execSync } = require('child_process');

const workflow = {
  PROGRAM_CHAIR: [
    'login/Login.spec.ts',
    'questions/add-question.spec.ts',
    'questions/edit-question.spec.ts',
    'questions/eedit_copy-question.spec.ts',
    'questions/remove-question.spec.ts',
    'questions/addd_dean-question.spec.ts',
    'questions/approve-question.spec.ts',
    'settings/setup-practice_exam.spec.ts',
    'settings/Undo_setup-practice_exam.spec.ts',
  ],

  Dean: [
    'login/Login.spec.ts',
    'subject/add-subject.spec.ts',
    'questions/add-question.spec.ts',
    'questions/edit-question.spec.ts',
    'questions/eedit_copy-question.spec.ts',
    'questions/remove-question.spec.ts',
    'questions/addd_chair-question.spec.ts',
    'questions/approve-question.spec.ts',
    'settings/setup-practice_exam.spec.ts',
    'settings/Undo_setup-practice_exam.spec.ts',
  ],

  Asso_Dean: [
    'login/Login.spec.ts',
    'subject/add-subject.spec.ts',
    'questions/add-question.spec.ts',
    'questions/edit-question.spec.ts',
    'questions/eedit_copy-question.spec.ts',
    'questions/remove-question.spec.ts',
    'questions/addd_dean-question.spec.ts',
    'questions/approve-question.spec.ts',
    'settings/setup-practice_exam.spec.ts',
    'settings/Undo_setup-practice_exam.spec.ts',
  ],
};

for (const [role, scripts] of Object.entries(workflow)) {
  console.log(`\n====================================`);
  console.log(`Running ${role} Tests`);
  console.log(`====================================`);

  for (const script of scripts) {
    const file = `tests/${role}/${script}`;

    console.log(`\n▶ ${file}`);

    try {
      execSync(
        `npx playwright test "${file}" --project=chromium --workers=1`,
        {
          stdio: 'inherit',
        }
      );
    } catch (error) {
      console.log(`\n❌ FAILED: ${file}`);
    }
  }

  console.log(`\n✅ ${role} completed.`);
}

console.log('\n🎉 ALL WORKFLOWS FINISHED!');