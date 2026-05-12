import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Monitor, Trophy, ArrowLeft, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { categories, type Category, sampleQuestions } from '../data/questions';
import MillionaireQuestionDisplay from './MillionaireQuestionDisplay';

interface DisplayViewProps {
  state: any;
}

const DisplayView = ({ state }: DisplayViewProps) => {
  const [showPanel, setShowPanel] = useState(true);
  const currentQuestion = state.filteredQuestions[state.currentQuestionIndex];
  const currentRound = state.rounds[state.currentRoundIndex];
  const currentTeam = state.teams[state.currentTeamIndex];
  // Build per-category ordinal map: id -> 1..N within its category
  const idToOrdinal = new Map<string, number>();
  for (const cat of categories) {
    const catList = sampleQuestions.filter((sq: any) => sq.category === cat);
    for (let idx = 0; idx < catList.length; idx++) {
      idToOrdinal.set(catList[idx].id, idx + 1);
    }
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[hsl(220,25%,4%)] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-neon-cyan/10 rounded-full blur-[150px]" />
      </div>

      {/* Main display area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => state.setView('host')}>
              <ArrowLeft size={14} /> Host
            </Button>
            <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => state.setView('scoreboard')}>
              <Trophy size={14} /> Scoreboard
            </Button>
            <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setShowPanel(!showPanel)}>
              <List size={14} /> {showPanel ? 'Hide' : 'Show'} Questions
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{currentRound?.name ?? 'No Round'}</p>
          </div>

          {/* Timer */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {(state.timerRunning || state.timerValue < state.timerDuration) && (
                <span className={`font-mono text-3xl font-black ${state.timerValue <= 5 && state.timerValue > 0 ? 'text-red-400 animate-pulse' : state.timerValue === 0 ? 'text-red-500' : 'text-neon-cyan'}`}>
                  {state.timerValue}s
                </span>
              )}
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={state.startTimer} disabled={state.timerRunning}>▶</Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={state.pauseTimer} disabled={!state.timerRunning}>⏸</Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={state.resetTimer}>↺</Button>
              </div>
            </div>
            
            {/* Timer Duration Presets */}
            <div className="flex gap-1 flex-wrap">
              {[10, 15, 20, 30, 45, 60].map(duration => (
                <Button
                  key={duration}
                  size="sm"
                  variant={state.timerDuration === duration ? "default" : "outline"}
                  className={`text-xs h-6 px-2 ${state.timerDuration === duration ? 'bg-neon-cyan text-black border-neon-cyan' : ''}`}
                  onClick={() => state.setTimerDuration(duration)}
                  disabled={state.timerRunning}
                >
                  {duration}s
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Current team indicator */}
        <div className="text-center py-2 border-b border-white/5 flex items-center justify-center gap-4">
          <Button size="sm" variant="ghost" className="text-xs h-6" onClick={state.nextTeam}>
            <ChevronRight size={12} /> Next Team
          </Button>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-widest mr-2">Current Turn:</span>
            <span className="text-lg font-display font-bold text-neon-purple">{currentTeam?.name ?? 'No Team'}</span>
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <AnimatePresence mode="wait">
            {state.showQuestion && currentQuestion ? (
              // Check if this is a millionaire-style question
              currentQuestion.options && currentQuestion.correctIndex !== undefined ? (
                <MillionaireQuestionDisplay
                  key={currentQuestion.id}
                  question={currentQuestion}
                  showAnswer={state.showAnswer}
                  onToggleAnswer={state.toggleShowAnswer}
                  onHideQuestion={state.toggleShowQuestion}
                  state={state}
                />
              ) : (
                // Traditional question display
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  className="max-w-4xl w-full text-center space-y-8"
                >
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                    {currentQuestion.category}
                  </span>

                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight">
                    {currentQuestion.text}
                  </h2>

                  <AnimatePresence>
                    {state.showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-8"
                      >
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Answer</p>
                        <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-neon-cyan">
                          {currentQuestion.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                    <Button size="lg" variant="secondary" onClick={state.toggleShowAnswer} className="gap-2">
                      {state.showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                      {state.showAnswer ? 'Hide Answer' : 'Reveal Answer'}
                    </Button>
                    <Button size="lg" variant="outline" onClick={state.toggleShowQuestion} className="gap-2">
                      <EyeOff size={16} /> Hide Question
                    </Button>
                  </div>
                </motion.div>
              )
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <Monitor className="w-20 h-20 mx-auto text-muted-foreground/20" />
                <p className="font-display text-2xl text-muted-foreground/40">
                  {showPanel ? 'Select a question from the panel →' : 'Click "Show Questions" to pick a question'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mini scoreboard */}
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex gap-3 justify-center flex-wrap">
            {state.teams.map((team: any, i: number) => (
              <div
                key={team.id}
                className={`px-4 py-2 rounded-lg border transition-all
                  ${i === state.currentTeamIndex ? 'border-neon-cyan/50 bg-neon-cyan/10' : 'border-white/10 bg-white/5'}`}
              >
                <p className="text-xs text-muted-foreground">{team.name}</p>
                <p className="text-lg font-mono font-bold text-foreground text-center">{team.score}</p>
                <div className="flex gap-1 mt-1 justify-center">
                  <button className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30" onClick={() => state.updateScore(team.id, -5)}>-5</button>
                  <button className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30" onClick={() => state.updateScore(team.id, 5)}>+5</button>
                  <button className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30" onClick={() => state.updateScore(team.id, 10)}>+10</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side panel: Question selector */}
      {showPanel && (
        <div className="w-full md:w-80 md:border-l border-t md:border-t-0 border-white/10 bg-background/90 backdrop-blur-xl flex flex-col relative z-10 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Questions</p>
          </div>

          {/* Category filter */}
          <div className="px-3 py-2 border-b border-white/10 flex gap-1 max-h-24 overflow-x-auto md:overflow-auto flex-nowrap md:flex-wrap">
            <button
              onClick={() => state.setCategory('All')}
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors
                ${state.selectedCategory === 'All' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => state.setCategory(cat)}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors flex-shrink-0 whitespace-nowrap
                  ${state.selectedCategory === cat ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Questions grid - numbered tiles */}
          <div className="flex-1 overflow-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {state.filteredQuestions.map((q: any, i: number) => {
                const displayNumber = state.selectedCategory === 'All'
                  ? (idToOrdinal.get(q.id) ?? (i + 1))
                  : (i + 1);
                return (
                  <button
                    key={q.id}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border text-sm font-bold transition-all
                      ${q.used ? 'opacity-20 border-white/5 cursor-not-allowed' : 'border-white/10 hover:border-neon-cyan/40 hover:bg-neon-cyan/10 hover:scale-105'}
                      ${i === state.currentQuestionIndex && state.showQuestion ? 'border-neon-cyan/60 bg-neon-cyan/20 ring-1 ring-neon-cyan/30' : 'bg-white/5'}`}
                    onClick={() => { if (!q.used) { state.selectQuestion(i); state.markQuestionUsed(q.id); } }}
                    disabled={q.used}
                  >
                    <span className="text-lg text-foreground">{displayNumber}</span>
                    <span className={`mt-0.5 w-2 h-2 rounded-full bg-green-400`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplayView;
