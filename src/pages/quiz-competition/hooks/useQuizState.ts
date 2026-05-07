import { useState, useCallback, useEffect } from 'react';
import { Question, sampleQuestions, RoundType, Category } from '../data/questions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface Round {
  id: string;
  name: string;
  type: RoundType;
}

export interface QuizState {
  teams: Team[];
  rounds: Round[];
  questions: Question[];
  currentRoundIndex: number;
  currentTeamIndex: number;
  currentQuestionIndex: number;
  selectedCategory: Category | 'All';
  timerDuration: number;
  timerRunning: boolean;
  timerValue: number;
  showAnswer: boolean;
  showQuestion: boolean;
  view: 'host' | 'display' | 'scoreboard';
}

const STORAGE_KEY = 'quiz-competition-state';

const createDefaultState = (): QuizState => ({
  teams: [
    { id: '1', name: 'Team Alpha', score: 0 },
    { id: '2', name: 'Team Beta', score: 0 },
  ],
  rounds: [
    { id: 'r1', name: 'General Knowledge Round', type: 'General Knowledge Round' },
  ],
  questions: shuffleArray(sampleQuestions.map(q => ({ ...q, used: false }))),
  currentRoundIndex: 0,
  currentTeamIndex: 0,
  currentQuestionIndex: -1,
  selectedCategory: 'All',
  timerDuration: 20,
  timerRunning: false,
  timerValue: 20,
  showAnswer: false,
  showQuestion: false,
  view: 'host',
});

function loadState(): QuizState {
  const defaultState = createDefaultState();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge any new questions from sampleQuestions that aren't in saved state
      const savedQuestions: Question[] = (parsed.questions || []).map((q: Question) => ({ ...q, used: false }));
      const savedIds = new Set(savedQuestions.map((q: Question) => q.id));
      const freshQuestions = sampleQuestions
        .filter(q => !savedIds.has(q.id))
        .map(q => ({ ...q, used: false }));
      return {
        ...defaultState,
        ...parsed,
        questions: shuffleArray([...savedQuestions, ...freshQuestions]),
        timerRunning: false,
      };
    }
  } catch {}
  return defaultState;
}

export function useQuizState() {
  const [state, setState] = useState<QuizState>(loadState);
  const { user } = useAuth();

  // Load user's custom questions from DB
  useEffect(() => {
    if (!user) return;
    const loadUserQuestions = async () => {
      const { data } = await supabase
        .from('user_quiz_questions')
        .select('*')
        .eq('user_id', user.id);
      if (data && data.length > 0) {
        const dbQuestions: Question[] = data.map((q: any) => ({
          id: q.id,
          text: q.text,
          answer: q.answer,
          category: q.category,
          difficulty: q.difficulty as Question['difficulty'],
          used: false,
        }));
        setState(s => {
          const existingIds = new Set(s.questions.map(q => q.id));
          const newOnes = dbQuestions.filter(q => !existingIds.has(q.id));
          return newOnes.length > 0 ? { ...s, questions: shuffleArray([...s.questions, ...newOnes]) } : s;
        });
      }
    };
    loadUserQuestions();
  }, [user]);

  useEffect(() => {
    const { timerRunning, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [state]);

  // Timer effect
  useEffect(() => {
    if (!state.timerRunning || state.timerValue <= 0) {
      if (state.timerRunning && state.timerValue <= 0) {
        setState(s => ({ ...s, timerRunning: false }));
        // Play buzzer sound
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 440;
          osc.type = 'square';
          gain.gain.value = 0.3;
          osc.start();
          setTimeout(() => { osc.stop(); ctx.close(); }, 500);
        } catch {}
      }
      return;
    }
    const interval = setInterval(() => {
      setState(s => ({ ...s, timerValue: Math.max(0, s.timerValue - 1) }));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.timerRunning, state.timerValue]);

  const addTeam = useCallback((name: string) => {
    setState(s => ({
      ...s,
      teams: [...s.teams, { id: Date.now().toString(), name, score: 0 }],
    }));
  }, []);

  const removeTeam = useCallback((id: string) => {
    setState(s => ({
      ...s,
      teams: s.teams.filter(t => t.id !== id),
      currentTeamIndex: 0,
    }));
  }, []);

  const editTeamName = useCallback((id: string, name: string) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => t.id === id ? { ...t, name } : t),
    }));
  }, []);

  const updateScore = useCallback((id: string, delta: number) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => t.id === id ? { ...t, score: t.score + delta } : t),
    }));
  }, []);

  const nextTeam = useCallback(() => {
    setState(s => ({
      ...s,
      currentTeamIndex: (s.currentTeamIndex + 1) % s.teams.length,
      showAnswer: false,
      showQuestion: false,
    }));
  }, []);

  const addRound = useCallback((name: string, type: RoundType) => {
    setState(s => ({
      ...s,
      rounds: [...s.rounds, { id: Date.now().toString(), name, type }],
    }));
  }, []);

  const setCurrentRound = useCallback((index: number) => {
    setState(s => ({ ...s, currentRoundIndex: index, showAnswer: false, showQuestion: false }));
  }, []);

  const renameRound = useCallback((id: string, name: string) => {
    setState(s => ({
      ...s,
      rounds: s.rounds.map(r => r.id === id ? { ...r, name } : r),
    }));
  }, []);

  const removeRound = useCallback((id: string) => {
    setState(s => ({
      ...s,
      rounds: s.rounds.filter(r => r.id !== id),
      currentRoundIndex: 0,
    }));
  }, []);

  const setCategory = useCallback((cat: Category | 'All') => {
    setState(s => ({ ...s, selectedCategory: cat, currentQuestionIndex: -1 }));
  }, []);

  const filteredQuestions = state.selectedCategory === 'All'
    ? state.questions
    : state.questions.filter(q => q.category === state.selectedCategory);

  const selectQuestion = useCallback((index: number) => {
    setState(s => ({ ...s, currentQuestionIndex: index, showAnswer: false, showQuestion: true }));
  }, []);

  const toggleShowQuestion = useCallback(() => {
    setState(s => ({ ...s, showQuestion: !s.showQuestion }));
  }, []);

  const toggleShowAnswer = useCallback(() => {
    setState(s => ({ ...s, showAnswer: !s.showAnswer }));
  }, []);

  const markQuestionUsed = useCallback((id: string) => {
    setState(s => ({
      ...s,
      questions: s.questions.map(q => q.id === id ? { ...q, used: true } : q),
    }));
  }, []);

  const addQuestion = useCallback(async (q: Omit<Question, 'id'>) => {
    if (user) {
      const { data, error } = await supabase
        .from('user_quiz_questions')
        .insert({ user_id: user.id, text: q.text, answer: q.answer, category: q.category, difficulty: q.difficulty })
        .select()
        .single();
      if (data && !error) {
        setState(s => ({
          ...s,
          questions: shuffleArray([...s.questions, { id: data.id, text: data.text, answer: data.answer, category: data.category, difficulty: data.difficulty as Question['difficulty'], used: false }]),
        }));
        return;
      }
    }
    setState(s => ({
      ...s,
      questions: shuffleArray([...s.questions, { ...q, id: `custom-${Date.now()}`, used: false }]),
    }));
  }, [user]);

  const deleteQuestion = useCallback(async (id: string) => {
    if (user) {
      await supabase.from('user_quiz_questions').delete().eq('id', id).eq('user_id', user.id);
    }
    setState(s => ({
      ...s,
      questions: s.questions.filter(q => q.id !== id),
    }));
  }, [user]);

  const startTimer = useCallback(() => {
    setState(s => ({ ...s, timerRunning: true, timerValue: s.timerValue <= 0 ? s.timerDuration : s.timerValue }));
  }, []);

  const pauseTimer = useCallback(() => {
    setState(s => ({ ...s, timerRunning: false }));
  }, []);

  const resetTimer = useCallback(() => {
    setState(s => ({ ...s, timerRunning: false, timerValue: s.timerDuration }));
  }, []);

  const setTimerDuration = useCallback((d: number) => {
    setState(s => ({ ...s, timerDuration: d, timerValue: d, timerRunning: false }));
  }, []);

  const setView = useCallback((view: QuizState['view']) => {
    setState(s => ({ ...s, view }));
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createDefaultState());
  }, []);

  const importQuestions = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as Question[];
      if (Array.isArray(parsed)) {
        setState(s => ({
          ...s,
          questions: shuffleArray([
            ...s.questions,
            ...parsed.map((q, i) => ({ ...q, id: q.id || `import-${Date.now()}-${i}`, used: false })),
          ]),
        }));
        return true;
      }
    } catch {}
    return false;
  }, []);

  return {
    ...state,
    filteredQuestions,
    addTeam, removeTeam, editTeamName, updateScore, nextTeam,
    addRound, setCurrentRound, renameRound, removeRound,
    setCategory, selectQuestion, toggleShowQuestion, toggleShowAnswer,
    markQuestionUsed, addQuestion, deleteQuestion,
    startTimer, pauseTimer, resetTimer, setTimerDuration,
    setView, resetAll, importQuestions,
  };
}
