import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ─── Level Data ───────────────────────────────────────────────
interface Level {
  name: string;
  scenario: string;
  leftLabel: string;
  rightLabel: string;
  leftCount: string;
  rightCount: string;
  leftVictims: number;
  rightVictims: number;
  note?: string;
  debatable?: "left" | "right" | "both";
  leftIcon?: "money" | "painting" | "infrastructure" | "trauma" | "embarrassment" | "you" | "richman" | "lobsters" | "cat" | "sleeping";
  rightIcon?: "money" | "painting" | "infrastructure" | "trauma" | "embarrassment" | "you" | "richman" | "lobsters" | "cat" | "sleeping";
}

const levels: Level[] = [
  { name: "The Original", scenario: "Oh no! A trolley is heading toward five people on the main track. You can pull the lever to divert it to a side track, where one person is tied down.", leftLabel: "Five Unnamed People", rightLabel: "One Unnamed Person", leftCount: "5 die", rightCount: "1 dies", leftVictims: 5, rightVictims: 1 },
  { name: "Four People", scenario: "Oh no! A trolley is heading toward five people. You can divert it, but four people are on the other track.", leftLabel: "Five Unnamed People", rightLabel: "Four Unnamed People", leftCount: "5 die", rightCount: "4 die", leftVictims: 5, rightVictims: 4 },
  { name: "Life Savings", scenario: "Oh no! A trolley is heading toward five people. You can divert it onto a track that destroys your entire life savings.", leftLabel: "Five Unnamed People", rightLabel: "Your Life Savings Destroyed", leftCount: "5 die", rightCount: "💸 Gone", leftVictims: 5, rightVictims: 0, rightIcon: "money" },
  { name: "You", scenario: "Oh no! A trolley is heading toward five people. You can divert it, but the other track leads directly to you.", leftLabel: "Five Unnamed People", rightLabel: "You", leftCount: "5 die", rightCount: "You die", leftVictims: 5, rightVictims: 0, rightIcon: "you" },
  { name: "Priceless Painting", scenario: "Oh no! A trolley is heading toward five people. You can divert it, but a priceless painting will be destroyed.", leftLabel: "Five Unnamed People", rightLabel: "Priceless Painting", leftCount: "5 die", rightCount: "🎨 Destroyed", leftVictims: 5, rightVictims: 0, rightIcon: "painting" },
  { name: "Bribes", scenario: "Oh no! A trolley is heading toward a rich man who offered you a bribe. The other track has an unnamed person.", leftLabel: "Unnamed Rich Man", rightLabel: "Unnamed Person", leftCount: "1 dies", rightCount: "1 dies", leftVictims: 0, rightVictims: 1, leftIcon: "richman" },
  { name: "Levels of Sentience", scenario: "Oh no! A trolley is heading toward five lobsters. You can divert it toward one cat.", leftLabel: "Five Lobsters", rightLabel: "One Cat", leftCount: "5 🦞", rightCount: "1 🐱", leftVictims: 0, rightVictims: 0, leftIcon: "lobsters", rightIcon: "cat" },
  { name: "Sleeping", scenario: "Oh no! A trolley is heading toward five sleeping people. You can divert it toward one awake person.", leftLabel: "Five Sleeping People", rightLabel: "One Awake Person", leftCount: "5 😴", rightCount: "1 👀", leftVictims: 0, rightVictims: 1, leftIcon: "sleeping" },
  { name: "Personal Choices", scenario: "Oh no! A trolley is heading toward one person. You can divert it toward five people who tied themselves to the track voluntarily.", leftLabel: "One Person", rightLabel: "Five People (Tied Themselves)", leftCount: "1 dies", rightCount: "5 die", leftVictims: 1, rightVictims: 5 },
  { name: "Mercy", scenario: "Oh no! A trolley is heading toward five people. You can divert it toward one person, but they will be run over painfully slowly.", leftLabel: "Five People", rightLabel: "One Person (Painfully Slow)", leftCount: "5 die", rightCount: "1 dies slowly", leftVictims: 5, rightVictims: 1 },
  { name: "Minor Inconvenience", scenario: "Oh no! A trolley is heading toward one man. You can divert it to an empty track, but you'll suffer a minor embarrassment.", leftLabel: "One Man", rightLabel: "Nobody Dies (Minor Embarrassment)", leftCount: "1 dies", rightCount: "😳", leftVictims: 1, rightVictims: 0, rightIcon: "embarrassment" },
  { name: "Best Friend", scenario: "Oh no! A trolley is heading toward your best friend. You can divert it toward five unnamed people.", leftLabel: "Your Best Friend", rightLabel: "Five Unnamed People", leftCount: "1 💔", rightCount: "5 die", leftVictims: 1, rightVictims: 5 },
  { name: "Can't See", scenario: "Oh no! A trolley is heading toward people, but visibility is poor. There seem to be five people on one track and one on the other… maybe.", leftLabel: "Five People", rightLabel: "One Person", leftCount: "5?", rightCount: "1?", leftVictims: 5, rightVictims: 1, debatable: "both" },
  { name: "Cousins", scenario: "Oh no! A trolley is heading toward your first cousin. You can divert it toward three of your second cousins.", leftLabel: "Your First Cousin", rightLabel: "Three Second Cousins", leftCount: "1 dies", rightCount: "3 die", leftVictims: 1, rightVictims: 3 },
  { name: "Age", scenario: "Oh no! A trolley is heading toward five elderly people. You can divert it toward one baby.", leftLabel: "Five Elderly People", rightLabel: "One Baby", leftCount: "5 👴", rightCount: "1 👶", leftVictims: 5, rightVictims: 1 },
  { name: "Clones", scenario: "Oh no! A trolley is heading toward you. You can divert it toward five of your clones.", leftLabel: "You", rightLabel: "Five of Your Clones", leftCount: "1 (you)", rightCount: "5 (also you?)", leftVictims: 1, rightVictims: 5 },
  { name: "Mystery Box", scenario: "Oh no! A trolley is heading toward either two or zero people (90% chance it's zero). The other track has either ten or zero people (50% chance it's zero).", leftLabel: "Two People (Maybe)", rightLabel: "Ten People (Maybe)", leftCount: "2?", rightCount: "10?", leftVictims: 2, rightVictims: 3, note: "Left: 90% chance nobody is there. Right: 50% chance nobody is there." },
  { name: "I Am Robot", scenario: "Oh no! A trolley is heading toward five robots. You can divert it toward one human.", leftLabel: "Five Robots", rightLabel: "One Human", leftCount: "5 🤖", rightCount: "1 🧑", leftVictims: 5, rightVictims: 1 },
  { name: "Economic Damage", scenario: "Oh no! A trolley is heading toward a critical infrastructure point. If it hits, massive economic collapse follows. The other track has one person.", leftLabel: "Massive Economic Collapse", rightLabel: "One Person", leftCount: "📉💥", rightCount: "1 dies", leftVictims: 0, rightVictims: 1, leftIcon: "infrastructure" },
  { name: "External Costs", scenario: "Oh no! A trolley's CO₂ emissions will eventually kill five people over decades. You can stop it now, but nobody is immediately harmed either way.", leftLabel: "Five People Die (CO₂ Over Time)", rightLabel: "Nobody Immediately Harmed", leftCount: "5 (eventually)", rightCount: "0", leftVictims: 5, rightVictims: 0 },
  { name: "Reincarnation", scenario: "Oh no! A trolley is heading toward one reincarnated version of you. You can divert it toward five reincarnated versions of you.", leftLabel: "One Reincarnated You", rightLabel: "Five Reincarnated Yous", leftCount: "1 past you", rightCount: "5 past yous", leftVictims: 1, rightVictims: 5 },
  { name: "Harmless Prank?", scenario: "Oh no! A trolley is heading toward an empty track, but the sound will cause lifelong psychological trauma to a bystander. The other track is also empty.", leftLabel: "Nobody Dies", rightLabel: "Psychological Trauma", leftCount: "0 (trauma-free)", rightCount: "0 (but 😰)", leftVictims: 0, rightVictims: 0, rightIcon: "trauma" },
  { name: "Citizens", scenario: "Oh no! A trolley is heading toward a known bad citizen. You can divert it toward a known good citizen.", leftLabel: "Bad Citizen", rightLabel: "Good Citizen", leftCount: "1 😈", rightCount: "1 😇", leftVictims: 1, rightVictims: 1 },
  { name: "Eternity", scenario: "Oh no! A runaway trolley's brakes have failed. The driver will be blown up, or you can divert it to blow up eight passengers.", leftLabel: "Trolley Driver Blown Up", rightLabel: "Eight Passengers Blown Up", leftCount: "1", rightCount: "8", leftVictims: 1, rightVictims: 5, debatable: "both" },
  { name: "Enemy", scenario: "Oh no! A trolley is heading toward your worst enemy. The other track is completely empty. Nobody else is in danger.", leftLabel: "Your Worst Enemy", rightLabel: "Nobody", leftCount: "1 😠", rightCount: "0", leftVictims: 1, rightVictims: 0 },
];

// ─── Animation Phases ─────────────────────────────────────────
type AnimPhase = "idle" | "lever" | "switch" | "travel" | "freeze" | "splat" | "fadeout";
type IllustrationTheme = "dark" | "light";

// ─── SVG Sub-Components ───────────────────────────────────────

/** Single stick-figure person, built from SVG primitives */
const PersonSVG = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="-12" r="4" fill="none" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="0" y1="-8" x2="0" y2="4" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="-5" y1="-2" x2="5" y2="-2" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="0" y1="4" x2="-4" y2="12" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="0" y1="4" x2="4" y2="12" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
  </g>
);

/** Dynamically render N victims along a track endpoint */
const VictimGroup = ({
  count,
  baseX,
  baseY,
  spacing = 15,
  visible,
}: {
  count: number;
  baseX: number;
  baseY: number;
  spacing?: number;
  visible: boolean;
}) => {
  const clamped = Math.min(count, 6);
  return (
    <motion.g
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      {Array.from({ length: clamped }, (_, i) => (
        <PersonSVG key={i} x={baseX + i * spacing} y={baseY} scale={0.9} />
      ))}
    </motion.g>
  );
};

/** SVG icons for non-person track items */
const TrackIconSVG = ({ type, x, y }: { type: string; x: number; y: number }) => {
  switch (type) {
    case "money":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Money bag */}
          <path d="M-10,8 Q-12,-2 -6,-8 Q0,-14 6,-8 Q12,-2 10,8 Q8,14 0,14 Q-8,14 -10,8Z" fill="#f0d060" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinejoin="round" />
          <text x="0" y="7" fontSize="11" fontWeight="900" fill="var(--ink-1)" textAnchor="middle" style={{ fontFamily: "serif" }}>$</text>
          {/* Scattered coins */}
          <ellipse cx="14" cy="10" rx="4" ry="3" fill="#e6c430" stroke="var(--ink-1)" strokeWidth="1" />
          <ellipse cx="-14" cy="12" rx="3.5" ry="2.5" fill="#e6c430" stroke="var(--ink-1)" strokeWidth="1" />
        </g>
      );
    case "painting":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Gold ornate frame */}
          <rect x="-14" y="-18" width="28" height="32" rx="2" fill="#c8a84e" stroke="#8B6914" strokeWidth="2" />
          <rect x="-12" y="-16" width="24" height="28" rx="1" fill="#2c1810" stroke="#8B6914" strokeWidth="0.5" />
          {/* Mona Lisa - simplified SVG portrait */}
          {/* Background landscape */}
          <rect x="-11" y="-15" width="22" height="26" fill="#6b7c4e" />
          <path d="M-11,4 Q-4,-2 0,2 Q4,-1 11,5 L11,11 L-11,11Z" fill="#4a5c2e" />
          {/* Sky */}
          <rect x="-11" y="-15" width="22" height="14" fill="#8faaac" />
          {/* Winding path */}
          <path d="M2,6 Q6,2 4,-2 Q3,-6 8,-10" stroke="#9b8c6e" strokeWidth="1.5" fill="none" opacity="0.5" />
          {/* Body / dress */}
          <path d="M-5,2 Q-6,-2 -4,-6 Q0,-8 4,-6 Q6,-2 5,2 Q4,8 3,11 L-3,11 Q-4,8 -5,2Z" fill="#3d2b1f" stroke="#2a1a0f" strokeWidth="0.5" />
          {/* Neck */}
          <rect x="-1.5" y="-8" width="3" height="3" fill="#d4a574" rx="0.5" />
          {/* Face */}
          <ellipse cx="0" cy="-11" rx="3.5" ry="4" fill="#d4a574" stroke="#b8956a" strokeWidth="0.3" />
          {/* Hair */}
          <path d="M-3.5,-13 Q-4,-16 -2,-15 Q0,-17 2,-15 Q4,-16 3.5,-13 Q4,-11 3.8,-9 Q4,-8 3,-7" fill="#2a1a0f" stroke="none" />
          <path d="M-3.5,-13 Q-4,-11 -3.8,-9 Q-4,-8 -3,-7" fill="#2a1a0f" stroke="none" />
          {/* Eyes */}
          <ellipse cx="-1.2" cy="-11.5" rx="0.8" ry="0.4" fill="var(--ink-1)" />
          <ellipse cx="1.2" cy="-11.5" rx="0.8" ry="0.4" fill="var(--ink-1)" />
          {/* Famous subtle smile */}
          <path d="M-1.5,-9.2 Q0,-8.5 1.5,-9.2" stroke="#8B6914" strokeWidth="0.4" fill="none" strokeLinecap="round" />
          {/* Hands folded */}
          <ellipse cx="-1" cy="1" rx="2" ry="1.2" fill="#d4a574" stroke="#b8956a" strokeWidth="0.3" />
          <ellipse cx="1.5" cy="0.5" rx="1.8" ry="1" fill="#d4a574" stroke="#b8956a" strokeWidth="0.3" />
        </g>
      );
    case "infrastructure":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Building */}
          <rect x="-8" y="-14" width="16" height="22" fill="#95a5a6" stroke="var(--ink-1)" strokeWidth="1.5" />
          <rect x="-5" y="-10" width="4" height="4" fill="#3498db" stroke="var(--ink-1)" strokeWidth="0.5" />
          <rect x="1" y="-10" width="4" height="4" fill="#3498db" stroke="var(--ink-1)" strokeWidth="0.5" />
          <rect x="-5" y="-3" width="4" height="4" fill="#3498db" stroke="var(--ink-1)" strokeWidth="0.5" />
          <rect x="1" y="-3" width="4" height="4" fill="#3498db" stroke="var(--ink-1)" strokeWidth="0.5" />
          {/* Chart arrow going down */}
          <path d="M12,-8 L16,-2 L20,-10" stroke="#e74c3c" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "trauma":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Worried face */}
          <circle cx="0" cy="-4" r="10" fill="#ffeaa7" stroke="var(--ink-1)" strokeWidth="1.5" />
          <circle cx="-4" cy="-6" r="1.5" fill="var(--ink-1)" />
          <circle cx="4" cy="-6" r="1.5" fill="var(--ink-1)" />
          <path d="M-4,2 Q0,-1 4,2" stroke="var(--ink-1)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Sweat drop */}
          <path d="M10,-8 Q12,-12 11,-6Z" fill="#74b9ff" stroke="var(--ink-1)" strokeWidth="0.5" />
        </g>
      );
    case "embarrassment":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Blushing face */}
          <circle cx="0" cy="-4" r="10" fill="#ffeaa7" stroke="var(--ink-1)" strokeWidth="1.5" />
          <line x1="-5" y1="-6" x2="-3" y2="-5" stroke="var(--ink-1)" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="-5" y1="-5" x2="-3" y2="-6" stroke="var(--ink-1)" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="3" y1="-6" x2="5" y2="-5" stroke="var(--ink-1)" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="3" y1="-5" x2="5" y2="-6" stroke="var(--ink-1)" strokeWidth="1.2" strokeLinecap="round" />
          {/* Blush circles */}
          <circle cx="-6" cy="0" r="2.5" fill="#fab1a0" opacity="0.6" />
          <circle cx="6" cy="0" r="2.5" fill="#fab1a0" opacity="0.6" />
          <path d="M-3,3 Q0,5 3,3" stroke="var(--ink-1)" strokeWidth="1" fill="none" strokeLinecap="round" />
        </g>
      );
    case "you":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* "You" stick figure with arrow pointing at it */}
          <circle cx="0" cy="-12" r="5" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="-7" x2="0" y2="6" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
          <line x1="-6" y1="-1" x2="6" y2="-1" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="6" x2="-5" y2="14" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="6" x2="5" y2="14" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
          {/* Arrow pointing down at figure */}
          <line x1="0" y1="-28" x2="0" y2="-20" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M-3,-22 L0,-18 L3,-22" stroke="#e74c3c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <text x="0" y="-30" fontSize="7" fontWeight="bold" fill="#e74c3c" textAnchor="middle" style={{ fontFamily: "'Comic Sans MS', cursive" }}>YOU</text>
        </g>
      );
    case "richman":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Fat body */}
          <ellipse cx="0" cy="2" rx="8" ry="10" fill="#2c3e50" stroke="var(--ink-1)" strokeWidth="1.5" />
          {/* Head */}
          <circle cx="0" cy="-14" r="6" fill="#d4a574" stroke="var(--ink-1)" strokeWidth="1.2" />
          {/* Top hat */}
          <rect x="-5" y="-25" width="10" height="10" rx="1" fill="#1a1a2e" stroke="var(--ink-1)" strokeWidth="1" />
          <rect x="-7" y="-16" width="14" height="2.5" rx="1" fill="#1a1a2e" stroke="var(--ink-1)" strokeWidth="1" />
          {/* Hat band */}
          <rect x="-5" y="-19" width="10" height="1.5" fill="#c8a84e" />
          {/* Eyes */}
          <circle cx="-2" cy="-14" r="0.8" fill="var(--ink-1)" />
          <circle cx="2" cy="-14" r="0.8" fill="var(--ink-1)" />
          {/* Monocle */}
          <circle cx="3" cy="-14" r="2.5" fill="none" stroke="#c8a84e" strokeWidth="0.6" />
          <line x1="5.2" y1="-13" x2="7" y2="-8" stroke="#c8a84e" strokeWidth="0.5" />
          {/* Smug smile */}
          <path d="M-2,-11 Q0,-9.5 2,-11" stroke="var(--ink-1)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
          {/* Arms (short stubby) */}
          <line x1="-8" y1="0" x2="-12" y2="-3" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="0" x2="12" y2="-3" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Legs */}
          <line x1="-3" y1="11" x2="-4" y2="18" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3" y1="11" x2="4" y2="18" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Money sticking out of pocket */}
          <rect x="5" y="2" width="6" height="3" rx="0.5" fill="#27ae60" stroke="#1e8449" strokeWidth="0.5" />
          <text x="8" y="4.5" fontSize="2.5" fill="#fff" textAnchor="middle" fontWeight="bold">$</text>
          <rect x="-11" y="0" width="5" height="3" rx="0.5" fill="#27ae60" stroke="#1e8449" strokeWidth="0.5" />
          <text x="-8.5" y="2.5" fontSize="2.5" fill="#fff" textAnchor="middle" fontWeight="bold">$</text>
          {/* Floating dollar signs */}
          <text x="14" y="-6" fontSize="6" fill="#27ae60" fontWeight="bold" opacity="0.7">$</text>
          <text x="-14" y="-8" fontSize="5" fill="#27ae60" fontWeight="bold" opacity="0.5">$</text>
        </g>
      );
    case "lobsters":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i} transform={`translate(${(i - 2) * 14}, 0)`}>
              {/* Lobster body */}
              <ellipse cx="0" cy="0" rx="5" ry="3" fill="#e74c3c" stroke="#c0392b" strokeWidth="0.8" />
              {/* Tail */}
              <path d={`M-5,0 Q-7,${i % 2 === 0 ? -2 : 2} -9,0`} stroke="#c0392b" strokeWidth="1" fill="none" strokeLinecap="round" />
              <ellipse cx="-9" cy="0" rx="2" ry="1.5" fill="#e74c3c" stroke="#c0392b" strokeWidth="0.5" />
              {/* Claws */}
              <path d="M5,-1 L8,-3 L7,-1 L9,-1Z" fill="#e74c3c" stroke="#c0392b" strokeWidth="0.5" />
              <path d="M5,1 L8,3 L7,1 L9,1Z" fill="#e74c3c" stroke="#c0392b" strokeWidth="0.5" />
              {/* Eyes */}
              <line x1="2" y1="-3" x2="3" y2="-5" stroke="#c0392b" strokeWidth="0.5" />
              <circle cx="3" cy="-5.5" r="0.8" fill="var(--ink-1)" />
              <line x1="-1" y1="-3" x2="-2" y2="-5" stroke="#c0392b" strokeWidth="0.5" />
              <circle cx="-2" cy="-5.5" r="0.8" fill="var(--ink-1)" />
              {/* Legs */}
              <line x1="-2" y1="3" x2="-3" y2="6" stroke="#c0392b" strokeWidth="0.5" />
              <line x1="0" y1="3" x2="0" y2="6" stroke="#c0392b" strokeWidth="0.5" />
              <line x1="2" y1="3" x2="3" y2="6" stroke="#c0392b" strokeWidth="0.5" />
            </g>
          ))}
        </g>
      );
    case "cat":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Body */}
          <ellipse cx="0" cy="4" rx="8" ry="6" fill="#f39c12" stroke="var(--ink-1)" strokeWidth="1.2" />
          {/* Head */}
          <circle cx="8" cy="-4" r="6" fill="#f39c12" stroke="var(--ink-1)" strokeWidth="1.2" />
          {/* Ears */}
          <polygon points="4,-9 6,-15 8,-9" fill="#f39c12" stroke="var(--ink-1)" strokeWidth="1" />
          <polygon points="8,-9 10,-15 12,-9" fill="#f39c12" stroke="var(--ink-1)" strokeWidth="1" />
          {/* Inner ears */}
          <polygon points="5,-9 6,-13 7,-9" fill="#e8a0a0" stroke="none" />
          <polygon points="9,-9 10,-13 11,-9" fill="#e8a0a0" stroke="none" />
          {/* Eyes */}
          <ellipse cx="6" cy="-5" rx="1.2" ry="1.5" fill="#2ecc71" stroke="var(--ink-1)" strokeWidth="0.5" />
          <ellipse cx="10" cy="-5" rx="1.2" ry="1.5" fill="#2ecc71" stroke="var(--ink-1)" strokeWidth="0.5" />
          <ellipse cx="6" cy="-5" rx="0.5" ry="1.3" fill="var(--ink-1)" />
          <ellipse cx="10" cy="-5" rx="0.5" ry="1.3" fill="var(--ink-1)" />
          {/* Nose */}
          <polygon points="7.5,-2 8,-1 8.5,-2" fill="#e8a0a0" />
          {/* Whiskers */}
          <line x1="2" y1="-2" x2="-3" y2="-3" stroke="var(--ink-1)" strokeWidth="0.4" />
          <line x1="2" y1="-1" x2="-3" y2="0" stroke="var(--ink-1)" strokeWidth="0.4" />
          <line x1="14" y1="-2" x2="19" y2="-3" stroke="var(--ink-1)" strokeWidth="0.4" />
          <line x1="14" y1="-1" x2="19" y2="0" stroke="var(--ink-1)" strokeWidth="0.4" />
          {/* Legs */}
          <line x1="-5" y1="9" x2="-5" y2="14" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-2" y1="9" x2="-2" y2="14" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="9" x2="2" y2="14" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5" y1="9" x2="5" y2="14" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Tail */}
          <path d="M-8,2 Q-14,-2 -12,-8 Q-10,-12 -8,-10" stroke="#f39c12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M-8,2 Q-14,-2 -12,-8 Q-10,-12 -8,-10" stroke="var(--ink-1)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "sleeping":
      return (
        <g transform={`translate(${x}, ${y})`}>
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i} transform={`translate(${(i - 2) * 16}, 0)`}>
              {/* Lying down body */}
              <line x1="-6" y1="4" x2="6" y2="4" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" />
              {/* Head on pillow */}
              <rect x="-8" y="0" width="5" height="3" rx="1" fill="var(--ink-6)" stroke="var(--ink-4)" strokeWidth="0.5" />
              <circle cx="-6" cy="-1" r="3.5" fill="none" stroke="var(--ink-2)" strokeWidth="1.2" strokeLinecap="round" />
              {/* Closed eyes (lines) */}
              <line x1="-7.5" y1="-1.5" x2="-5.5" y2="-1.5" stroke="var(--ink-1)" strokeWidth="0.6" strokeLinecap="round" />
              {/* Sleeping mouth */}
              <ellipse cx="-6" cy="1" rx="1" ry="0.6" fill="var(--ink-1)" opacity="0.4" />
              {/* Arms */}
              <line x1="-3" y1="2" x2="-2" y2="6" stroke="var(--ink-2)" strokeWidth="1" strokeLinecap="round" />
              {/* Legs */}
              <line x1="4" y1="4" x2="5" y2="7" stroke="var(--ink-2)" strokeWidth="1" strokeLinecap="round" />
              <line x1="6" y1="4" x2="7" y2="7" stroke="var(--ink-2)" strokeWidth="1" strokeLinecap="round" />
              {/* ZZZ */}
              <text x="-3" y="-5" fontSize="4" fill="var(--ink-4)" fontWeight="bold" opacity="0.7">z</text>
              <text x="-1" y="-8" fontSize="3" fill="var(--ink-4)" fontWeight="bold" opacity="0.5">z</text>
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
};

/** The trolley — grouped rect body, path roof, circle wheels, circle headlight */
const TrolleySVG = () => (
  <g>
    {/* Body */}
    <rect x="-20" y="-12" width="40" height="20" rx="3" ry="3" fill="#e74c3c" stroke="var(--ink-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Roof */}
    <path d="M-16,-12 L-12,-18 L12,-18 L16,-12" fill="#c0392b" stroke="var(--ink-1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Windows */}
    <rect x="-12" y="-9" width="8" height="6" rx="1" fill="#ffeaa7" stroke="var(--ink-1)" strokeWidth="0.8" />
    <rect x="4" y="-9" width="8" height="6" rx="1" fill="#ffeaa7" stroke="var(--ink-1)" strokeWidth="0.8" />
    {/* Headlight */}
    <circle cx="20" cy="0" r="2.5" fill="#fdcb6e" stroke="var(--ink-1)" strokeWidth="1" />
    {/* Wheels */}
    <g className="trolley-wheel-left">
      <circle cx="-10" cy="11" r="5" fill="var(--ink-1)" />
      <circle cx="-10" cy="11" r="2" fill="var(--ink-2)" />
    </g>
    <g className="trolley-wheel-right">
      <circle cx="10" cy="11" r="5" fill="var(--ink-1)" />
      <circle cx="10" cy="11" r="2" fill="var(--ink-2)" />
    </g>
  </g>
);

/** Lever + operator stick figure */
const LeverSVG = ({ leverPulled, animating }: { leverPulled: boolean; animating: boolean }) => (
  <g>
    {/* Lever pivot */}
    <circle cx="200" cy="160" r="7" fill="var(--ink-3)" stroke="var(--ink-1)" strokeWidth="1.5" />
    <circle cx="200" cy="160" r="3" fill="var(--ink-4)" />
    {/* Lever arm */}
    <motion.line
      x1="200" y1="160"
      x2={leverPulled ? 183 : 217}
      y2="143"
      stroke="#444" strokeWidth="3.5" strokeLinecap="round"
      animate={{ x2: leverPulled ? 183 : 217 }}
      transition={animating ? { duration: 0.4, ease: [0.25, 1.4, 0.5, 1] } : { duration: 0 }}
    />
    {/* Lever handle knob */}
    <motion.circle
      cx={leverPulled ? 183 : 217}
      cy="143"
      r="4"
      fill="#e74c3c"
      stroke="var(--ink-1)"
      strokeWidth="1"
      animate={{ cx: leverPulled ? 183 : 217 }}
      transition={animating ? { duration: 0.4, ease: [0.25, 1.4, 0.5, 1] } : { duration: 0 }}
    />
    <text x="200" y="180" fontSize="8" fill="var(--ink-5)" textAnchor="middle" style={{ fontFamily: "'Caveat', cursive" }}>lever</text>

    {/* Operator stick figure */}
    <g transform="translate(210, 195)">
      <circle cx="0" cy="0" r="5" fill="none" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="5" x2="0" y2="20" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" />
      <motion.line
        x1="-6" y1="12" x2="-10" y2="-28"
        stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round"
        animate={animating && leverPulled ? { x2: [-10, -12, -10] } : {}}
        transition={{ duration: 0.3 }}
      />
      <line x1="6" y1="12" x2="10" y2="17" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="20" x2="-5" y2="28" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="20" x2="5" y2="28" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </g>
);

/** Dust puff particles at lever base */
const DustPuff = () => (
  <motion.g
    initial={{ opacity: 0.8, scale: 0.5 }}
    animate={{ opacity: 0, scale: 2.5 }}
    transition={{ duration: 0.6 }}
    style={{ originX: "200px", originY: "162px" }}
  >
    <circle cx="196" cy="163" r="3" fill="#ccc" opacity="0.6" />
    <circle cx="204" cy="165" r="2" fill="#bbb" opacity="0.5" />
    <circle cx="200" cy="158" r="2.5" fill="#ddd" opacity="0.4" />
  </motion.g>
);

/** Splat effect — irregular hand-drawn blob with starburst */
const SplatSVG = ({ x, y }: { x: number; y: number }) => {
  const rotation = useMemo(() => -3 + Math.random() * 6, []);
  const spikeAngles = [0, 40, 85, 130, 175, 220, 260, 310];
  const particles = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      dx: (Math.random() - 0.5) * 50,
      dy: (Math.random() - 0.5) * 35 - 10,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 0.1,
    })), []);

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.35, 0.92, 1.08, 1], opacity: 1, rotate: rotation }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1], times: [0, 0.35, 0.55, 0.8, 1] }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    >
      <g transform={`translate(${x}, ${y})`}>
        {/* Irregular blob path */}
        <path
          d="M0,-28 C10,-30 18,-24 22,-16 C28,-10 30,-2 26,6 C30,14 24,22 16,26 C10,30 2,32 -6,28 C-14,30 -22,24 -26,16 C-30,10 -28,2 -24,-6 C-28,-14 -22,-24 -14,-28 C-8,-32 -2,-30 0,-28Z"
          fill="white"
          stroke="var(--ink-1)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Starburst spikes */}
        {spikeAngles.map((angle, i) => {
          const len = 20 + (i % 3) * 7;
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(rad) * 18}
              y1={Math.sin(rad) * 18}
              x2={Math.cos(rad) * len}
              y2={Math.sin(rad) * len}
              stroke="var(--ink-1)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
        {/* SPLAT text */}
        <text
          x="0" y="6" fontSize="13" fontWeight="900" fill="var(--ink-1)" textAnchor="middle"
          style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}
        >
          SPLAT
        </text>
      </g>

      {/* Particle droplets */}
      {particles.map((p) => (
        <motion.circle
          key={p.id}
          cx={x} cy={y} r={p.size}
          fill="var(--ink-1)"
          initial={{ opacity: 1, cx: x, cy: y }}
          animate={{ cx: x + p.dx, cy: y + p.dy, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.5, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </motion.g>
  );
};

// ─── Tracks SVG ───────────────────────────────────────────────
const TracksSVG = ({ switched }: { switched: boolean }) => (
  <g>
    {/* Main approach track */}
    <path d="M30,140 L195,140" stroke="var(--ink-1)" strokeWidth="3" strokeDasharray="8,4" fill="none" strokeLinecap="round" />
    {/* Sleepers / ties */}
    {[60, 90, 120, 150, 180].map((tx) => (
      <line key={tx} x1={tx} y1="136" x2={tx} y2="144" stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round" />
    ))}

    {/* Upper fork (pull lever path) with curve */}
    <path d="M200,140 Q240,130 280,100 L370,70" stroke="var(--ink-1)" strokeWidth="3" strokeDasharray="8,4" fill="none" strokeLinecap="round" />

    {/* Lower fork (do nothing path) with curve */}
    <path d="M200,140 Q240,150 280,168 L370,185" stroke="var(--ink-1)" strokeWidth="3" strokeDasharray="8,4" fill="none" strokeLinecap="round" />

    {/* Junction switch indicator */}
    <motion.path
      d={switched ? "M198,139 Q210,135 220,128" : "M198,141 Q210,145 220,152"}
      stroke="#e74c3c"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      animate={{ d: switched ? "M198,139 Q210,135 220,128" : "M198,141 Q210,145 220,152" }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 15 }}
    />
  </g>
);

// ─── Main Illustration ────────────────────────────────────────
const TrolleyIllustration = ({
  phase,
  pulled,
  leftVictimCount,
  rightVictimCount,
  leftIcon,
  rightIcon,
  theme,
}: {
  phase: AnimPhase;
  pulled: boolean | null;
  leftVictimCount: number;
  rightVictimCount: number;
  leftIcon?: string;
  rightIcon?: string;
  theme: IllustrationTheme;
}) => {
  const isMoving = ["travel", "freeze", "splat"].includes(phase);
  const showSplat = ["splat", "fadeout"].includes(phase);
  const leverDown = pulled !== null && phase !== "idle";
  const trackSwitched = !!pulled && ["switch", "travel", "freeze", "splat", "fadeout"].includes(phase);

  // Trolley target
  const getTrolleyTranslate = () => {
    if (!isMoving && !showSplat) return { x: 60, y: 132 }; // idle position
    if (pulled) return { x: 310, y: 62 }; // upper track end
    return { x: 310, y: 177 }; // lower track end
  };
  const trolleyPos = getTrolleyTranslate();

  // Impact coords for splat
  const impactX = pulled ? 340 : 340;
  const impactY = pulled ? 70 : 185;

  return (
    <svg
      viewBox="0 0 420 240"
      width="100%"
      className="max-w-lg mx-auto block"
      style={{
        fontFamily: "'Comic Sans MS', 'Caveat', cursive",
        ["--ink-1" as string]: theme === "dark" ? "#D8DEE9" : "#333",
        ["--ink-2" as string]: theme === "dark" ? "#B8C1CC" : "#555",
        ["--ink-3" as string]: theme === "dark" ? "#9AA6B2" : "#666",
        ["--ink-4" as string]: theme === "dark" ? "#AEB8C2" : "#888",
        ["--ink-5" as string]: theme === "dark" ? "#C6CED8" : "#999",
        ["--ink-6" as string]: theme === "dark" ? "#BFC8D2" : "#aaa",
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Hand-drawn rough edge filter */}
        <filter id="sketch-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
        </filter>
      </defs>

      {/* Tracks */}
      <TracksSVG switched={trackSwitched} />

      {/* Lever + operator */}
      <LeverSVG leverPulled={!!pulled && leverDown} animating={phase === "lever"} />

      {/* Dust puff on lever pull */}
      {phase === "lever" && <DustPuff />}

      {/* Lower track victims (do nothing path) */}
      <VictimGroup
        count={leftVictimCount}
        baseX={310}
        baseY={180}
        spacing={14}
        visible={!(showSplat && !pulled)}
      />

      {/* Upper track victims (pull lever path) */}
      <VictimGroup
        count={rightVictimCount}
        baseX={318}
        baseY={62}
        spacing={14}
        visible={!(showSplat && !!pulled)}
      />

      {/* Track icons for non-person items */}
      {leftIcon && (
        <motion.g animate={{ opacity: !(showSplat && !pulled) ? 1 : 0 }} transition={{ duration: 0.15 }}>
          <TrackIconSVG type={leftIcon} x={330} y={175} />
        </motion.g>
      )}
      {rightIcon && (
        <motion.g animate={{ opacity: !(showSplat && !!pulled) ? 1 : 0 }} transition={{ duration: 0.15 }}>
          <TrackIconSVG type={rightIcon} x={330} y={58} />
        </motion.g>
      )}

      {/* Trolley group */}
      <motion.g
        initial={{ x: 60, y: 132 }}
        animate={{
          x: trolleyPos.x,
          y: trolleyPos.y,
        }}
        transition={
          phase === "travel"
            ? { duration: 1.5, ease: [0.4, 0, 1, 1] }
            : phase === "idle"
              ? { duration: 0 }
              : { duration: 0 }
        }
      >
        {/* Idle wobble + travel jitter */}
        <motion.g
          animate={
            phase === "idle"
              ? { x: [-1.5, 1.5, -1.5], y: [0, -0.8, 0] }
              : phase === "travel"
                ? { y: [-0.6, 0.6, -0.8, 0.4, -0.6], rotate: [-0.4, 0.4, -0.3, 0.6, -0.4] }
                : phase === "splat"
                  ? { x: [0, -3, 2, -1, 0] }
                  : {}
          }
          transition={
            phase === "idle"
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
              : phase === "travel"
                ? { duration: 0.25, repeat: Infinity, ease: "linear" }
                : phase === "splat"
                  ? { duration: 0.3, ease: "easeOut" }
                  : {}
          }
        >
          <TrolleySVG />
        </motion.g>
      </motion.g>

      {/* SPLAT overlay */}
      {showSplat && <SplatSVG x={impactX} y={impactY} />}
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────
const TrolleySimulator = () => {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [choices, setChoices] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [pulled, setPulled] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const [illustrationTheme, setIllustrationTheme] = useState<IllustrationTheme>("dark");

  const level = levels[currentLevel];

  const handleChoice = useCallback((pullLever: boolean) => {
    if (phase !== "idle") return;
    setPulled(pullLever);
    setChoices((prev) => [...prev, pullLever]);

    setPhase("lever");
    setTimeout(() => setPhase("switch"), 400);
    setTimeout(() => setPhase("travel"), 700);
    setTimeout(() => setPhase("freeze"), 2200);
    setTimeout(() => setPhase("splat"), 2400);
    setTimeout(() => {
      setPhase("fadeout");
      setTimeout(() => {
        if (currentLevel >= levels.length - 1) {
          setFinished(true);
        } else {
          setCurrentLevel((prev) => prev + 1);
        }
        setPhase("idle");
        setPulled(null);
      }, 400);
    }, 2800);
  }, [phase, currentLevel]);

  const pullCount = choices.filter(Boolean).length;
  const nothingCount = choices.filter((c) => !c).length;
  const pullPercent = choices.length > 0 ? Math.round((pullCount / choices.length) * 100) : 0;

  const getLabel = () => {
    if (pullPercent >= 75) return "The Utilitarian";
    if (pullPercent <= 25) return "The Chaos Neutral";
    if (choices[3] === false && choices[11] === false) return "The Self-Preserver";
    return "The Emotional Protector";
  };

  const restart = () => {
    setCurrentLevel(0);
    setChoices([]);
    setFinished(false);
    setPhase("idle");
    setPulled(null);
  };

  if (finished) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6" style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive, sans-serif" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-50 mb-2">Simulation Complete</h1>
          <div className="w-24 h-1 bg-slate-700 mx-auto my-6 rounded" />
          <div className="space-y-4 text-lg text-slate-200 mb-8">
            <p>You pulled the lever <strong className="text-rose-400">{pullCount}</strong> times.</p>
            <p>You did nothing <strong className="text-slate-300">{nothingCount}</strong> times.</p>
            <p>Lever usage: <strong>{pullPercent}%</strong></p>
          </div>
          <div className="py-6 px-8 border-2 border-dashed border-slate-600 bg-slate-900 rounded-xl mb-8">
            <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">Your moral archetype</p>
            <p className="text-3xl font-bold text-slate-50">{getLabel()}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={restart} className="px-6 py-3 border-2 border-slate-200 text-slate-50 rounded-lg hover:bg-slate-800 transition-colors text-lg">🔄 Restart Simulation</button>
            <button onClick={() => navigate("/")} className="px-6 py-3 border-2 border-slate-500 text-slate-300 rounded-lg hover:bg-slate-900 transition-colors text-lg">⬅ Back to Arena</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8" style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive, sans-serif" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLevel}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className="max-w-2xl w-full bg-slate-900/70 border border-slate-700 rounded-2xl p-4 md:p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-50 tracking-tight">Trolley Problems</h1>
            <p className="text-lg text-slate-300 mt-1">Level {currentLevel + 1}: {level.name}</p>
            <div className="flex justify-center gap-1 mt-3">
              {levels.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < currentLevel ? "bg-slate-100" : i === currentLevel ? "bg-rose-400" : "bg-slate-700"}`} />
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setIllustrationTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                className="px-4 py-2 text-sm border border-slate-500 text-slate-100 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 transition-colors"
                aria-label="Toggle illustration theme"
              >
                Mode: {illustrationTheme === "dark" ? "Dark" : "Light"}
              </button>
            </div>
          </div>

          {/* SVG Illustration */}
          <div
            className={`rounded-xl p-2 md:p-3 shadow-inner border ${illustrationTheme === "dark" ? "border-slate-600 bg-slate-900" : "border-slate-300 bg-slate-100"}`}
          >
            <TrolleyIllustration
              phase={phase}
              pulled={pulled}
              leftVictimCount={level.leftVictims}
              rightVictimCount={level.rightVictims}
              leftIcon={level.leftIcon}
              rightIcon={level.rightIcon}
              theme={illustrationTheme}
            />
          </div>

          {/* Track labels */}
          <div className="flex justify-between max-w-md mx-auto mt-3 px-4 text-sm text-slate-300">
            <div className="text-center">
              <span className="text-xs uppercase tracking-wide">Pull lever →</span><br />
              <span className="font-semibold text-slate-100">{level.rightLabel}</span>
              {level.debatable && (level.debatable === "right" || level.debatable === "both") && (
                <span className="text-rose-400 text-xs ml-1">(Debatable)</span>
              )}
            </div>
            <div className="text-center">
              <span className="text-xs uppercase tracking-wide">Do nothing →</span><br />
              <span className="font-semibold text-slate-100">{level.leftLabel}</span>
              {level.debatable && (level.debatable === "left" || level.debatable === "both") && (
                <span className="text-rose-400 text-xs ml-1">(Debatable)</span>
              )}
            </div>
          </div>

          {/* Scenario text */}
          <div className="text-center mt-6 px-4">
            <p className="text-lg md:text-xl text-slate-100 leading-relaxed">{level.scenario}</p>
            {level.note && <p className="text-sm text-slate-300 mt-2 italic">{level.note}</p>}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={() => handleChoice(true)}
              disabled={phase !== "idle"}
              className="px-8 py-4 border-2 border-rose-400 text-rose-200 bg-rose-900/20 rounded-xl hover:bg-rose-900/40 transition-all text-xl disabled:opacity-40 hover:scale-105 active:scale-95"
            >
              🔀 Pull the lever
            </button>
            <button
              onClick={() => handleChoice(false)}
              disabled={phase !== "idle"}
              className="px-8 py-4 border-2 border-slate-400 text-slate-100 bg-slate-800/60 rounded-xl hover:bg-slate-700/80 transition-all text-xl disabled:opacity-40 hover:scale-105 active:scale-95"
            >
              😐 Do nothing
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TrolleySimulator;


