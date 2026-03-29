import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, Trophy, Target, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────
interface AuctionItem {
  id: number;
  name: string;
  description: string;
  image: string;
  year: string;
}

interface GuessResult {
  actual_price: number;
  guess: number;
  difference: number;
  percent_off: number;
  score: number;
}

interface SessionRecord {
  item: AuctionItem;
  result: GuessResult;
}

const shuffleItems = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

const LOCAL_IMAGE_MAP: Record<number, string> = {
  1: "/auction-images/mona-lisa.jpg",
  2: "/auction-images/the-scream.jpg",
  3: "/auction-images/salvator-mundi.jpg",
  4: "/auction-images/les-femmes-dalger.png",
  5: "/auction-images/no-5-1948.jpg",
  6: "/auction-images/starry-night.jpg",
  7: "/auction-images/girl-with-pearl-earring.jpg",
  8: "/auction-images/ferrari-250-gto.jpg",
  9: "/auction-images/codex-leicester.jpg",
  10: "/auction-images/action-comics-1.jpg",
  11: "/auction-images/persistence-of-memory.jpg",
  12: "/auction-images/water-lilies.jpg",
  13: "/auction-images/the-kiss.jpg",
  14: "/auction-images/great-wave.jpg",
  15: "/auction-images/birth-of-venus.jpg",
  16: "/auction-images/american-gothic.jpg",
  17: "/auction-images/nighthawks.jpg",
  18: "/auction-images/ferrari-250-gt-lusso.jpg",
  19: "/auction-images/declaration-of-independence.jpg",
  20: "/auction-images/lady-blunt-violin.jpg",
  21: "/auction-images/hope-diamond.jpg",
  22: "/auction-images/stan-trex.jpg",
  23: "/auction-images/honus-wagner-card.jpg",
  24: "/auction-images/codex-hammer.jpg",
  25: "/auction-images/interchange.jpg",
  26: "/auction-images/shot-sage-blue-marilyn.jpg",
  27: "/auction-images/card-players.jpg",
  28: "/auction-images/guernica.jpg",
  29: "/auction-images/rolex-daytona.png",
  30: "/auction-images/inverted-jenny.jpg",
};

const LOCAL_PRICE_MAP: Record<number, number> = {
  1: 860000000,
  2: 120000000,
  3: 450300000,
  4: 179400000,
  5: 140000000,
  6: 100000000,
  7: 74000000,
  8: 70000000,
  9: 30800000,
  10: 3200000,
  11: 55000000,
  12: 50000000,
  13: 135000000,
  14: 40000000,
  15: 200000000,
  16: 7000000,
  17: 3000000,
  18: 35000000,
  19: 43000000,
  20: 15900000,
  21: 200000000,
  22: 32000000,
  23: 7600000,
  24: 30800000,
  25: 300500000,
  26: 195000000,
  27: 250000000,
  28: 200000000,
  29: 17800000,
  30: 1900000,
};

const LOCAL_ITEM_DETAILS: Record<number, { name: string; description: string; year: string }> = {
  1: { name: "Mona Lisa", description: "Leonardo da Vinci portrait masterpiece, famed for its sfumato technique and enigmatic expression.", year: "c.1503" },
  2: { name: "The Scream", description: "Edvard Munch expressionist icon depicting psychological tension with dramatic sky and line work.", year: "1893" },
  3: { name: "Salvator Mundi", description: "Attributed Renaissance Christ portrait rediscovered and sold as one of the highest-value paintings ever.", year: "c.1500" },
  4: { name: "Les Femmes d'Alger", description: "Picasso's Cubist reinterpretation inspired by Delacroix, from his celebrated late period series.", year: "1955" },
  5: { name: "No. 5, 1948", description: "Jackson Pollock drip-era abstract with dense layered enamel strokes across a monumental surface.", year: "1948" },
  6: { name: "The Starry Night", description: "Van Gogh nightscape with swirling celestial motion and bold, emotive brushwork.", year: "1889" },
  7: { name: "Girl with a Pearl Earring", description: "Johannes Vermeer tronie known for subtle light, color harmony, and iconic pearl highlight.", year: "c.1665" },
  8: { name: "Ferrari 250 GTO", description: "Ultra-rare homologation race car with elite motorsport pedigree and exceptional collector demand.", year: "1962" },
  9: { name: "Codex Leicester", description: "Leonardo da Vinci scientific notebook containing studies on water, astronomy, and natural phenomena.", year: "c.1510" },
  10: { name: "Action Comics #1", description: "Landmark comic introducing Superman, considered the foundational issue of superhero publishing.", year: "1938" },
  11: { name: "The Persistence of Memory", description: "Dali surrealist work featuring melting clocks and dreamlike symbolic desert imagery.", year: "1931" },
  12: { name: "Water Lilies", description: "Monet late-series Impressionist canvas exploring light reflection and atmosphere on garden ponds.", year: "c.1916" },
  13: { name: "The Kiss", description: "Gustav Klimt golden-period composition with ornamental geometry and gilded decorative surfaces.", year: "1908" },
  14: { name: "The Great Wave", description: "Hokusai woodblock print from Thirty-Six Views of Mount Fuji, globally recognized ukiyo-e image.", year: "c.1831" },
  15: { name: "The Birth of Venus", description: "Botticelli mythological Renaissance scene portraying Venus emerging from the sea.", year: "c.1485" },
  16: { name: "American Gothic", description: "Grant Wood regionalist portrait famous for its iconic rural American figures and composition.", year: "1930" },
  17: { name: "Nighthawks", description: "Edward Hopper urban night diner scene emphasizing isolation, light, and modern city mood.", year: "1942" },
  18: { name: "Ferrari 250 GT Lusso", description: "Classic grand-touring Ferrari admired for elegant body lines and limited production rarity.", year: "1963" },
  19: { name: "Declaration of Independence", description: "Historic foundational U.S. document manuscript associated with nation-defining political history.", year: "1776" },
  20: { name: "Lady Blunt Violin", description: "Exceptionally preserved Stradivarius violin, highly prized for condition, provenance, and craftsmanship.", year: "1721" },
  21: { name: "Hope Diamond", description: "Legendary deep-blue gemstone known for historic ownership chain and rare color saturation.", year: "17th c." },
  22: { name: "Stan T-Rex", description: "Tyrannosaurus rex fossil cast based on one of the most complete and studied specimens.", year: "Cretaceous" },
  23: { name: "Honus Wagner Card", description: "T206 tobacco card grail with extreme scarcity, central to elite sports memorabilia auctions.", year: "1909" },
  24: { name: "Codex Hammer", description: "Alternate reference to Leonardo manuscript pages covering physics and observational studies.", year: "c.1508" },
  25: { name: "Interchange", description: "Willem de Kooning abstract expressionist landmark with energetic gestural color fields.", year: "1955" },
  26: { name: "Shot Sage Blue Marilyn", description: "Andy Warhol screenprint portrait from the Marilyn series with bold Pop Art color treatment.", year: "1964" },
  27: { name: "The Card Players", description: "Cezanne post-impressionist series depicting peasants in quiet, structured tabletop scenes.", year: "c.1895" },
  28: { name: "Guernica", description: "Picasso anti-war mural-scale work responding to the bombing of Guernica in the Spanish Civil War.", year: "1937" },
  29: { name: "Rolex Daytona", description: "Highly collectible chronograph wristwatch line valued for rarity, references, and provenance.", year: "1960s" },
  30: { name: "Inverted Jenny", description: "Rare U.S. airmail stamp error with inverted biplane center, iconic philatelic collectible.", year: "1918" },
};

const titleFromImagePath = (path: string) => {
  const file = path.split("/").pop() || "auction-item";
  const base = file.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  return base
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const buildLocalAuctionItems = (): AuctionItem[] => {
  return Object.entries(LOCAL_IMAGE_MAP).map(([idText, imagePath]) => {
    const id = Number(idText);
    const details = LOCAL_ITEM_DETAILS[id];
    return {
      id,
      name: details?.name || titleFromImagePath(imagePath),
      description: details?.description || `${titleFromImagePath(imagePath)} from the local collection with verified auction-style metadata.`,
      image: imagePath,
      year: details?.year || "Archive",
    };
  });
};

const calcLocalGuessResult = (itemId: number, guess: number): GuessResult => {
  const actual = LOCAL_PRICE_MAP[itemId] ?? 1000000;
  const difference = Math.abs(actual - guess);
  const percentOff = actual > 0 ? Math.round((difference / actual) * 100) : 0;
  const score = Math.max(0, 1000 - Math.min(1000, percentOff * 10));

  return {
    actual_price: actual,
    guess,
    difference,
    percent_off: percentOff,
    score,
  };
};

// ─── Helpers ──────────────────────────────────────────────
const formatPrice = (n: number) =>
  "$" + n.toLocaleString("en-US");

const getRank = (score: number, total: number) => {
  const avg = score / total;
  if (avg >= 900) return { title: "Billionaire Visionary", emoji: "👑" };
  if (avg >= 700) return { title: "Elite Collector", emoji: "💎" };
  if (avg >= 500) return { title: "Gallery Curator", emoji: "🏛️" };
  if (avg >= 300) return { title: "Auction Regular", emoji: "🎩" };
  return { title: "Auction Apprentice", emoji: "📚" };
};

const getReaction = (pct: number) => {
  if (pct <= 5) return "Incredible! 🎯";
  if (pct <= 15) return "Very close! 🔥";
  if (pct <= 30) return "Not bad! 👏";
  if (pct <= 60) return "That was bold… 🤔";
  return "Way off! 😅";
};

// ─── Animated Counter ─────────────────────────────────────
const AnimatedCounter = ({ target, duration = 2000 }: { target: number; duration?: number }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);

  return <>{formatPrice(val)}</>;
};

// ─── Score Counter ────────────────────────────────────────
const ScoreCounter = ({ target }: { target: number }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target]);

  return <>{val}</>;
};

// ─── Main Component ──────────────────────────────────────
const AuctionChallenge = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<GuessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [imageHover, setImageHover] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const ITEMS_PER_SESSION = 7;

  const loadItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const { data, error } = await supabase.functions.invoke("auction/items");
      if (error) throw error;

      const onlineItems = Array.isArray(data) ? (data as AuctionItem[]) : [];
      if (onlineItems.length > 0) {
        setItems(shuffleItems(onlineItems).slice(0, ITEMS_PER_SESSION));
      } else {
        const offlineItems = shuffleItems(buildLocalAuctionItems()).slice(0, ITEMS_PER_SESSION);
        setItems(offlineItems);
        setFetchError("Using local auction data (online auction service unavailable).");
      }
    } catch (e) {
      console.error("Failed to fetch auction items:", e);
      const offlineItems = shuffleItems(buildLocalAuctionItems()).slice(0, ITEMS_PER_SESSION);
      setItems(offlineItems);
      setFetchError("Using local auction data (online auction service unavailable).");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch items
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const currentItem = items[currentIdx];

  const getImageSrc = (item: AuctionItem) => LOCAL_IMAGE_MAP[item.id] || item.image || "";

  useEffect(() => {
    setImageFailed(false);
  }, [currentItem?.id]);

  const handleGuessChange = (value: string) => {
    const numeric = value.replace(/[^0-9]/g, "");
    setGuess(numeric);
  };

  const formattedGuess = guess
    ? "$" + parseInt(guess).toLocaleString("en-US")
    : "";

  const submitGuess = useCallback(async () => {
    if (!guess || !currentItem || submitting) return;
    setSubmitting(true);
    const guessed = parseInt(guess, 10);

    try {
      const { data, error } = await supabase.functions.invoke("auction/guess", {
        body: { itemId: currentItem.id, guess: guessed },
      });
      if (error) throw error;
      const res = data as GuessResult;
      setResult(res);
      setTotalScore((s) => s + res.score);
      setHistory((h) => [...h, { item: currentItem, result: res }]);

      // Play reveal sound
      playRevealSound();
    } catch (e) {
      console.error("Failed to submit guess:", e);
      const res = calcLocalGuessResult(currentItem.id, guessed);
      setResult(res);
      setTotalScore((s) => s + res.score);
      setHistory((h) => [...h, { item: currentItem, result: res }]);
      setFetchError("Using local score calculation (online bid check unavailable).");
      playRevealSound();
    } finally {
      setSubmitting(false);
    }
  }, [guess, currentItem, submitting]);

  const nextItem = () => {
    if (currentIdx >= items.length - 1) {
      setGameOver(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setGuess("");
      setResult(null);
    }
  };

  const playAgain = () => {
    setImageFailed(false);
    setCurrentIdx(0);
    setGuess("");
    setResult(null);
    setTotalScore(0);
    setHistory([]);
    setGameOver(false);
    loadItems();
  };

  const playRevealSound = () => {
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.4);
      });
    } catch {}
  };

  // ─── GAME OVER SCREEN ───────────────────────────────────
  if (gameOver) {
    const rank = getRank(totalScore, history.length);
    const avgAccuracy = history.length
      ? Math.round(
          (history.reduce((s, h) => s + (100 - h.result.percent_off), 0) / history.length) * 10
        ) / 10
      : 0;
    const closest = [...history].sort((a, b) => a.result.percent_off - b.result.percent_off)[0];
    const farthest = [...history].sort((a, b) => b.result.percent_off - a.result.percent_off)[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-6xl mb-4"
          >
            {rank.emoji}
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black text-amber-400 mb-2">{rank.title}</h1>
          <p className="text-white/50 mb-8">Auction Complete</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white">{totalScore}</div>
              <div className="text-xs text-white/40">Total Score</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white">{avgAccuracy}%</div>
              <div className="text-xs text-white/40">Avg Accuracy</div>
            </div>
          </div>

          {closest && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-3 text-left">
              <p className="text-emerald-400 text-sm font-semibold">🎯 Closest Guess</p>
              <p className="text-white/70 text-sm">{closest.item.name} — {closest.result.percent_off}% off</p>
            </div>
          )}
          {farthest && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-8 text-left">
              <p className="text-red-400 text-sm font-semibold"><TrendingDown className="inline w-4 h-4" /> Farthest Guess</p>
              <p className="text-white/70 text-sm">{farthest.item.name} — {farthest.result.percent_off}% off</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-5 py-3 rounded-xl border border-white/20 text-white/70 font-semibold hover:bg-white/5 transition-colors"
            >
              Back to Arena
            </button>
            <button
              onClick={playAgain}
              className="px-5 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── LOADING ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f] flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-amber-400 text-xl font-semibold"
        >
          Loading auction items...
        </motion.div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f] flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <h2 className="text-2xl font-black text-white mb-2">No auction items available</h2>
          <p className="text-white/60 mb-6">Could not load the local or online auction item list.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-5 py-3 rounded-xl border border-white/20 text-white/70 font-semibold hover:bg-white/5 transition-colors"
            >
              Back to Arena
            </button>
            <button
              onClick={loadItems}
              className="px-5 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
            >
              Retry Load
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN GAME ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f] relative overflow-hidden">
      {/* Spotlight */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-6">
        {/* Header */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Arena</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/30 font-semibold tracking-wider uppercase">
              {currentIdx + 1} / {items.length}
            </span>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5">
              <span className="text-amber-400 font-bold text-sm">
                <Trophy className="inline w-4 h-4 mr-1" />
                {totalScore}
              </span>
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="w-full max-w-3xl mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-300">
            {fetchError}
          </div>
        )}

        {/* Item Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl flex flex-col items-center"
          >
            {/* Image */}
            <div
              className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-2xl shadow-black/50 bg-black/30"
              onMouseEnter={() => setImageHover(true)}
              onMouseLeave={() => setImageHover(false)}
            >
              <motion.img
                src={imageFailed
                  ? `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3b1d10"/><stop offset="55%" stop-color="#120909"/><stop offset="100%" stop-color="#060607"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)" rx="32"/><circle cx="300" cy="270" r="120" fill="rgba(245,158,11,0.16)"/><rect x="185" y="155" width="230" height="230" rx="26" fill="rgba(255,255,255,0.06)" stroke="rgba(245,158,11,0.38)"/><text x="300" y="275" text-anchor="middle" font-size="84">🏛️</text><text x="300" y="470" text-anchor="middle" fill="#f5f5f5" font-size="34" font-family="Arial, sans-serif" font-weight="700">${currentItem.name}</text><text x="300" y="520" text-anchor="middle" fill="rgba(255,255,255,0.58)" font-size="24" font-family="Arial, sans-serif">${currentItem.year}</text></svg>`)}`
                  : getImageSrc(currentItem)}
                alt={currentItem.name}
                className="w-full h-full object-cover"
                animate={{ scale: imageHover ? 1.05 : 1 }}
                transition={{ duration: 0.4 }}
                loading="eager"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setImageFailed(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-xs bg-amber-500/80 text-black font-bold px-2 py-0.5 rounded">
                  {currentItem.year}
                </span>
              </div>
            </div>

            {/* Item Info */}
            <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-1">
              {currentItem.name}
            </h2>
            <p className="text-sm text-white/50 text-center mb-8 max-w-md">
              {currentItem.description}
            </p>

            {/* Input / Result */}
            {!result ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-sm"
              >
                <label className="text-sm text-white/30 font-semibold mb-2 block text-center uppercase tracking-wider">
                  Enter your guess in USD
                </label>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-lg">$</span>
                  <input
                    type="text"
                    value={guess ? parseInt(guess).toLocaleString("en-US") : ""}
                    onChange={(e) => handleGuessChange(e.target.value.replace(/,/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && submitGuess()}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/15 rounded-xl py-4 pl-10 pr-4 text-white text-xl font-bold text-center focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-white/20"
                    autoFocus
                  />
                </div>
                <button
                  onClick={submitGuess}
                  disabled={!guess || submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-lg hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                >
                  {submitting ? "Revealing..." : "Place Bid"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
              >
                {/* Reaction */}
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-center text-2xl font-black text-white mb-6"
                >
                  {getReaction(result.percent_off)}
                </motion.p>

                {/* Price Reveal */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <p className="text-xs text-white/30 uppercase font-semibold mb-1">Your Guess</p>
                    <p className="text-lg font-bold text-white">{formatPrice(result.guess)}</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30 text-center">
                    <p className="text-xs text-amber-400/70 uppercase font-semibold mb-1">Actual Price</p>
                    <p className="text-lg font-bold text-amber-400">
                      <AnimatedCounter target={result.actual_price} />
                    </p>
                  </div>
                </div>

                {/* Accuracy Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/40">Accuracy</span>
                    <span className="text-white/70 font-bold">{Math.max(0, Math.round(100 - result.percent_off))}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, 100 - result.percent_off))}%` }}
                      transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1], delay: 0.4 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    />
                  </div>
                </div>

                {/* Score */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center mb-6"
                >
                  <p className="text-white/40 text-sm">
                    You were <span className="text-white font-semibold">{result.percent_off}%</span> off
                  </p>
                  <p className="text-3xl font-black text-amber-400 mt-1">
                    +<ScoreCounter target={result.score} /> pts
                  </p>
                </motion.div>

                {/* Next */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="flex justify-center gap-3"
                >
                  <button
                    onClick={() => navigate("/")}
                    className="px-5 py-3 rounded-xl border border-white/20 text-white/60 font-semibold hover:bg-white/5 transition-colors"
                  >
                    Back to Arena
                  </button>
                  <button
                    onClick={nextItem}
                    className="px-5 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    {currentIdx >= items.length - 1 ? "See Results" : "Next Item"}
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuctionChallenge;