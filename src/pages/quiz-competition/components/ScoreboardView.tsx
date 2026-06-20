import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Monitor, Trophy } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface ScoreboardViewProps {
  state: any;
}

export default function ScoreboardView({ state }: ScoreboardViewProps) {
  const sortedTeams = [...state.teams].sort((a: any, b: any) => b.score - a.score);
  const currentRound = state.rounds[state.currentRoundIndex];
  const maxScore = Math.max(...state.teams.map((t: any) => t.score), 1);

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[20%] w-[800px] h-[800px] bg-neon-purple/8 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-30%] right-[20%] w-[800px] h-[800px] bg-neon-cyan/8 rounded-full blur-[200px]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => state.setView('host')}>
            <ArrowLeft size={14} /> Host
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => state.setView('display')}>
            <Monitor size={14} /> Display
          </Button>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{currentRound?.name}</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Title */}
      <div className="relative z-10 text-center py-8">
        <Trophy className="w-12 h-12 mx-auto text-amber-400 mb-3" />
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-foreground text-glow-purple">
          SCOREBOARD
        </h1>
      </div>

      {/* Scores */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 max-w-4xl mx-auto w-full gap-4">
        {sortedTeams.map((team: any, i: number) => (
          <motion.div
            key={team.id}
            layout
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="w-full"
          >
            <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all
              ${i === 0 ? 'border-amber-400/30 bg-amber-400/5' :
                i === 1 ? 'border-gray-300/20 bg-gray-300/5' :
                i === 2 ? 'border-amber-700/20 bg-amber-700/5' :
                'border-border bg-muted/20'}`}
            >
              {/* Rank */}
              <span className={`text-3xl font-display font-black min-w-[3rem] text-center
                ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                #{i + 1}
              </span>

              {/* Team name */}
              <div className="flex-1">
                <p className="text-xl sm:text-2xl font-display font-bold text-foreground">{team.name}</p>
              </div>

              {/* Score bar */}
              <div className="hidden sm:block flex-1 max-w-[200px]">
                <div className="h-3 rounded-full bg-muted/20 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: `${(team.score / maxScore) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </div>

              {/* Score */}
              <span className={`text-3xl sm:text-4xl font-mono font-black min-w-[5rem] text-right
                ${i === 0 ? 'text-amber-400' : 'text-neon-cyan'}`}>
                {team.score}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 text-center py-6">
        <p className="text-xs text-muted-foreground/40 uppercase tracking-widest">nerd.fun • Live Quiz Competition</p>
      </div>
    </div>
  );
}
