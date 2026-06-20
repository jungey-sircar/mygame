import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import ThemeToggle from '@/components/ThemeToggle';
import { useQuizState } from './hooks/useQuizState';
import HostPanel from './components/HostPanel';
import DisplayView from './components/DisplayView';
import ScoreboardView from './components/ScoreboardView';

const QuizCompetition = () => {
  const quizState = useQuizState();

  if (quizState.view === 'display') {
    return <DisplayView state={quizState} />;
  }

  if (quizState.view === 'scoreboard') {
    return <ScoreboardView state={quizState} />;
  }

  // Host view
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <ParticleBackground />

      {/* Top bar */}
      <div className="relative z-20 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/90 backdrop-blur-xl">
        <Link to="/" className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-lg font-bold text-foreground">🏆 Live Quiz Competition</h1>
        <span className="text-xs text-muted-foreground font-mono ml-auto">Host Control Panel</span>
        <ThemeToggle />
      </div>

      {/* Host Panel */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <HostPanel state={quizState} />
      </div>
    </div>
  );
};

export default QuizCompetition;
