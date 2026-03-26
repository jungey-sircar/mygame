import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Trophy, Shuffle, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

interface Figure {
  id: number;
  name: string;
  birth_year: number;
  death_year: number;
  image: string;
  description: string;
  category: string;
}

interface ChallengeData {
  year: number;
  figures: Figure[];
}

const categories = ["All", "Writers", "Scientists", "Politicians", "Artists", "Philosophers", "Musicians", "Inventors"];

const formatYear = (y: number) => (y < 0 ? `${Math.abs(y)} BC` : `${y} AD`);

const buildWikimediaFilePathUrl = (originalUrl: string): string | null => {
  try {
    const parsed = new URL(originalUrl);
    if (!parsed.hostname.includes("wikimedia.org") && !parsed.hostname.includes("wikipedia.org")) {
      return null;
    }

    const rawFilename = decodeURIComponent(parsed.pathname.split("/").pop() || "");
    if (!rawFilename) return null;

    const filename = rawFilename.replace(/^\d+px-/, "");
    if (!filename) return null;

    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
  } catch {
    return null;
  }
};

const getImageUrl = (originalUrl: string): string => {
  // Weserv expects the remote URL without protocol in the `url` query param.
  if (originalUrl.includes("wikimedia.org") || originalUrl.includes("wikipedia.org")) {
    const normalized = originalUrl.replace(/^https?:\/\//, "");
    return `https://images.weserv.nl/?url=${encodeURIComponent(normalized)}&output=webp&q=80`;
  }
  return originalUrl;
};

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const getWikipediaUrl = (name: string): string => {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`;
};

const BROTHERS_GRIMM_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Grimm.jpg/330px-Grimm.jpg";

const WhoWasAlive = () => {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [year, setYear] = useState(1800);
  const [yearInput, setYearInput] = useState("1800");
  const [maxYear, setMaxYear] = useState(() => new Date().getFullYear());
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [mode, setMode] = useState<"explore" | "challenge">("explore");

  // Challenge mode state
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [challengeRevealed, setChallengeRevealed] = useState(false);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeRound, setChallengeRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const wikipediaImageCache = useRef<Record<string, string>>({});

  useEffect(() => {
    fetchFigures();
  }, []);

  useEffect(() => {
    const updateMaxYear = () => setMaxYear(new Date().getFullYear());
    updateMaxYear();

    // Keep the limit fresh if the app stays open across New Year.
    const intervalId = window.setInterval(updateMaxYear, 60 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const fetchFigures = async () => {
    try {
      const { data } = await supabase.functions.invoke("historical-figures", {
        body: null,
        method: "GET",
      });
      if (data) {
        const nextFigures: Figure[] = (Array.isArray(data) ? data : []).map((f: Figure) => {
          if (normalizeSearch(f.name).includes("brothers grimm")) {
            return {
              ...f,
              image: BROTHERS_GRIMM_IMAGE_URL,
            };
          }

          return f;
        });
        const hasElon = nextFigures.some((f) => normalizeSearch(f.name) === "elon musk");

        if (!hasElon) {
          nextFigures.push({
            id: 10001,
            name: "Elon Musk",
            birth_year: 1971,
            death_year: maxYear + 100,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Elon_Musk_Royal_Society_%28crop1%29.jpg/220px-Elon_Musk_Royal_Society_%28crop1%29.jpg",
            description: "Entrepreneur and technology business leader",
            category: "Inventors",
          });
        }

        setFigures(nextFigures);
      }
    } catch (err) {
      console.error("Failed to fetch figures:", err);
    } finally {
      setLoading(false);
    }
  };

  const aliveFigures = useMemo(() => {
    return figures
      .filter((f) => year >= f.birth_year && year <= f.death_year)
      .filter((f) => activeCategory === "All" || f.category === activeCategory)
      .sort((a, b) => a.birth_year - b.birth_year);
  }, [figures, year, activeCategory]);

  const oldest = useMemo(() => {
    if (aliveFigures.length === 0) return null;
    return aliveFigures.reduce((o, f) => (year - f.birth_year > year - o.birth_year ? f : o));
  }, [aliveFigures, year]);

  const youngest = useMemo(() => {
    if (aliveFigures.length === 0) return null;
    return aliveFigures.reduce((y2, f) => (year - f.birth_year < year - y2.birth_year ? f : y2));
  }, [aliveFigures, year]);

  const searchResults = useMemo(() => {
    const q = normalizeSearch(searchQuery);
    if (!q) return [];

    return figures
      .filter((f) => activeCategory === "All" || f.category === activeCategory)
      .filter((f) => normalizeSearch(f.name).includes(q))
      .sort((a, b) => a.birth_year - b.birth_year);
  }, [figures, activeCategory, searchQuery]);

  const displayedFigures = searchQuery ? searchResults : aliveFigures;

  const handleYearChange = useCallback((val: string) => {
    setYearInput(val);
    const n = parseInt(val);
    if (!isNaN(n) && n >= -1500 && n <= maxYear) {
      setYear(n);
    }
  }, [maxYear]);

  const handleSliderChange = useCallback((val: number[]) => {
    setYear(val[0]);
    setYearInput(String(val[0]));
  }, []);

  const handleSearch = useCallback(() => {
    setSearchQuery(normalizeSearch(searchInput));
  }, [searchInput]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
  }, []);

  const fetchWikipediaThumbnail = useCallback(async (name: string) => {
    const cached = wikipediaImageCache.current[name];
    if (cached) return cached;

    try {
      const title = encodeURIComponent(name.replace(/\s+/g, "_"));
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
      if (!response.ok) return null;

      const data = await response.json();
      const src = data?.thumbnail?.source as string | undefined;
      if (src) {
        wikipediaImageCache.current[name] = src;
        return src;
      }
    } catch (err) {
      console.error(`Failed to fetch Wikipedia thumbnail for ${name}:`, err);
    }

    return null;
  }, []);

  // Challenge mode
  const startChallenge = async () => {
    setMode("challenge");
    setChallengeRound(0);
    setTotalScore(0);
    await nextChallengeRound();
  };

  const nextChallengeRound = async () => {
    setChallengeRevealed(false);
    setSelectedIds(new Set());
    setChallengeScore(0);
    try {
      const { data } = await supabase.functions.invoke("historical-figures/challenge", {
        body: null,
        method: "GET",
      });
      if (data) {
        setChallengeData(data);
        setChallengeRound((r) => r + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelection = (id: number) => {
    if (challengeRevealed) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const revealChallenge = () => {
    if (!challengeData) return;
    let score = 0;
    challengeData.figures.forEach((f) => {
      const alive = challengeData.year >= f.birth_year && challengeData.year <= f.death_year;
      const selected = selectedIds.has(f.id);
      if (alive && selected) score += 10;
      else if (!alive && selected) score -= 5;
      else if (alive && !selected) score -= 5;
    });
    setChallengeScore(score);
    setTotalScore((t) => t + score);
    setChallengeRevealed(true);
  };

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>, originalUrl: string, figureName: string) => {
      const img = e.currentTarget;
      const stage = Number(img.dataset.fallbackStage || "0");

      if (stage === 0) {
        const filePathUrl = buildWikimediaFilePathUrl(originalUrl);
        if (filePathUrl) {
          img.dataset.fallbackStage = "1";
          img.src = filePathUrl;
          return;
        }
      }

      if (stage <= 1) {
        img.dataset.fallbackStage = "2";
        void (async () => {
          const wikipediaThumb = await fetchWikipediaThumbnail(figureName);
          if (wikipediaThumb) {
            img.src = wikipediaThumb;
            return;
          }

          img.dataset.fallbackStage = "3";
          img.src = "/placeholder.svg";
        })();
        return;
      }

      img.dataset.fallbackStage = "3";
      img.src = "/placeholder.svg";
    },
    [fetchWikipediaThumbnail]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-display text-muted-foreground">Loading historical figures...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-display text-sm">Arena</span>
          </Link>
          <h1 className="font-display text-lg font-bold">📜 Who Was Alive?</h1>
          <div className="flex gap-2">
            <Button
              variant={mode === "explore" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("explore")}
              className="font-display text-xs"
            >
              <Search className="w-3 h-3 mr-1" /> Explore
            </Button>
            <Button
              variant={mode === "challenge" ? "default" : "outline"}
              size="sm"
              onClick={startChallenge}
              className="font-display text-xs"
            >
              <Trophy className="w-3 h-3 mr-1" /> Challenge
            </Button>
          </div>
        </div>
      </div>

      {mode === "explore" ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Year Input Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="font-display text-muted-foreground text-sm mb-2 uppercase tracking-widest">
              Who was alive in
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Input
                type="number"
                value={yearInput}
                onChange={(e) => handleYearChange(e.target.value)}
                min={-1500}
                max={maxYear}
                className="w-32 text-center font-display text-3xl font-bold h-16 border-2 border-primary/30 bg-card"
              />
            </div>
            <div className="max-w-xl mx-auto px-4">
              <Slider
                value={[year]}
                onValueChange={handleSliderChange}
                min={-500}
                max={maxYear}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground font-body">
                <span>500 BC</span>
                <span>Year 0</span>
                <span>1000</span>
                <span>{maxYear}</span>
              </div>
            </div>
          </motion.div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="font-display text-xs"
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="max-w-xl mx-auto mb-6 flex items-center gap-2">
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Search figure: Elon Musk, Einstein, Socrates..."
              className="font-body"
            />
            <Button type="button" onClick={handleSearch} className="font-display">
              <Search className="w-4 h-4 mr-1" /> Search
            </Button>
            {searchQuery && (
              <Button type="button" variant="outline" onClick={clearSearch} className="font-display">
                Clear
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 justify-center mb-8 text-sm font-body">
            <div className="glass-panel px-4 py-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{searchQuery ? "Results:" : "Alive:"}</span>
              <span className="font-display font-bold text-foreground">{displayedFigures.length}</span>
            </div>
            {!searchQuery && oldest && (
              <div className="glass-panel px-4 py-2">
                <span className="text-muted-foreground">Oldest: </span>
                <span className="font-display font-bold text-primary">{oldest.name}</span>
                <span className="text-muted-foreground"> ({year - oldest.birth_year} yrs)</span>
              </div>
            )}
            {!searchQuery && youngest && (
              <div className="glass-panel px-4 py-2">
                <span className="text-muted-foreground">Youngest: </span>
                <span className="font-display font-bold text-secondary">{youngest.name}</span>
                <span className="text-muted-foreground"> ({year - youngest.birth_year} yrs)</span>
              </div>
            )}
          </div>

          {/* Figures Grid */}
          <AnimatePresence mode="popLayout">
            {displayedFigures.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="font-display text-xl text-muted-foreground">
                  {searchQuery ? `No figures found for "${searchQuery}"` : `No known figures alive in ${formatYear(year)}`}
                </p>
                {searchQuery ? (
                  <p className="font-body text-sm text-muted-foreground mt-2">
                    Try searching names like Elon Musk, Einstein, or Socrates
                  </p>
                ) : (
                  <p className="font-body text-sm text-muted-foreground mt-2">
                    Try a year between 500 BC and {formatYear(maxYear)}
                  </p>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {displayedFigures.map((figure) => (
                  <motion.a
                    key={figure.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    href={getWikipediaUrl(figure.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${figure.name} on Wikipedia`}
                    className="glass-panel p-3 group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
                      <img
                        src={getImageUrl(figure.image)}
                        alt={figure.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => handleImageError(e, figure.image, figure.name)}
                      />
                      {figure.id === oldest?.id && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-display px-1.5 py-0.5 rounded-full">
                          OLDEST
                        </div>
                      )}
                      {figure.id === youngest?.id && (
                        <div className="absolute top-1 left-1 bg-secondary text-secondary-foreground text-[10px] font-display px-1.5 py-0.5 rounded-full">
                          YOUNGEST
                        </div>
                      )}
                    </div>
                    <h3 className="font-display text-xs font-bold text-foreground leading-tight mb-1 line-clamp-2">
                      {figure.name}
                    </h3>
                    <p className="font-body text-[11px] text-muted-foreground leading-tight mb-1">
                      {figure.description}
                    </p>
                    <p className="font-body text-[10px] text-muted-foreground">
                      {formatYear(figure.birth_year)} – {formatYear(figure.death_year)}
                    </p>
                    <div className="mt-1 font-display text-xs font-bold text-primary">
                      Age: {year - figure.birth_year}
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* CHALLENGE MODE */
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="glass-panel px-4 py-2 font-display text-sm">
              Round: <span className="font-bold text-primary">{challengeRound}</span>/5
            </div>
            <div className="glass-panel px-4 py-2 font-display text-sm">
              Total Score: <span className="font-bold text-primary">{totalScore}</span>
            </div>
          </div>

          {challengeData && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <p className="font-display text-muted-foreground text-sm uppercase tracking-widest mb-2">
                  Select everyone who was alive in
                </p>
                <div className="font-display text-5xl font-black text-foreground">
                  {formatYear(challengeData.year)}
                </div>
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {challengeData.figures.map((figure) => {
                  const alive = challengeData.year >= figure.birth_year && challengeData.year <= figure.death_year;
                  const selected = selectedIds.has(figure.id);
                  let borderColor = "";
                  if (challengeRevealed) {
                    if (alive && selected) borderColor = "ring-2 ring-green-500";
                    else if (!alive && selected) borderColor = "ring-2 ring-destructive";
                    else if (alive && !selected) borderColor = "ring-2 ring-yellow-500";
                  }

                  return (
                    <motion.div
                      key={figure.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`glass-panel p-3 cursor-pointer transition-all duration-300 ${
                        selected && !challengeRevealed ? "ring-2 ring-primary" : ""
                      } ${borderColor} ${challengeRevealed && !alive ? "opacity-40" : ""}`}
                      onClick={() => toggleSelection(figure.id)}
                      whileHover={!challengeRevealed ? { scale: 1.03 } : {}}
                      whileTap={!challengeRevealed ? { scale: 0.97 } : {}}
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                        <img
                          src={getImageUrl(figure.image)}
                          alt={figure.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => handleImageError(e, figure.image, figure.name)}
                        />
                        {selected && !challengeRevealed && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-display text-lg">
                              ✓
                            </div>
                          </div>
                        )}
                        {challengeRevealed && (
                          <div className={`absolute inset-0 flex items-center justify-center ${alive ? "bg-green-500/20" : "bg-destructive/20"}`}>
                            <span className="text-2xl">{alive ? "✅" : "❌"}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-display text-xs font-bold text-foreground leading-tight line-clamp-1">
                        {figure.name}
                      </h3>
                      <p className="font-body text-[10px] text-muted-foreground">
                        {formatYear(figure.birth_year)} – {formatYear(figure.death_year)}
                      </p>
                      {challengeRevealed && alive && (
                        <p className="font-display text-[10px] text-primary mt-1">
                          Age: {challengeData.year - figure.birth_year}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {!challengeRevealed ? (
                <div className="text-center">
                  <Button onClick={revealChallenge} size="lg" className="font-display text-lg px-10">
                    Reveal Answers
                  </Button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
                  <div className="font-display text-2xl font-bold">
                    Round Score:{" "}
                    <span className={challengeScore >= 0 ? "text-primary" : "text-destructive"}>
                      {challengeScore > 0 ? "+" : ""}
                      {challengeScore}
                    </span>
                  </div>
                  {challengeRound < 5 ? (
                    <Button onClick={nextChallengeRound} size="lg" className="font-display">
                      Next Round →
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="glass-panel p-6 max-w-md mx-auto">
                        <p className="font-display text-sm text-muted-foreground uppercase tracking-widest mb-2">Final Score</p>
                        <p className="font-display text-4xl font-black text-primary">{totalScore}</p>
                        <p className="font-display text-lg mt-2 text-foreground">
                          {totalScore >= 200
                            ? "🏆 History Master!"
                            : totalScore >= 100
                            ? "📚 Scholar"
                            : totalScore >= 50
                            ? "🎓 Student"
                            : "📖 Keep Learning!"}
                        </p>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={startChallenge} className="font-display">
                          <Shuffle className="w-4 h-4 mr-1" /> Play Again
                        </Button>
                        <Button variant="outline" onClick={() => setMode("explore")} className="font-display">
                          Free Explore
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WhoWasAlive;
