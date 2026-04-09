import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BrainCircuit, RefreshCcw } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import Neural3DVisualization from "./Neural3DVisualization";
import {
  applyForgetting,
  createInitialNeuralCardState,
  generateDeck,
  isNeuralCard,
  playNeuralReinforcementCard,
  type CardRegistryItem,
} from ".";

interface GameLoopState {
  turn: number;
  score: number;
  multiplier: number;
}

const initialLoopState: GameLoopState = {
  turn: 0,
  score: 0,
  multiplier: 1,
};

const NeuralReinforcement = () => {
  const deck = useMemo<CardRegistryItem[]>(() => generateDeck(6), []);
  const neuralCard = useMemo(() => deck.find(isNeuralCard), [deck]);

  const [gameLoop, setGameLoop] = useState<GameLoopState>(initialLoopState);
  const [neuralState, setNeuralState] = useState(createInitialNeuralCardState);
  const [lastDelta, setLastDelta] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  const playNeuralCard = () => {
    if (!neuralCard) return;

    const nextTurn = gameLoop.turn + 1;
    const decayedState = applyForgetting(neuralState, nextTurn, 4);
    const result = playNeuralReinforcementCard(neuralCard, decayedState, { turn: nextTurn });

    setNeuralState(result.state);
    setPulseKey((prev) => prev + 1);

    const multiplierBoost = result.becameLearnedThisTurn ? 1 : 0;
    const effectiveDelta = result.scoreDelta * gameLoop.multiplier;

    setLastDelta(effectiveDelta);
    setGameLoop((prev) => ({
      turn: nextTurn,
      score: prev.score + effectiveDelta,
      multiplier: prev.multiplier + multiplierBoost,
    }));
  };

  const advanceTurnWithoutCard = () => {
    const nextTurn = gameLoop.turn + 1;
    setNeuralState((prev) => applyForgetting(prev, nextTurn, 4));
    setGameLoop((prev) => ({ ...prev, turn: nextTurn }));
    setLastDelta(0);
  };

  const resetSimulation = () => {
    setGameLoop(initialLoopState);
    setNeuralState(createInitialNeuralCardState());
    setLastDelta(0);
    setPulseKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-cyan-200 hover:text-cyan-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>
          <Button variant="outline" onClick={resetSimulation} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/50 backdrop-blur p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl sm:text-4xl font-black text-cyan-100 flex items-center gap-2">
                <BrainCircuit className="w-7 h-7 text-cyan-300" />
                Neural Reinforcement
              </h1>
              <p className="mt-2 text-cyan-50/80 text-sm sm:text-base max-w-xl">
                Simulates synaptic strengthening through repeated activation. Play the card repeatedly to strengthen
                connections, reach learned state, and claim a gameplay bonus.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 min-w-[220px] text-xs sm:text-sm">
              <div className="rounded-lg border border-cyan-300/20 bg-black/20 p-3">
                <p className="text-cyan-200/70">Turn</p>
                <p className="text-cyan-100 font-semibold text-lg">{gameLoop.turn}</p>
              </div>
              <div className="rounded-lg border border-cyan-300/20 bg-black/20 p-3">
                <p className="text-cyan-200/70">Score</p>
                <p className="text-cyan-100 font-semibold text-lg">{gameLoop.score}</p>
              </div>
              <div className="rounded-lg border border-cyan-300/20 bg-black/20 p-3">
                <p className="text-cyan-200/70">Multiplier</p>
                <p className="text-cyan-100 font-semibold text-lg">x{gameLoop.multiplier}</p>
              </div>
              <div className="rounded-lg border border-cyan-300/20 bg-black/20 p-3">
                <p className="text-cyan-200/70">Last Bonus</p>
                <p className="text-cyan-100 font-semibold text-lg">+{lastDelta}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5">
          <div className="rounded-2xl border border-cyan-300/20 bg-slate-900/50 backdrop-blur p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-cyan-100">Synaptic Graph (3D)</h2>
            <Neural3DVisualization
              connectionStrength={neuralState.connectionStrength}
              pulseKey={pulseKey}
              isLearned={neuralState.isLearned}
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={playNeuralCard} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold">
                Play Neural Reinforcement
              </Button>
              <Button variant="outline" onClick={advanceTurnWithoutCard}>
                Skip Turn (forgetting test)
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-slate-900/50 backdrop-blur p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-cyan-100">Card State</h2>
            <div className="space-y-2 text-sm text-cyan-50/90">
              <p><span className="text-cyan-300">Name:</span> {neuralCard?.name ?? "Unavailable"}</p>
              <p><span className="text-cyan-300">Description:</span> {neuralCard?.description ?? "Unavailable"}</p>
              <p><span className="text-cyan-300">connectionStrength:</span> {neuralState.connectionStrength}</p>
              <p><span className="text-cyan-300">isLearned:</span> {String(neuralState.isLearned)}</p>
              <p><span className="text-cyan-300">Activations:</span> {neuralState.activationCount}</p>
              <p><span className="text-cyan-300">Learn threshold:</span> {neuralCard?.learnThreshold ?? "--"}</p>
            </div>

            {neuralState.isLearned ? (
              <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 p-3 text-emerald-200 text-sm">
                Learned achieved. Bonus active: +{neuralCard?.bonusScore ?? 0} score and +1 multiplier.
              </div>
            ) : (
              <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 p-3 text-cyan-200 text-sm">
                Keep activating this card to reach the learned threshold.
              </div>
            )}

            <div className="pt-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300/70 mb-2">Deck Generation</p>
              <ul className="space-y-1 text-xs text-cyan-50/80">
                {deck.map((card, index) => (
                  <li key={`${card.id}-${index}`} className="rounded bg-black/20 border border-cyan-300/10 px-2 py-1">
                    {index + 1}. {card.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NeuralReinforcement;
