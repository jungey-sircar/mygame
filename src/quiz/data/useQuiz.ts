import { useState, useEffect, useMemo, useCallback } from "react";
import { QuizQuestion } from "./cQuestions";

const shuffleArray = <T,>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const shuffleQuestionOptions = (question: QuizQuestion): QuizQuestion => {
  const indexedOptions = question.options.map((option, index) => ({ option, index }));
  const shuffledOptions = shuffleArray(indexedOptions);
  const remappedCorrect = shuffledOptions.findIndex(({ index }) => index === question.correct);

  return {
    ...question,
    options: shuffledOptions.map(({ option }) => option),
    correct: remappedCorrect,
  };
};

export function useQuiz(allQuestions: QuizQuestion[], count: number = 50) {
  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Map<number, boolean>>(new Map());
  const [score, setScore] = useState(0);

  const initQuiz = useCallback(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const randomizedQuestions = shuffled
      .slice(0, Math.min(count, shuffled.length))
      .map(shuffleQuestionOptions);

    setSelectedQuestions(randomizedQuestions);
    setAnswers(new Map());
    setScore(0);
  }, [allQuestions, count]);

  useEffect(() => { initQuiz(); }, [initQuiz]);

  const totalQuestions = selectedQuestions.length;
  const attempted = answers.size;
  const isComplete = attempted === totalQuestions && totalQuestions > 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const grade = percentage >= 85 ? "A" : percentage >= 70 ? "B" : percentage >= 50 ? "C" : "Fail";

  const answerQuestion = useCallback((tileIndex: number, selectedOption: number) => {
    const q = selectedQuestions[tileIndex];
    if (!q || answers.has(tileIndex)) return false;
    const correct = selectedOption === q.correct;
    setAnswers(prev => new Map(prev).set(tileIndex, correct));
    if (correct) setScore(prev => prev + 1);
    return correct;
  }, [selectedQuestions, answers]);

  return { selectedQuestions, answers, score, attempted, totalQuestions, isComplete, percentage, grade, answerQuestion, restart: initQuiz };
}
