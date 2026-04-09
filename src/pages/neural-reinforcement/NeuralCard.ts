export const NEURAL_CARD_TYPE = "neural-reinforcement" as const;

export interface NeuralCardDefinition {
  id: string;
  type: typeof NEURAL_CARD_TYPE;
  name: "Neural Reinforcement";
  description: "Simulates synaptic strengthening through repeated activation";
  learnThreshold: number;
  bonusScore: number;
}

export interface NeuralCardState {
  connectionStrength: number;
  isLearned: boolean;
  activationCount: number;
  lastActivatedTurn: number;
}

export interface PlayCardContext {
  turn: number;
}

export interface PlayCardResult {
  state: NeuralCardState;
  scoreDelta: number;
  becameLearnedThisTurn: boolean;
}

export const NEURAL_REINFORCEMENT_CARD: NeuralCardDefinition = {
  id: "card-neural-reinforcement",
  type: NEURAL_CARD_TYPE,
  name: "Neural Reinforcement",
  description: "Simulates synaptic strengthening through repeated activation",
  learnThreshold: 3,
  bonusScore: 2,
};

export const createInitialNeuralCardState = (): NeuralCardState => ({
  connectionStrength: 0,
  isLearned: false,
  activationCount: 0,
  lastActivatedTurn: 0,
});

export const applyForgetting = (
  state: NeuralCardState,
  currentTurn: number,
  decayAfterTurns = 4,
): NeuralCardState => {
  if (state.lastActivatedTurn === 0) {
    return state;
  }

  const turnsSinceActivation = currentTurn - state.lastActivatedTurn;
  if (turnsSinceActivation < decayAfterTurns || state.connectionStrength <= 0) {
    return state;
  }

  const nextStrength = Math.max(0, state.connectionStrength - 1);
  return {
    ...state,
    connectionStrength: nextStrength,
  };
};

export const playNeuralReinforcementCard = (
  card: NeuralCardDefinition,
  previous: NeuralCardState,
  context: PlayCardContext,
): PlayCardResult => {
  const nextActivationCount = previous.activationCount + 1;
  const nextConnectionStrength = previous.connectionStrength + 1;
  const nextIsLearned = nextActivationCount >= card.learnThreshold;
  const becameLearnedThisTurn = nextIsLearned && !previous.isLearned;

  return {
    state: {
      connectionStrength: nextConnectionStrength,
      activationCount: nextActivationCount,
      isLearned: nextIsLearned,
      lastActivatedTurn: context.turn,
    },
    scoreDelta: becameLearnedThisTurn ? card.bonusScore : 0,
    becameLearnedThisTurn,
  };
};
