import type { Question } from '../questions';
import { riddleEasyQuestions } from './riddleEasyQuestions';
import { riddleMediumQuestions } from './riddleMediumQuestions';
import { riddleHardQuestions } from './riddleHardQuestions';
import { riddleExtraQuestions } from '../extras/riddleExtraQuestions';

export const riddleQuestions: Question[] = [
  ...riddleEasyQuestions,
  ...riddleMediumQuestions,
  ...riddleHardQuestions,
  ...riddleExtraQuestions,
];
