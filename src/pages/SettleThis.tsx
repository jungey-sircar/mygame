import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

// ─── Debate Data ──────────────────────────────────────────────
interface DebateSide {
  title: string;
  description: string;
}

interface Debate {
  question: string;
  left: DebateSide;
  right: DebateSide;
}

const debates: Debate[] = [
  { question: "Tabs or Spaces?", left: { title: "Tabs", description: "One key to rule them all" }, right: { title: "Spaces", description: "Precision matters" } },
  { question: "Python or Java?", left: { title: "Python", description: "Life is short. Use Python." }, right: { title: "Java", description: "Write once, run everywhere." } },
  { question: "Tea or Coffee?", left: { title: "Tea", description: "Calm, cultured, classic" }, right: { title: "Coffee", description: "Fuel for the fearless" } },
  { question: "Night Coding or Morning Coding?", left: { title: "Night Owl", description: "Silence fuels creativity" }, right: { title: "Early Bird", description: "Fresh mind, clean code" } },
  { question: "Online Exams or Offline Exams?", left: { title: "Online", description: "Flexible and modern" }, right: { title: "Offline", description: "Fair and focused" } },
  { question: "Dark Mode or Light Mode?", left: { title: "Dark Mode", description: "Easy on the eyes" }, right: { title: "Light Mode", description: "Bright and professional" } },
  { question: "AI Helps Students or Makes Them Lazy?", left: { title: "AI Helps", description: "Tools amplify talent" }, right: { title: "AI = Lazy", description: "Shortcuts kill learning" } },
  { question: "Theory or Practical?", left: { title: "Theory", description: "Understand the why" }, right: { title: "Practical", description: "Learn by doing" } },
  { question: "Startup or Job?", left: { title: "Startup", description: "Build your own dream" }, right: { title: "Job", description: "Stability and growth" } },
  { question: "Linux or Windows?", left: { title: "Linux", description: "Freedom and control" }, right: { title: "Windows", description: "It just works" } },
  { question: "Should a sandwich be cut diagonally or horizontally?", left: { title: "Diagonally", description: "More surface area, more elegance" }, right: { title: "Horizontally", description: "Classic and practical" } },
  { question: "Is cereal a soup?", left: { title: "Yes", description: "Liquid + solid in a bowl = soup" }, right: { title: "No", description: "That's just breakfast, not soup" } },
  { question: "Toilet paper: over or under?", left: { title: "Over", description: "The patent says so" }, right: { title: "Under", description: "Stealth mode engaged" } },
  { question: "Pepsi or Coke?", left: { title: "Pepsi", description: "The choice of a new generation" }, right: { title: "Coke", description: "The real thing" } },
  { question: "Is pineapple on pizza good?", left: { title: "Yes", description: "Sweet meets savory perfection" }, right: { title: "No", description: "Fruit on pizza is a crime" } },
  { question: "Star Wars or Star Trek?", left: { title: "Star Wars", description: "The Force is strong" }, right: { title: "Star Trek", description: "To boldly go where no one has gone" } },
  { question: "How would a dog wear pants?", left: { title: "Two legs", description: "Just the back legs, obviously" }, right: { title: "Four legs", description: "All legs deserve coverage" } },
  { question: "Could Jack have fit on the door?", left: { title: "Yes", description: "There was clearly room" }, right: { title: "No", description: "It would've sunk. Physics." } },
  { question: "Are hot dogs a sandwich?", left: { title: "Yes", description: "Meat between bread = sandwich" }, right: { title: "No", description: "Hot dogs are their own thing" } },
  { question: "Marvel or DC?", left: { title: "Marvel", description: "Assemble the Avengers" }, right: { title: "DC", description: "The Dark Knight rises" } },
  { question: "Should we get rid of daylight saving?", left: { title: "Yes", description: "Stop messing with our clocks" }, right: { title: "No", description: "Extra evening sunlight is worth it" } },
  { question: "Xbox or PlayStation?", left: { title: "Xbox", description: "Game Pass is unbeatable" }, right: { title: "PlayStation", description: "Exclusives that define gaming" } },
  { question: "Are we living in a simulation?", left: { title: "Yes", description: "The math checks out" }, right: { title: "No", description: "This is very much real" } },
  { question: "Is Die Hard a Christmas movie?", left: { title: "Yes", description: "Yippee-ki-yay, it's Christmas" }, right: { title: "No", description: "It's an action movie, period" } },
  { question: "Brownie piece preference?", left: { title: "Middle", description: "Soft, gooey, perfect" }, right: { title: "Edge", description: "Crispy outside, chewy inside" } },
  { question: "Sock shoe sock shoe, or sock sock shoe shoe?", left: { title: "Sock Shoe Sock Shoe", description: "One foot at a time" }, right: { title: "Sock Sock Shoe Shoe", description: "Socks first, then shoes" } },
  { question: "iPhone or Android?", left: { title: "iPhone", description: "It just works" }, right: { title: "Android", description: "Freedom to customize" } },
  { question: "Does a straw have one hole or two?", left: { title: "One", description: "It's one continuous hole" }, right: { title: "Two", description: "Top and bottom = two holes" } },
  { question: "Smooth or chunky peanut butter?", left: { title: "Smooth", description: "Creamy perfection" }, right: { title: "Chunky", description: "Texture is everything" } },
  { question: "What came first, the chicken or the egg?", left: { title: "Chicken", description: "Something had to lay it" }, right: { title: "Egg", description: "Evolution says egg first" } },
];

// ─── SVG Characters ───────────────────────────────────────────

const CharacterSVG = ({ side, debateIndex }: { side: "left" | "right"; debateIndex: number }) => {
  const characters: Record<number, { left: JSX.Element; right: JSX.Element }> = {
    0: { // Tabs vs Spaces
      left: (
        <g>
          <circle cx="50" cy="28" r="14" fill="#ffeaa7" stroke="#333" strokeWidth="1.5" />
          <circle cx="46" cy="26" r="1.5" fill="#333" />
          <circle cx="54" cy="26" r="1.5" fill="#333" />
          <path d="M46,33 Q50,36 54,33" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <line x1="50" y1="42" x2="50" y2="68" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="42" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="58" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="34" y2="58" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="66" y2="44" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <rect x="22" y="52" width="18" height="12" rx="3" fill="#6c5ce7" stroke="#333" strokeWidth="1.2" />
          <text x="31" y="61" fontSize="7" fill="#fff" textAnchor="middle" fontWeight="bold">TAB</text>
        </g>
      ),
      right: (
        <g>
          <circle cx="50" cy="28" r="14" fill="#ffeaa7" stroke="#333" strokeWidth="1.5" />
          <circle cx="46" cy="26" r="1.5" fill="#333" />
          <circle cx="54" cy="26" r="1.5" fill="#333" />
          <path d="M46,33 Q50,36 54,33" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <line x1="50" y1="42" x2="50" y2="68" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="42" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="58" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="34" y2="44" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="66" y2="58" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <rect x="56" y="52" width="24" height="12" rx="3" fill="#00b894" stroke="#333" strokeWidth="1.2" />
          <text x="68" y="61" fontSize="5.5" fill="#fff" textAnchor="middle" fontWeight="bold">SPACE</text>
        </g>
      ),
    },
    1: { // Python vs Java
      left: (
        <g>
          <circle cx="50" cy="28" r="14" fill="#ffeaa7" stroke="#333" strokeWidth="1.5" />
          <circle cx="46" cy="26" r="1.5" fill="#333" />
          <circle cx="54" cy="26" r="1.5" fill="#333" />
          <path d="M46,33 Q50,36 54,33" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <line x1="50" y1="42" x2="50" y2="68" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="42" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="58" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="34" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="66" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          {/* Python logo */}
          <circle cx="50" cy="56" r="10" fill="#3776AB" stroke="#333" strokeWidth="1" />
          <text x="50" y="60" fontSize="10" fill="#FFD43B" textAnchor="middle" fontWeight="bold">🐍</text>
        </g>
      ),
      right: (
        <g>
          <circle cx="50" cy="28" r="14" fill="#ffeaa7" stroke="#333" strokeWidth="1.5" />
          <circle cx="46" cy="26" r="1.5" fill="#333" />
          <circle cx="54" cy="26" r="1.5" fill="#333" />
          <path d="M46,33 Q50,36 54,33" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <line x1="50" y1="42" x2="50" y2="68" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="42" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="58" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="34" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="66" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          {/* Java logo */}
          <circle cx="50" cy="56" r="10" fill="#f89820" stroke="#333" strokeWidth="1" />
          <text x="50" y="60" fontSize="10" fill="#fff" textAnchor="middle" fontWeight="bold">☕</text>
        </g>
      ),
    },
    2: { // Tea vs Coffee
      left: (
        <g>
          <circle cx="50" cy="28" r="14" fill="#ffeaa7" stroke="#333" strokeWidth="1.5" />
          <circle cx="46" cy="26" r="1.5" fill="#333" />
          <circle cx="54" cy="26" r="1.5" fill="#333" />
          <path d="M46,33 Q50,36 54,33" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <line x1="50" y1="42" x2="50" y2="68" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="42" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="58" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="30" y2="52" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="66" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          {/* Tea cup */}
          <rect x="18" y="48" width="16" height="12" rx="2" fill="#81ecec" stroke="#333" strokeWidth="1.2" />
          <path d="M34,50 Q38,52 34,56" stroke="#333" strokeWidth="1" fill="none" />
          <path d="M22,46 Q24,42 26,46" stroke="#aaa" strokeWidth="0.8" fill="none" opacity="0.6" />
          <path d="M26,45 Q28,41 30,45" stroke="#aaa" strokeWidth="0.8" fill="none" opacity="0.6" />
        </g>
      ),
      right: (
        <g>
          <circle cx="50" cy="28" r="14" fill="#ffeaa7" stroke="#333" strokeWidth="1.5" />
          <circle cx="46" cy="26" r="1.5" fill="#333" />
          <circle cx="54" cy="26" r="1.5" fill="#333" />
          <path d="M46,33 Q50,36 54,33" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <line x1="50" y1="42" x2="50" y2="68" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="42" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="68" x2="58" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="34" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="50" x2="70" y2="52" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          {/* Coffee mug */}
          <rect x="62" y="48" width="16" height="14" rx="2" fill="#6c5ce7" stroke="#333" strokeWidth="1.2" />
          <path d="M78,51 Q82,54 78,57" stroke="#333" strokeWidth="1" fill="none" />
          <path d="M66,46 Q68,40 70,46" stroke="#ddd" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M70,45 Q72,39 74,45" stroke="#ddd" strokeWidth="1" fill="none" opacity="0.6" />
        </g>
      ),
    },
  };

  // Default generic character for debates without custom illustrations
  const defaultChar = (label: string, color: string) => (
    <g>
      <circle cx="50" cy="28" r="14" fill="#ffeaa7" stroke="#333" strokeWidth="1.5" />
      <circle cx="46" cy="26" r="1.5" fill="#333" />
      <circle cx="54" cy="26" r="1.5" fill="#333" />
      <path d="M46,33 Q50,36 54,33" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <line x1="50" y1="42" x2="50" y2="68" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="68" x2="42" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="68" x2="58" y2="82" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="50" x2="34" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="50" x2="66" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <rect x="30" y="62" width="40" height="14" rx="4" fill={color} stroke="#333" strokeWidth="1" />
      <text x="50" y="72" fontSize="7" fill="#fff" textAnchor="middle" fontWeight="bold">{label}</text>
    </g>
  );

  const custom = characters[debateIndex];
  if (custom) return custom[side];

  const debate = debates[debateIndex];
  const label = side === "left" ? debate.left.title : debate.right.title;
  const color = side === "left" ? "#6c5ce7" : "#00b894";
  return defaultChar(label, color);
};

// ─── Main Component ───────────────────────────────────────────

const SettleThis = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<"left" | "right" | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);

  // Shuffled debate order
  const debateOrder = useMemo(() => {
    const indices = Array.from({ length: debates.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, []);

  const debateIdx = debateOrder[currentIndex];
  const debate = debates[debateIdx];

  // Simulated realistic vote split
  const votes = useMemo(() => {
    const leftPct = 35 + Math.floor(Math.random() * 31); // 35-65
    return { left: leftPct, right: 100 - leftPct };
  }, [currentIndex]);

  const totalVotes = useMemo(() => 24 + Math.floor(Math.random() * 20), [currentIndex]);

  const handleSelect = useCallback((side: "left" | "right") => {
    if (selected) return;
    setSelected(side);
    setTimeout(() => setShowResults(true), 500);

    // Easter egg: choosing "Dark Mode" or "Light Mode" toggles the site theme
    const currentDebate = debates[debateOrder[currentIndex]];
    const chosenTitle = currentDebate[side].title;
    if (chosenTitle === "Dark Mode") {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else if (chosenTitle === "Light Mode") {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [selected, debateOrder, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex >= debates.length - 1) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex((p) => p + 1);
    }
    setSelected(null);
    setShowResults(false);
    setUsedIndices((p) => [...p, debateIdx]);
  }, [currentIndex, debateIdx]);

  const isComplete = usedIndices.length >= debates.length;

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8">
        {/* Header */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to Arena</span>
          </button>
          <div className="text-sm font-semibold text-slate-500 tracking-wider uppercase">
            {currentIndex + 1} / {debates.length}
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={debateIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-4xl flex flex-col items-center flex-1"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-center text-slate-100 mb-2 tracking-tight">
              {debate.question}
            </h1>
            <p className="text-base sm:text-lg text-slate-500 mb-10 text-center">
              Choose your side. The class decides.
            </p>

            {/* Two side panels */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
              {(["left", "right"] as const).map((side) => {
                const data = debate[side];
                const isChosen = selected === side;
                const isDimmed = selected && selected !== side;
                return (
                  <motion.button
                    key={side}
                    onClick={() => handleSelect(side)}
                    disabled={!!selected}
                    whileHover={!selected ? { scale: 1.03, y: -4 } : {}}
                    whileTap={!selected ? { scale: 0.97 } : {}}
                    animate={isDimmed ? { opacity: 0.4, scale: 0.96 } : isChosen ? { scale: 1.02 } : {}}
                    transition={{ duration: 0.4 }}
                    className={`
                      relative p-6 sm:p-8 rounded-2xl border-2 text-left transition-all duration-300
                      ${isChosen
                        ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                        : "border-slate-700 bg-slate-800/50 hover:border-purple-600 hover:shadow-xl"
                      }
                      ${isDimmed ? "pointer-events-none" : "cursor-pointer"}
                    `}
                  >
                    {/* SVG Character */}
                    <div className="flex justify-center mb-4">
                      <motion.svg
                        viewBox="0 0 100 90"
                        width="120"
                        height="108"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <CharacterSVG side={side} debateIndex={debateIdx} />
                      </motion.svg>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-1 text-center">
                      {data.title}
                    </h2>
                    <p className="text-sm text-slate-400 text-center">
                      {data.description}
                    </p>

                    {isChosen && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center"
                      >
                        <span className="text-white text-sm font-bold">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Results */}
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full max-w-3xl mt-10"
                >
                  {/* Percentage Bars */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {(["left", "right"] as const).map((side) => {
                      const pct = votes[side];
                      const isWinner = pct > 50;
                      return (
                        <div key={side} className="space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-semibold text-slate-300">
                              {debate[side].title}
                            </span>
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              className={`text-2xl font-black ${isWinner ? "text-purple-400" : "text-slate-500"}`}
                            >
                              {pct}%
                            </motion.span>
                          </div>
                          <div className="h-4 rounded-full bg-slate-700 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
                              className={`h-full rounded-full ${
                                side === "left"
                                  ? "bg-gradient-to-r from-purple-500 to-purple-400"
                                  : "bg-gradient-to-r from-teal-500 to-teal-400"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center text-slate-400 text-sm mb-8"
                  >
                    Based on {totalVotes} votes •{" "}
                    {selected && votes[selected] > 50
                      ? "The majority agrees with you!"
                      : "You're in the minority — but that's okay!"}
                  </motion.p>

                  {/* Navigation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="flex justify-center gap-4"
                  >
                    <button
                      onClick={() => navigate("/")}
                      className="px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Back to Arena
                    </button>
                    {!isComplete && (
                      <button
                        onClick={handleNext}
                        className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/30"
                      >
                        Next Question
                        <ArrowRight size={18} />
                      </button>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettleThis;
