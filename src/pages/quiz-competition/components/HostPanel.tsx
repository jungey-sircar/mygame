import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, ChevronRight, Users, Layers, HelpCircle, Clock, RotateCcw, Monitor, Trophy, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categories, roundTypes, type Category, type RoundType } from '../data/questions';
import { getCategoryBadgeTone, getCategoryChipTone, getCategoryLabel } from '../lib/categoryStyles';

interface HostPanelProps {
  state: any;
}

export default function HostPanel({ state }: HostPanelProps) {
  const [activeTab, setActiveTab] = useState<'teams' | 'rounds' | 'questions' | 'timer'>('teams');
  const [newTeamName, setNewTeamName] = useState('');
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundType, setNewRoundType] = useState<RoundType>('General Knowledge Round');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQ, setNewQ] = useState({ text: '', answer: '', category: 'Programming' as string, difficulty: 'medium' as const });
  const [importJson, setImportJson] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [allCategories, setAllCategories] = useState<string[]>([...categories]);
  const [sessionAddedIds, setSessionAddedIds] = useState<Set<string>>(new Set());

  // Track recently added questions this session
  const recentlyAdded = useMemo(() => {
    if (sessionAddedIds.size === 0) return [];
    return state.filteredQuestions.filter((q: any) => sessionAddedIds.has(q.id));
  }, [state.filteredQuestions, sessionAddedIds]);

  // Wrap addQuestion to track session-added IDs
  const handleAddQuestion = async (q: any) => {
    const prevIds = new Set(state.questions?.map((qq: any) => qq.id) || []);
    await state.addQuestion(q);
    // We'll check for new IDs after state updates via effect-like approach
    setTimeout(() => {
      // Find the newest question by checking what's new
      const allQs = JSON.parse(localStorage.getItem('quiz-competition-state') || '{}').questions || [];
      const newQ = allQs.find((qq: any) => !prevIds.has(qq.id));
      if (newQ) {
        setSessionAddedIds(prev => new Set([...prev, newQ.id]));
      }
    }, 100);
  };

  const tabs = [
    { id: 'teams' as const, label: 'Teams', icon: Users },
    { id: 'rounds' as const, label: 'Rounds', icon: Layers },
    { id: 'questions' as const, label: 'Questions', icon: HelpCircle },
    { id: 'timer' as const, label: 'Timer', icon: Clock },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top: Current state bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-background/80 backdrop-blur-xl flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Round:</span>
          <span className="text-sm font-bold text-neon-cyan">{state.rounds[state.currentRoundIndex]?.name ?? 'None'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Turn:</span>
          <span className="text-sm font-bold text-neon-purple">{state.teams[state.currentTeamIndex]?.name ?? 'None'}</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" className="text-xs h-7 gap-1" onClick={state.nextTeam}>
            <ChevronRight size={12} /> Next Team
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => state.setView('display')}>
            <Monitor size={12} /> Display
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => state.setView('scoreboard')}>
            <Trophy size={12} /> Scoreboard
          </Button>
        </div>
      </div>

      {/* Host-only answer preview */}
      {state.currentQuestionIndex >= 0 && state.filteredQuestions[state.currentQuestionIndex] && (
        <div className="px-4 py-2.5 border-b border-white/10 bg-neon-cyan/5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
            <Eye size={10} /> Host Answer Preview
          </p>
          <p className="text-xs text-muted-foreground mb-0.5">{state.filteredQuestions[state.currentQuestionIndex].text}</p>
          <p className="text-sm font-bold text-neon-cyan">{state.filteredQuestions[state.currentQuestionIndex].answer}</p>
        </div>
      )}


      <div className="flex border-b border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors
              ${activeTab === tab.id ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'teams' && (
          <div className="space-y-3">
            {/* Add team */}
            <div className="flex gap-2">
              <input
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="New team name..."
                className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-neon-cyan/50"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTeamName.trim()) {
                    state.addTeam(newTeamName.trim());
                    setNewTeamName('');
                  }
                }}
              />
              <Button size="sm" onClick={() => { if (newTeamName.trim()) { state.addTeam(newTeamName.trim()); setNewTeamName(''); } }} className="gap-1">
                <Plus size={14} /> Add
              </Button>
            </div>

            {/* Teams list */}
            <AnimatePresence>
              {state.teams.map((team: any, i: number) => (
                <motion.div
                  key={team.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`glass-panel p-3 flex items-center gap-3 ${i === state.currentTeamIndex ? 'border-neon-cyan/50 bg-neon-cyan/5' : ''}`}
                >
                  {i === state.currentTeamIndex && (
                    <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                  )}
                  <div className="flex-1">
                    {editingTeam === team.id ? (
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => { state.editTeamName(team.id, editName); setEditingTeam(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') { state.editTeamName(team.id, editName); setEditingTeam(null); } }}
                        className="bg-transparent border-b border-neon-cyan text-sm text-foreground outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm font-bold text-foreground">{team.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => state.updateScore(team.id, -5)}>-5</Button>
                    <span className="text-lg font-mono font-bold text-neon-purple min-w-[3rem] text-center">{team.score}</span>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400" onClick={() => state.updateScore(team.id, 5)}>+5</Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400" onClick={() => state.updateScore(team.id, 10)}>+10</Button>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingTeam(team.id); setEditName(team.name); }}>
                    <Edit3 size={12} />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => state.removeTeam(team.id)}>
                    <Trash2 size={12} />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'rounds' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <input
                value={newRoundName}
                onChange={e => setNewRoundName(e.target.value)}
                placeholder="Round name..."
                className="flex-1 min-w-[150px] px-3 py-2 rounded-lg bg-muted/30 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-neon-cyan/50"
              />
              <select
                value={newRoundType}
                onChange={e => setNewRoundType(e.target.value as RoundType)}
                className="px-2 py-2 rounded-lg bg-muted/30 border border-white/10 text-xs text-foreground"
              >
                {roundTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
              </select>
              <Button size="sm" onClick={() => { state.addRound(newRoundName.trim() || newRoundType, newRoundType); setNewRoundName(''); }} className="gap-1">
                <Plus size={14} /> Add
              </Button>
            </div>

            {state.rounds.map((round: any, i: number) => (
              <div
                key={round.id}
                className={`glass-panel p-3 flex items-center gap-3 cursor-pointer transition-colors
                  ${i === state.currentRoundIndex ? 'border-neon-purple/50 bg-neon-purple/5' : 'hover:bg-muted/20'}`}
                onClick={() => state.setCurrentRound(i)}
              >
                {i === state.currentRoundIndex && <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />}
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{round.name}</p>
                  <p className="text-[10px] text-muted-foreground">{round.type}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={e => { e.stopPropagation(); state.removeRound(round.id); }}>
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-3">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => state.setCategory('All')}
                className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:scale-110
                  ${state.selectedCategory === 'All' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'}`}
              >
                All
              </button>
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => state.setCategory(cat as any)}
                  className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:scale-110
                    ${getCategoryChipTone(cat, state.selectedCategory === cat)}`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>

            {/* Add custom category */}
            <div className="flex gap-2">
              <input
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="New topic/category..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-muted/30 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-neon-cyan/50"
                onKeyDown={e => {
                  if (e.key === 'Enter' && customCategory.trim()) {
                    setAllCategories(prev => prev.includes(customCategory.trim()) ? prev : [...prev, customCategory.trim()]);
                    setCustomCategory('');
                  }
                }}
              />
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                if (customCategory.trim()) {
                  setAllCategories(prev => prev.includes(customCategory.trim()) ? prev : [...prev, customCategory.trim()]);
                  setCustomCategory('');
                }
              }}>+ Topic</Button>
            </div>

            {/* Add question / import */}
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="gap-1 text-xs" onClick={() => { setShowAddQuestion(!showAddQuestion); setShowImport(false); }}>
                <Plus size={12} /> Add Question
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => { setShowImport(!showImport); setShowAddQuestion(false); setImportStatus(null); }}>
                <Upload size={12} /> Import JSON
              </Button>
            </div>

            {/* Import JSON panel */}
            {showImport && (
              <div className="glass-panel p-3 space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Import questions from JSON</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                      const text = ev.target?.result as string;
                      const result = state.importQuestions(text);
                      setImportStatus(result ? `✅ Imported successfully from ${file.name}` : '❌ Invalid JSON format');
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
                <Button size="sm" variant="secondary" className="w-full gap-1 text-xs" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={12} /> Choose .json File
                </Button>
                <div className="relative">
                  <p className="text-[10px] text-muted-foreground mb-1">Or paste JSON below:</p>
                  <textarea
                    value={importJson}
                    onChange={e => setImportJson(e.target.value)}
                    placeholder={'[\n  { "text": "Question?", "answer": "Answer", "category": "Programming", "difficulty": "easy" }\n]'}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-neon-cyan/50 font-mono resize-none"
                  />
                </div>
                <Button size="sm" className="w-full text-xs" onClick={() => {
                  if (!importJson.trim()) return;
                  const result = state.importQuestions(importJson);
                  setImportStatus(result ? '✅ Imported successfully!' : '❌ Invalid JSON format. Expected an array of {text, answer, category, difficulty}');
                  if (result) setImportJson('');
                }}>
                  Import Pasted JSON
                </Button>
                {importStatus && (
                  <p className={`text-xs ${importStatus.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{importStatus}</p>
                )}
              </div>
            )}

            {showAddQuestion && (
              <div className="glass-panel p-3 space-y-2">
                <input value={newQ.text} onChange={e => setNewQ(p => ({ ...p, text: e.target.value }))} placeholder="Question text..." className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-white/10 text-sm text-foreground outline-none" />
                <input value={newQ.answer} onChange={e => setNewQ(p => ({ ...p, answer: e.target.value }))} placeholder="Answer..." className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-white/10 text-sm text-foreground outline-none" />
                <div className="flex gap-2">
                  <select value={newQ.category} onChange={e => setNewQ(p => ({ ...p, category: e.target.value }))} className="flex-1 px-2 py-2 rounded-lg bg-muted/30 border border-white/10 text-xs text-foreground">
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={newQ.difficulty} onChange={e => setNewQ(p => ({ ...p, difficulty: e.target.value as any }))} className="px-2 py-2 rounded-lg bg-muted/30 border border-white/10 text-xs text-foreground">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <Button size="sm" onClick={() => { handleAddQuestion(newQ); setNewQ({ text: '', answer: '', category: 'Programming', difficulty: 'medium' }); setShowAddQuestion(false); }}>Save</Button>
                </div>
              </div>
            )}

            {/* Category question count summary */}
            <div className="glass-panel p-3 space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Questions per Category</p>
              {allCategories.map(cat => {
                const catQuestions = state.questions?.filter((q: any) => q.category === cat) || [];
                const usedCount = catQuestions.filter((q: any) => q.used).length;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeTone(cat)}`}>
                      {getCategoryLabel(cat)}
                    </span>
                    <span className="text-muted-foreground font-mono">{usedCount}/{catQuestions.length} used</span>
                  </div>
                );
              })}
            </div>

            {/* Recently added questions this session */}
            {recentlyAdded.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Recently Added (this session)</p>
                {recentlyAdded.map((q: any) => (
                  <div key={q.id} className="p-2.5 rounded-lg border border-white/10 bg-muted/20">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-foreground flex-1">{q.text}</p>
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive" onClick={() => state.deleteQuestion(q.id)}>
                        <Trash2 size={10} />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{getCategoryLabel(q.category)} · {q.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="space-y-6">
            {/* Timer display */}
            <div className="text-center">
              <div className={`font-mono text-8xl font-black ${state.timerValue <= 5 && state.timerValue > 0 ? 'text-red-400 animate-pulse' : state.timerValue === 0 ? 'text-red-500' : 'text-neon-cyan'}`}>
                {state.timerValue}
              </div>
              <p className="text-xs text-muted-foreground mt-2">seconds remaining</p>
            </div>

            {/* Duration presets */}
            <div className="flex gap-2 justify-center">
              {[10, 15, 20, 30, 45, 60].map(d => (
                <Button
                  key={d}
                  size="sm"
                  variant={state.timerDuration === d ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => state.setTimerDuration(d)}
                >
                  {d}s
                </Button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-2 justify-center">
              <Button onClick={state.startTimer} disabled={state.timerRunning} className="gap-1">
                ▶ Start
              </Button>
              <Button variant="secondary" onClick={state.pauseTimer} disabled={!state.timerRunning} className="gap-1">
                ⏸ Pause
              </Button>
              <Button variant="outline" onClick={state.resetTimer} className="gap-1">
                <RotateCcw size={14} /> Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Reset */}
      <div className="px-4 py-2 border-t border-white/10 flex justify-end">
        <Button size="sm" variant="destructive" className="text-xs gap-1" onClick={() => { if (confirm('Reset all quiz data?')) state.resetAll(); }}>
          <RotateCcw size={12} /> Reset All
        </Button>
      </div>
    </div>
  );
}
