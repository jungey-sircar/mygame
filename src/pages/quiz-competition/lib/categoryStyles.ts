export const CYBERCRIME_CATEGORY = 'Cybercrime and Cyberlaw';

export const getCategoryLabel = (category: string): string => {
  if (category === CYBERCRIME_CATEGORY) {
    return `🛡️ ${category}`;
  }
  return category;
};

export const getCategoryChipTone = (category: string, selected: boolean): string => {
  if (category === CYBERCRIME_CATEGORY) {
    return selected
      ? 'bg-red-500/20 text-red-200 border border-red-400/50 shadow-[0_0_12px_rgba(248,113,113,0.25)]'
      : 'bg-red-500/10 text-red-200 border border-red-500/30 hover:bg-red-500/20';
  }

  return selected
    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
    : 'bg-muted/20 text-muted-foreground hover:bg-muted/40';
};

export const getCategoryBadgeTone = (category: string): string => {
  if (category === CYBERCRIME_CATEGORY) {
    return 'bg-red-500/15 text-red-200 border border-red-400/40';
  }

  return 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20';
};