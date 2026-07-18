// data/questions.ts

export const QUESTIONS = {
  multipleChoice: {
    title: `Question-${Date.now()}`,
    text: 'Hello',
    options: [
      'Tester',
      'Testing',
      'Lets Test',
    ],
    correctAnswer: 0,
  },

  updatedMultipleChoice: {
    title: `Modified-${Date.now()}`,
    text: 'Hello1234',
    options: [
      'Test',
      'Hello',
      'Testing',
    ],
    correctAnswer: 1,
  },

  copied: {
    title: `Copied-${Date.now()}`,
  },
};