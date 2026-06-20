import { Link } from "react-router-dom";
import ParticleBackground from "@/components/ParticleBackground";
import GameCard from "@/components/GameCard";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import Footer from "@/components/Footer";
import SnakeEscapeAnimation from "@/components/SnakeEscapeAnimation";
import { useEffect, useLayoutEffect } from "react";
import {
  SpinWheelAnim, RPSAnim, SpotlightAnim, NetworkAnim, RocketAnim,
  TrolleyAnim, CodeTypingAnim, ScaleAnim, GavelAnim, TimelineAnim,
  MoneyRainAnim, DrawCircleAnim, MemoryMatchAnim, LifeProgressAnim,
  UniverseAnim, PasswordAnim, ImposterAnim, WordBingoAnim,
  NumberBingoAnim, SpeakingAnim, FlameAnim, TicTacToeAnim,
  CodeFlowAnim, PodiumAnim, RandomNumberDuelAnim, CloudAnim, PyPlayAnim,
  TugOfWarAnim,
} from "@/components/CardAnimations";
import conan from "@/assets/conan.png";
const HOME_SCROLL_KEY = "homepage-scroll-position";

const games = [
  {
    icon: "🪢",
    title: "Maths Tug Of War",
    description: "Solve math problems and pull the rope to victory.",
    to: "/maths-tug-of-war",
    animation: <TugOfWarAnim />,
  },
  {
    icon: "🐍",
    title: "PyPlay",
    description: "Jump into an animated Python playground and experiment with code ideas.",
    href: "https://ancient-sea-55742-c6a9c2e8d2e1.herokuapp.com/",
    animation: <PyPlayAnim />,
  },
  {
    icon: "🚋",
    title: "Trolley Simulator",
    description: "Face ethical dilemmas and make impossible choices under pressure.",
    to: "/trolley",
    animation: <TrolleyAnim />,
  },
  {
    icon: "⚡",
    title: "VisualCode Lab",
    description: "Visualize real code execution with animated memory, variables, and function flow.",
    to: "/visualcode-lab",
    animation: <CodeFlowAnim />,
  },
  {
    icon: "🏆",
    title: "Live Quiz Competition",
    description: "Host-controlled multi-team quiz system for live events.",
    to: "/quiz-competition",
    animation: <PodiumAnim />,
  },
  {
    icon: "�",
    title: "Auction Challenge",
    description: "How much is it really worth?",
    to: "/auction",
    animation: <GavelAnim />,
  },
  {
    icon: "📜",
    title: "Who Was Alive?",
    description: "Enter a year. Discover history.",
    to: "/alive",
    animation: <TimelineAnim />,
  },
  {
    icon: "💰",
    title: "Spend Billionaire's Money",
    description: "Choose a billionaire and blow their fortune!",
    to: "/spend-binod",
    animation: <MoneyRainAnim />,
  },
  {
    icon: "⭕",
    title: "Draw a Perfect Circle",
    description: "Steady hands. Pure geometry.",
    to: "/circle",
    animation: <DrawCircleAnim />,
  },
  {
    icon: "🎡",
    title: "Spin The Wheel",
    description: "Let fate decide your classroom challenge.",
    to: "/spin",
    animation: <SpinWheelAnim />,
  },
  {
    icon: "🧩",
    title: "Memory Match",
    description: "Match programming concepts with definitions.",
    to: "/memory-match",
    animation: <MemoryMatchAnim />,
  },
  {
    icon: "⏳",
    title: "Life & Universe Progress",
    description: "How long until…?",
    to: "/life-progress",
    animation: <LifeProgressAnim />,
  },
  {
    icon: "🌌",
    title: "Universe Forecast",
    description: "The future of everything.",
    to: "/universe-forecast",
    animation: <UniverseAnim />,
  },
  {
    icon: "🔐",
    title: "Infinite Password Challenge",
    description: "Strong enough yet?",
    to: "/password-challenge",
    animation: <PasswordAnim />,
  },
  {
    icon: "🎭",
    title: "Who is the Imposter?",
    description: "Find the imposter before it's too late.",
    to: "/imposter",
    animation: <ImposterAnim />,
  },
  {
    icon: "🔤",
    title: "Word Bingo",
    description: "Match words and complete a winning line.",
    to: "/word-bingo",
    animation: <WordBingoAnim />,
  },
  {
    icon: "🎱",
    title: "Lucky Number Bingo",
    description: "Mark your numbers before someone shouts BINGO!",
    to: "/number-bingo",
    animation: <NumberBingoAnim />,
  },
  {
    icon: "🎙️",
    title: "Impromptu Speaking",
    description: "Get a random topic. Speak for 60 seconds. Improve daily.",
    to: "/impromptu",
    animation: <SpeakingAnim />,
  },
  {
    icon: "💻",
    title: "Programming Quiz Portal",
    description: "Test your programming fundamentals.",
    to: "/quiz",
    animation: <CodeTypingAnim />,
  },
  {
    icon: "⚖️",
    title: "Let's Settle This",
    description: "Choose your side. The class decides.",
    to: "/settle",
    animation: <ScaleAnim />,
  },
  {
    icon: "⚡",
    title: "Motivation Lab",
    description: "Small actions. Massive consequences.",
    to: "/motivation",
    animation: <FlameAnim />,
  },
  {
    icon: "❌",
    title: "Tic-Tac-Toe",
    description: "Think ahead. Control the board.",
    to: "/tic-tac-toe",
    animation: <TicTacToeAnim />,
  },
  {
    icon: "🔢",
    title: "Random Number Duel",
    description: "Guess 0 to 500. Win with fewer attempts, or beat a friend in first-to-correct multiplayer.",
    to: "/random-number-duel",
    animation: <RandomNumberDuelAnim />,
  },
  {
    icon: "🕹️",
    title: "Loop Arcade",
    description: "Click speed, color tap, memory & target shoot mini games.",
    to: "/loop-arcade",
    animation: <SnakeEscapeAnimation />,
  },
  {
    icon: "🚀",
    title: "Rocket Space Launch",
    description: "Launch through asteroid fields, dodge obstacles, and chase a high score.",
    to: "/subway-sprint",
  },
  {
    icon: "✊",
    title: "Rock Paper Scissors",
    description: "Play against the computer with animated battle effects!",
    to: "/rps",
    animation: <RPSAnim />,
  },
  {
    icon: "🎤",
    title: "Spin The Wheel 2 – Personality Arena",
    description: "Step into the spotlight. Express, perform, and impress.",
    to: "/spin2",
    animation: <SpotlightAnim />,
  },
  {
    icon: "🎯",
    title: "Social Arena – Group Dynamics",
    description: "Collaboration. Pressure. Interaction.",
    to: "/social",
    animation: <NetworkAnim />,
  },
  {
    icon: "🚀",
    title: "Visionary Arena – Big Ideas Lab",
    description: "Think beyond code. Lead the future.",
    to: "/visionary",
    animation: <RocketAnim />,
  },
  {
    icon: "🔐",
    title: "Fun Code Visualization (Locked)",
    description: "Credential-protected code visualization workspace with timeline, memory snapshots, and execution insights.",
    to: "/visualcode-studio",
    animation: <CodeFlowAnim />,
  },
  {
    icon: "🔒",
    title: "Theory Marks Register (Locked)",
    description: "Credential-protected register for first term, second term, and pre-board marks.",
    to: "/theory-marks",
    animation: <PodiumAnim />,
  },
  {
    icon: "🧠",
    title: "Neural Reinforcement",
    description: "Simulates synaptic strengthening through repeated activation.",
    to: "/neural-reinforcement",
    animation: <NetworkAnim />,
  },
  {
    icon: "📈",
    title: "PowerBI Master",
    description: "Build reports, solve data puzzles, and climb the leaderboard.",
    to: "/powerbi",
  },
  {
    icon: "📊",
    title: "Business Intelligence Lab",
    description: "Learn BI basics with lessons, quizzes, dashboards, and badges.",
    to: "/business-intelligence",
  },
  {
    icon: "☁️",
    title: "Cloud Computing",
    description: "Learn AWS, DevOps, servers, scaling, databases, and deployment through games.",
    subtitle: "Learn AWS, DevOps, servers, scaling, databases, and deployment through games.",
    to: "/cloud-computing",
    animation: <CloudAnim />,
    progress: 68,
    streak: 12,
    difficulty: "Intermediate",
    badge: "Cloud Module",
    ctaLabel: "Continue Learning",
    className: "sm:col-span-2 lg:col-span-2",
  },
];

const Index = () => {
  const { user, signOut } = useAuth();

  useLayoutEffect(() => {
    const savedScrollPosition = sessionStorage.getItem(HOME_SCROLL_KEY);
    if (savedScrollPosition) {
      const position = Number(savedScrollPosition);
      if (!Number.isNaN(position)) {
        window.scrollTo(0, position);
      }
    }
  }, []);

  useEffect(() => {
    const saveScrollPosition = () => {
      sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY));
    };

    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener("scroll", saveScrollPosition, { passive: true });
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      saveScrollPosition();
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-cyan/8 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-neon-pink/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-12 sm:py-20">
        {/* Top bar */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 font-display text-xs">
              <LogOut className="w-3 h-3" /> Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-2 font-display text-xs">
                <LogIn className="w-3 h-3" /> Login
              </Button>
            </Link>
          )}
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 animate-fade-in">
          <h1 className="flex items-center gap-4 font-display text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-foreground mb-4 text-glow-purple animate-float">
            <img
              src={conan}
              alt="Conan"
              className="w-20 sm:w-24 md:w-32 h-auto object-contain"
            />
            <span>nerds.games</span>
          </h1>
          <p className="font-body text-lg sm:text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
            Games of luck. Battles of skill.
          </p>
          {/* Decorative line */}
          <div className="mt-8 mx-auto w-48 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-60" />
        </div>

        {/* Game Cards Grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {games.map((game, i) => (
            <GameCard
              key={game.title}
              {...game}
              delay={i * 150}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: "800ms" }}>
          <p className="font-body text-sm text-muted-foreground/50 tracking-wider uppercase mb-4">
            Designed for live classroom interaction
          </p>
          <Footer />

          
        </div>
      </div>
    </div>
  );
};

export default Index;
