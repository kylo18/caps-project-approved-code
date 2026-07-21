import fs from 'fs';

const CLASS_FILE = 'tests/data/classes.json';
const QUESTION_QUIZ_FILE = 'tests/data/question_quiz.json';

/* ===========================
   CLASSES
=========================== */

export function saveClass(name: string) {
  let data = { classes: [] as string[] };

  if (fs.existsSync(CLASS_FILE)) {
    data = JSON.parse(fs.readFileSync(CLASS_FILE, 'utf8'));
  }

  data.classes.push(name);

  fs.writeFileSync(
    CLASS_FILE,
    JSON.stringify(data, null, 2)
  );
}

export function getClasses(): string[] {
  if (!fs.existsSync(CLASS_FILE)) {
    return [];
  }

  const data = JSON.parse(
    fs.readFileSync(CLASS_FILE, 'utf8')
  );

  return data.classes;
}

export function clearClasses() {
  fs.writeFileSync(
    CLASS_FILE,
    JSON.stringify({ classes: [] }, null, 2)
  );
}

/* ===========================
   QUIZ QUESTIONS
=========================== */

export function saveQuizQuestion(name: string) {
  let data = { questions: [] as string[] };

  if (fs.existsSync(QUESTION_QUIZ_FILE)) {
    const content = fs.readFileSync(
      QUESTION_QUIZ_FILE,
      'utf8'
    );

    if (content.trim()) {
      try {
        data = JSON.parse(content);
      } catch {
        data = { questions: [] };
      }
    }
  }

  data.questions.push(name);

  fs.writeFileSync(
    QUESTION_QUIZ_FILE,
    JSON.stringify(data, null, 2)
  );
}

export function getQuizQuestions(): string[] {
  if (!fs.existsSync(QUESTION_QUIZ_FILE)) {
    return [];
  }

  const content = fs.readFileSync(
    QUESTION_QUIZ_FILE,
    'utf8'
  );

  if (!content.trim()) {
    return [];
  }

  try {
    const data = JSON.parse(content);
    return data.questions ?? [];
  } catch {
    return [];
  }
}

export function getLatestQuizQuestion(): string | undefined {
  const questions = getQuizQuestions();
  return questions[questions.length - 1];
}

export function clearQuizQuestions() {
  fs.writeFileSync(
    QUESTION_QUIZ_FILE,
    JSON.stringify({ questions: [] }, null, 2)
  );
}