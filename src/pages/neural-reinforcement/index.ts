import {
  NEURAL_CARD_TYPE,
  NEURAL_REINFORCEMENT_CARD,
  type NeuralCardDefinition,
} from "./NeuralCard";

export type CardType = typeof NEURAL_CARD_TYPE | "support";

export interface CardRegistryItem {
  id: string;
  type: CardType;
  name: string;
  description: string;
  learnThreshold?: number;
  bonusScore?: number;
}

export const cardRegistry: Record<CardType, CardRegistryItem> = {
  [NEURAL_CARD_TYPE]: NEURAL_REINFORCEMENT_CARD,
  support: {
    id: "card-focus-burst",
    type: "support",
    name: "Focus Burst",
    description: "Stabilizes your loop while Neural Reinforcement ramps up.",
  },
};

export const generateDeck = (deckSize = 6): CardRegistryItem[] => {
  const deck: CardRegistryItem[] = [cardRegistry[NEURAL_CARD_TYPE]];
  while (deck.length < deckSize) {
    deck.push(cardRegistry.support);
  }
  return deck;
};

export const isNeuralCard = (
  card: CardRegistryItem,
): card is NeuralCardDefinition => card.type === NEURAL_CARD_TYPE;

export {
  NEURAL_CARD_TYPE,
  NEURAL_REINFORCEMENT_CARD,
  createInitialNeuralCardState,
  applyForgetting,
  playNeuralReinforcementCard,
} from "./NeuralCard";

export type {
  NeuralCardDefinition,
  NeuralCardState,
  PlayCardResult,
} from "./NeuralCard";
