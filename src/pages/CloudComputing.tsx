import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ParticleBackground from "@/components/ParticleBackground";
import ThemeToggle from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Cloud,
  Database,
  GitBranch,
  Globe2,
  Lock,
  Medal,
  Network,
  Play,
  Rocket,
  Server,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Wifi,
  Boxes,
  Clock3,
  Zap,
  Layers3,
  Radar,
  ChevronRight,
} from "lucide-react";

type GameSummary = { bestScore: number; attempts: number };
type CloudProgress = {
  userId: string;
  level: number;
  xp: number;
  currentStreak: number;
  completedWorlds: string[];
  badges: string[];
  gamesPlayed: Record<string, GameSummary>;
};

type WorldId =
  | "internet-basics"
  | "servers-hosting"
  | "virtual-machines"
  | "containers-docker"
  | "networking-dns"
  | "databases"
  | "load-balancing"
  | "cloud-storage"
  | "kubernetes"
  | "devops-cicd"
  | "security-iam"
  | "monitoring";

type GameKey = "server-defender" | "build-the-cloud" | "docker-escape" | "dns-rush" | "pipeline-runner" | "kubernetes-commander";

type World = {
  id: WorldId;
  title: string;
  theme: string;
  description: string;
  badge: string;
  rewardXp: number;
  difficulty: string;
  icon: typeof Cloud;
  lessons: string[];
  bossChallenge: string;
  gameKey?: GameKey;
};

const STORAGE_KEY = "cloud-computing-progress-v1";
const DEFAULT_USER: CloudProgress = {
  userId: "guest-cloud-runner",
  level: 4,
  xp: 860,
  currentStreak: 9,
  completedWorlds: ["internet-basics", "servers-hosting", "virtual-machines"],
  badges: ["Packet Scout", "Server Savant", "VM Voyager"],
  gamesPlayed: {
    "server-defender": { bestScore: 145, attempts: 2 },
    "build-the-cloud": { bestScore: 120, attempts: 1 },
    "dns-rush": { bestScore: 96, attempts: 3 },
  },
};

const worlds: World[] = [
  {
    id: "internet-basics",
    title: "Internet Basics",
    theme: "IP, DNS, packets",
    description: "Learn how a domain request becomes a packet that finds a destination.",
    badge: "Packet Scout",
    rewardXp: 120,
    difficulty: "Beginner",
    icon: Globe2,
    lessons: ["IP addresses identify devices.", "DNS translates names into destinations.", "Packets travel through routers and caches."],
    bossChallenge: "Trace a web request from browser to server and explain each hop.",
    gameKey: "dns-rush",
  },
  {
    id: "servers-hosting",
    title: "Servers & Hosting",
    theme: "Instances, traffic, uptime",
    description: "Keep services alive when traffic spikes and requests pile up.",
    badge: "Server Savant",
    rewardXp: 150,
    difficulty: "Beginner",
    icon: Server,
    lessons: ["A server responds to requests.", "Load balancers spread traffic.", "Health checks catch failing instances."],
    bossChallenge: "Survive a traffic burst without dropping requests.",
    gameKey: "server-defender",
  },
  {
    id: "virtual-machines",
    title: "Virtual Machines",
    theme: "Compute isolation and provisioning",
    description: "Allocate compute, choose sizes, and keep workloads isolated.",
    badge: "VM Voyager",
    rewardXp: 130,
    difficulty: "Beginner",
    icon: Rocket,
    lessons: ["VMs simulate hardware.", "Images capture a bootable environment.", "Sizing affects cost and performance."],
    bossChallenge: "Select the right machine size for a bursty app.",
    gameKey: "build-the-cloud",
  },
  {
    id: "containers-docker",
    title: "Containers & Docker",
    theme: "Images, ports, dependencies",
    description: "Patch a broken container and escape the build trap.",
    badge: "Container Crafter",
    rewardXp: 160,
    difficulty: "Intermediate",
    icon: Boxes,
    lessons: ["Containers package an app and its dependencies.", "Ports must line up inside and outside the container.", "Images should stay reproducible."],
    bossChallenge: "Fix a broken image and explain why it failed.",
    gameKey: "docker-escape",
  },
  {
    id: "networking-dns",
    title: "Networking & DNS",
    theme: "Routing, records, latency",
    description: "Route packets quickly by matching DNS records to destinations.",
    badge: "DNS Ranger",
    rewardXp: 145,
    difficulty: "Intermediate",
    icon: Wifi,
    lessons: ["A records point names at IP addresses.", "Caching speeds repeated lookups.", "TTL controls how long entries stay fresh."],
    bossChallenge: "Match the right record type to the traffic pattern.",
    gameKey: "dns-rush",
  },
  {
    id: "databases",
    title: "Databases",
    theme: "Storage, queries, indexing",
    description: "Design and tune data access for speed, correctness, and scale.",
    badge: "Query Tuner",
    rewardXp: 155,
    difficulty: "Intermediate",
    icon: Database,
    lessons: ["Relational databases use tables and joins.", "Indexes speed targeted reads.", "Slow queries reveal missing data design choices."],
    bossChallenge: "Cut a slow query down without breaking correctness.",
    gameKey: "build-the-cloud",
  },
  {
    id: "load-balancing",
    title: "Load Balancing & Scaling",
    theme: "Elasticity, failover, capacity",
    description: "Scale out before the server queue becomes a crash loop.",
    badge: "Scale Sentinel",
    rewardXp: 180,
    difficulty: "Intermediate",
    icon: Network,
    lessons: ["Horizontal scaling adds more instances.", "Auto-scaling follows demand.", "A load balancer keeps one node from getting overloaded."],
    bossChallenge: "Stay online through three traffic waves.",
    gameKey: "server-defender",
  },
  {
    id: "cloud-storage",
    title: "Cloud Storage",
    theme: "Redundancy, tiers, durability",
    description: "Place data in the right storage class and protect it with redundancy.",
    badge: "Storage Keeper",
    rewardXp: 150,
    difficulty: "Intermediate",
    icon: Layers3,
    lessons: ["Object storage is durable and scalable.", "Access tiers trade cost for speed.", "Redundancy protects against loss."],
    bossChallenge: "Choose storage redundancy that matches the workload.",
  },
  {
    id: "kubernetes",
    title: "Kubernetes",
    theme: "Pods, services, replicas",
    description: "Deploy workloads, recover from crashes, and keep the cluster healthy.",
    badge: "Cluster Commander",
    rewardXp: 190,
    difficulty: "Advanced",
    icon: Cloud,
    lessons: ["Pods run containers.", "Services expose workloads.", "Replica counts keep apps available."],
    bossChallenge: "Recover a broken deployment without downtime.",
    gameKey: "kubernetes-commander",
  },
  {
    id: "devops-cicd",
    title: "DevOps CI/CD",
    theme: "Builds, tests, deploys",
    description: "Wire the pipeline so code moves safely from commit to production.",
    badge: "Pipeline Pilot",
    rewardXp: 175,
    difficulty: "Advanced",
    icon: GitBranch,
    lessons: ["CI catches problems early.", "CD automates delivery.", "Checks and gates reduce risky releases."],
    bossChallenge: "Reorder a broken pipeline and make the release green.",
    gameKey: "pipeline-runner",
  },
  {
    id: "security-iam",
    title: "Security & IAM",
    theme: "Roles, policies, least privilege",
    description: "Lock down access while keeping the right people productive.",
    badge: "Shield Operator",
    rewardXp: 170,
    difficulty: "Advanced",
    icon: ShieldCheck,
    lessons: ["Least privilege reduces blast radius.", "Roles should be narrower than admin.", "Identity is part of the security boundary."],
    bossChallenge: "Pick the smallest set of permissions that still works.",
  },
  {
    id: "monitoring",
    title: "Monitoring & Observability",
    theme: "Logs, metrics, traces",
    description: "Read the signals and catch problems before users do.",
    badge: "Signal Seer",
    rewardXp: 180,
    difficulty: "Advanced",
    icon: Radar,
    lessons: ["Metrics show trends.", "Logs explain what happened.", "Alerts should be actionable."],
    bossChallenge: "Find the root cause from a noisy dashboard.",
  },
];

const leaderboard = [
  { userName: "CloudPilot", score: 1450, rank: 1, gameId: "server-defender" },
  { userName: "PacketNinja", score: 1320, rank: 2, gameId: "dns-rush" },
  { userName: "KubeKnight", score: 1240, rank: 3, gameId: "kubernetes-commander" },
  { userName: "You", score: DEFAULT_USER.xp, rank: 4, gameId: "cloud-computing" },
];

const loadProgress = (): CloudProgress => {
  if (typeof window === "undefined") return DEFAULT_USER;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_USER;

  try {
    const parsed = JSON.parse(raw) as Partial<CloudProgress>;
    return {
      ...DEFAULT_USER,
      ...parsed,
      completedWorlds: parsed.completedWorlds ?? DEFAULT_USER.completedWorlds,
      badges: parsed.badges ?? DEFAULT_USER.badges,
      gamesPlayed: parsed.gamesPlayed ?? DEFAULT_USER.gamesPlayed,
    };
  } catch {
    return DEFAULT_USER;
  }
};

const ringMetrics = (value: number, size = 116, stroke = 10) => {
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - progress / 100);
  return { size, stroke, radius, circumference, offset, progress };
};

const CloudComputing = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<CloudProgress>(() => loadProgress());
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId>(() => worlds[Math.min(loadProgress().completedWorlds.length, worlds.length - 1)]?.id ?? worlds[0].id);
  const [banner, setBanner] = useState("Unlock the cloud worlds in order to climb the map.");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    if (user?.id && progress.userId !== user.id) {
      setProgress((current) => ({ ...current, userId: user.id }));
    }
  }, [progress.userId, user?.id]);

  const profileName = user?.email?.split("@")[0] ?? "Cloud Explorer";
  const selectedWorld = useMemo(() => worlds.find((world) => world.id === selectedWorldId) ?? worlds[0], [selectedWorldId]);
  const selectedIndex = worlds.findIndex((world) => world.id === selectedWorld.id);
  const highestUnlockedIndex = Math.min(progress.completedWorlds.length, worlds.length - 1);
  const isUnlocked = selectedIndex <= highestUnlockedIndex;
  const levelProgress = progress.xp % 250;
  const nextLevelXp = 250;
  const overallCompletion = Math.round((progress.completedWorlds.length / worlds.length) * 100);
  const milestoneBadgeCount = progress.badges.length;
  const rankLabel = progress.level >= 10 ? "Cloud Architect" : progress.level >= 7 ? "Platform Captain" : "Rising Engineer";
  const profileRing = ringMetrics((levelProgress / nextLevelXp) * 100, 132, 10);

  const updateGameHistory = (gameId: string, score: number) => {
    setProgress((current) => {
      const existing = current.gamesPlayed[gameId] ?? { bestScore: 0, attempts: 0 };
      return {
        ...current,
        gamesPlayed: {
          ...current.gamesPlayed,
          [gameId]: {
            bestScore: Math.max(existing.bestScore, score),
            attempts: existing.attempts + 1,
          },
        },
      };
    });
  };

  const trackEvent = (name: string, details: Record<string, unknown>) => {
    console.info(`[cloud] ${name}`, details);
  };

  const completeWorld = (worldId: WorldId, xpAward: number, score: number, gameId?: GameKey) => {
    const worldIndex = worlds.findIndex((world) => world.id === worldId);
    if (worldIndex !== progress.completedWorlds.length || progress.completedWorlds.includes(worldId)) {
      toast({ title: "Locked", description: "Finish the previous world before claiming this checkpoint." });
      return;
    }

    updateGameHistory(gameId ?? `world-${worldId}`, score);

    setProgress((current) => {
      const badgeSet = new Set([...current.badges, worlds[worldIndex].badge]);
      const completedWorlds = [...current.completedWorlds, worldId];

      if (completedWorlds.length >= 3) badgeSet.add("Momentum Builder");
      if (completedWorlds.length >= 6) badgeSet.add("Cloud Explorer");
      if (completedWorlds.length === worlds.length) badgeSet.add("Cloud Champion");

      return {
        ...current,
        xp: current.xp + xpAward,
        level: Math.floor((current.xp + xpAward) / 250) + 1,
        currentStreak: current.currentStreak + 1,
        completedWorlds,
        badges: Array.from(badgeSet),
      };
    });

    trackEvent("world_unlocked", { worldId, xpAward, score, userId: progress.userId });
    setBanner(`${worlds[worldIndex].title} cleared. +${xpAward} XP earned.`);
    toast({ title: "+XP earned", description: `${worlds[worldIndex].title} cleared and ${xpAward} XP added.` });
  };

  const renderGame = () => {
    switch (selectedWorld.gameKey) {
      case "server-defender":
        return <ServerDefenderGame rewardXp={selectedWorld.rewardXp} onComplete={(score) => completeWorld(selectedWorld.id, selectedWorld.rewardXp, score, selectedWorld.gameKey)} />;
      case "build-the-cloud":
        return <BuildTheCloudGame rewardXp={selectedWorld.rewardXp} onComplete={(score) => completeWorld(selectedWorld.id, selectedWorld.rewardXp, score, selectedWorld.gameKey)} />;
      case "docker-escape":
        return <DockerEscapeGame rewardXp={selectedWorld.rewardXp} onComplete={(score) => completeWorld(selectedWorld.id, selectedWorld.rewardXp, score, selectedWorld.gameKey)} />;
      case "dns-rush":
        return <DnsRushGame rewardXp={selectedWorld.rewardXp} onComplete={(score) => completeWorld(selectedWorld.id, selectedWorld.rewardXp, score, selectedWorld.gameKey)} />;
      case "pipeline-runner":
        return <PipelineRunnerGame rewardXp={selectedWorld.rewardXp} onComplete={(score) => completeWorld(selectedWorld.id, selectedWorld.rewardXp, score, selectedWorld.gameKey)} />;
      case "kubernetes-commander":
        return <KubernetesCommanderGame rewardXp={selectedWorld.rewardXp} onComplete={(score) => completeWorld(selectedWorld.id, selectedWorld.rewardXp, score, selectedWorld.gameKey)} />;
      default:
        return <BossChallengeCard world={selectedWorld} onComplete={() => completeWorld(selectedWorld.id, selectedWorld.rewardXp, 100)} />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <ParticleBackground />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(77,208,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.85),rgba(2,6,23,0.96))]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-display font-bold tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <ThemeToggle />
        </div>

        <section className="glass-panel border border-border/60 bg-background/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-400/25">Cloud Module</Badge>
                <Badge className="bg-white/10 text-foreground border-white/10">{rankLabel}</Badge>
                <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-400/25">{overallCompletion}% complete</Badge>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground text-glow-cyan">
                Cloud Computing Learning Hub
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                Advance through cloud worlds in order, earn XP and badges, and unlock the next mission only after you clear the current one.
              </p>
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"><Clock3 className="w-4 h-4 text-cyan-300" /> Streak {progress.currentStreak} days</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"><Medal className="w-4 h-4 text-amber-300" /> {milestoneBadgeCount} badges</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"><Trophy className="w-4 h-4 text-violet-300" /> Level {progress.level}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ProfileRing metrics={profileRing} label={`Lv ${progress.level}`} sublabel={`${levelProgress}/${nextLevelXp} XP`} />
              <div className="space-y-2 text-right">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Player</p>
                <p className="font-display text-2xl sm:text-3xl font-black text-foreground">{profileName}</p>
                <p className="text-sm text-muted-foreground">Rank {rankLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80 mb-1">Daily briefing</p>
              <p className="font-semibold text-cyan-50">{banner}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/10 text-foreground border-white/10">{progress.completedWorlds.length} missions complete</Badge>
              <Badge className="bg-white/10 text-foreground border-white/10">{Object.keys(progress.gamesPlayed).length} games tracked</Badge>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <Card className="glass-panel border-border/60 bg-background/70 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">Learning map</p>
                    <h2 className="font-display text-2xl font-black text-foreground">Sequential cloud worlds</h2>
                  </div>
                  <Badge className="bg-neon-cyan/15 text-neon-cyan border-neon-cyan/20">{overallCompletion}% unlocked</Badge>
                </div>

                <div className="space-y-4">
                  {worlds.map((world, index) => {
                    const completed = progress.completedWorlds.includes(world.id);
                    const unlocked = index <= highestUnlockedIndex;
                    const selected = selectedWorld.id === world.id;
                    const WorldIcon = world.icon;

                    return (
                      <button
                        key={world.id}
                        type="button"
                        onClick={() => {
                          if (!unlocked) {
                            toast({ title: "World locked", description: "Finish the previous world to unlock this one." });
                            return;
                          }
                          setSelectedWorldId(world.id);
                          trackEvent("navigate_to_cloud_hub", { worldId: world.id });
                        }}
                        className={`w-full text-left rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${selected ? "border-cyan-400/50 bg-cyan-500/10 shadow-lg shadow-cyan-950/20" : "border-white/10 bg-white/5 hover:bg-white/7"} ${!unlocked ? "opacity-65" : "hover:-translate-y-0.5"}`}
                        aria-label={`Open ${world.title}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${completed ? "bg-emerald-500/15 text-emerald-300" : unlocked ? "bg-cyan-500/15 text-cyan-200" : "bg-white/5 text-muted-foreground"}`}>
                            {completed ? <CheckCircle2 className="w-6 h-6" /> : unlocked ? <WorldIcon className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">{world.title}</h3>
                              <Badge className="bg-white/10 text-foreground border-white/10">{world.difficulty}</Badge>
                              {completed && <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-400/20">Done</Badge>}
                              {!completed && unlocked && <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-400/20">Ready</Badge>}
                              {!unlocked && <Badge className="bg-white/10 text-muted-foreground border-white/10">Locked</Badge>}
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1">{world.theme} · {world.description}</p>
                            <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              <span>{world.badge}</span>
                              <ChevronRight className="w-4 h-4" />
                              <span>{world.rewardXp} XP</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/60 bg-background/70 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-5 sm:p-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">World detail</p>
                  <h2 className="font-display text-2xl font-black text-foreground">{selectedWorld.title}</h2>
                  <p className="text-muted-foreground mt-2">{selectedWorld.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-400/20">{selectedWorld.theme}</Badge>
                    <Badge className="bg-white/10 text-foreground border-white/10">Reward {selectedWorld.rewardXp} XP</Badge>
                    <Badge className="bg-violet-500/15 text-violet-200 border-violet-400/20">{selectedWorld.difficulty}</Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><BookOpen className="w-4 h-4 text-cyan-300" /> Lessons</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {selectedWorld.lessons.map((lesson) => (
                      <li key={lesson} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300" />{lesson}</li>
                    ))}
                  </ul>
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-50">
                    <span className="font-semibold">Boss challenge: </span>{selectedWorld.bossChallenge}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <Card className="glass-panel border-border/60 bg-background/70 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">Player profile</p>
                    <h2 className="font-display text-2xl font-black text-foreground">{profileName}</h2>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-400/20">Level {progress.level}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile icon={BarChart3} label="Total XP" value={progress.xp} accent="text-cyan-300" />
                  <StatTile icon={Target} label="Rank" value={rankLabel} accent="text-violet-300" />
                  <StatTile icon={Zap} label="Streak" value={`${progress.currentStreak} days`} accent="text-emerald-300" />
                  <StatTile icon={BadgeCheck} label="Badges" value={progress.badges.length} accent="text-amber-300" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <span>Next level</span>
                    <span>{levelProgress}/{nextLevelXp} XP</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 transition-all" style={{ width: `${(levelProgress / nextLevelXp) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"><Star className="w-4 h-4 text-amber-300" /> Badges</div>
                  <div className="flex flex-wrap gap-2">
                    {progress.badges.map((badgeName) => (
                      <Badge key={badgeName} className="bg-white/10 text-foreground border-white/10">{badgeName}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/60 bg-background/70 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">Weekly leaderboard</p>
                    <h2 className="font-display text-2xl font-black text-foreground">Cloud ranks</h2>
                  </div>
                  <Badge className="bg-white/10 text-foreground border-white/10">Telemetry ready</Badge>
                </div>

                <div className="space-y-3">
                  {leaderboard.map((entry) => (
                    <div key={entry.userName} className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${entry.userName === "You" ? "border-cyan-400/30 bg-cyan-500/10" : "border-white/10 bg-white/5"}`}>
                      <div>
                        <p className="font-semibold text-foreground">#{entry.rank} {entry.userName}</p>
                        <p className="text-xs text-muted-foreground">{entry.gameId}</p>
                      </div>
                      <p className="font-display text-lg font-black text-foreground">{entry.score}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="glass-panel border-border/60 bg-background/70 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">Mini-game</p>
                  <h2 className="font-display text-2xl font-black text-foreground">{selectedWorld.gameKey ? "Active mission" : "Boss challenge"}</h2>
                </div>
                <Badge className="bg-white/10 text-foreground border-white/10">{isUnlocked ? "Playable" : "Locked"}</Badge>
              </div>

              <div className={!isUnlocked ? "opacity-70 pointer-events-none" : ""}>
                {renderGame()}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/60 bg-background/70 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Rocket className="w-4 h-4 text-cyan-300" /> Progression path</div>
              <div className="space-y-3">
                {worlds.slice(0, 6).map((world, index) => {
                  const completed = progress.completedWorlds.includes(world.id);
                  const unlocked = index <= highestUnlockedIndex;
                  return (
                    <div key={world.id} className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${selectedWorld.id === world.id ? "border-cyan-400/30 bg-cyan-500/10" : "border-white/10 bg-white/5"}`}>
                      <div>
                        <p className="font-semibold text-foreground">{world.title}</p>
                        <p className="text-xs text-muted-foreground">{world.theme}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {completed ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : unlocked ? <Play className="w-4 h-4 text-cyan-300" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

const ProfileRing = ({ metrics, label, sublabel }: { metrics: ReturnType<typeof ringMetrics>; label: string; sublabel: string }) => {
  return (
    <div className="relative w-[132px] h-[132px] shrink-0">
      <svg viewBox={`0 0 ${metrics.size} ${metrics.size}`} className="w-full h-full -rotate-90">
        <circle cx={metrics.size / 2} cy={metrics.size / 2} r={metrics.radius} stroke="rgba(255,255,255,0.1)" strokeWidth={metrics.stroke} fill="none" />
        <circle
          cx={metrics.size / 2}
          cy={metrics.size / 2}
          r={metrics.radius}
          stroke="url(#cloud-profile-ring)"
          strokeWidth={metrics.stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={metrics.circumference}
          strokeDashoffset={metrics.offset}
        />
        <defs>
          <linearGradient id="cloud-profile-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4dd0ff" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-3xl font-black text-foreground">{label}</span>
        <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mt-1">{sublabel}</span>
      </div>
    </div>
  );
};

const StatTile = ({ icon: Icon, label, value, accent }: { icon: typeof BarChart3; label: string; value: string | number; accent: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
    <div className={`inline-flex rounded-xl p-2 bg-white/5 ${accent}`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-3">{label}</p>
    <p className="font-display text-lg sm:text-xl font-black text-foreground mt-1">{value}</p>
  </div>
);

const FinishButton = ({ onClick, label = "Mark Complete" }: { onClick: () => void; label?: string }) => (
  <Button onClick={onClick} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-semibold">
    {label}
  </Button>
);

const GameShell = ({
  title,
  objective,
  rewardXp,
  children,
}: {
  title: string;
  objective: string;
  rewardXp: number;
  children: ReactNode;
}) => (
  <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:p-5 space-y-4">
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h3 className="font-display text-xl font-black text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{objective}</p>
      </div>
      <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-400/20">+{rewardXp} XP</Badge>
    </div>
    {children}
  </div>
);

const ServerDefenderGame = ({ rewardXp, onComplete }: { rewardXp: number; onComplete: (score: number) => void }) => {
  const [servers, setServers] = useState(2);
  const [loadBalancer, setLoadBalancer] = useState(true);
  const [autoScaling, setAutoScaling] = useState(false);
  const [message, setMessage] = useState("Build resilience before the wave hits.");
  const [done, setDone] = useState(false);

  const score = servers * 30 + (loadBalancer ? 45 : 0) + (autoScaling ? 55 : 0);

  const launchWave = () => {
    if (servers >= 3 && loadBalancer && autoScaling) {
      setDone(true);
      setMessage("Traffic survived. The cluster scaled cleanly.");
      onComplete(score + 40);
      return;
    }

    if (!loadBalancer) setMessage("Add a load balancer to spread incoming requests.");
    else if (!autoScaling) setMessage("Auto-scaling is off. Add capacity before CPU spikes hit 100%.");
    else setMessage("Add one more server so the traffic wave has enough room to breathe.");
  };

  return (
    <GameShell title="Server Defender" objective="Keep web servers healthy while requests spike." rewardXp={rewardXp}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {["Traffic", "CPU", "Health"].map((label, index) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                <p className="font-display text-xl font-black text-foreground mt-2">{index === 0 ? 8 + servers * 3 : index === 1 ? 54 + servers * 8 : 100 - Math.max(0, 3 - servers) * 25}%</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setServers((value) => Math.min(6, value + 1))} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-colors">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Instances</p>
              <p className="font-display text-2xl font-black text-foreground mt-2">{servers}</p>
              <p className="text-xs text-muted-foreground mt-1">Add more capacity.</p>
            </button>
            <button type="button" onClick={() => setLoadBalancer((value) => !value)} className={`rounded-2xl border p-4 text-left transition-colors ${loadBalancer ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Load balancer</p>
              <p className="font-display text-2xl font-black text-foreground mt-2">{loadBalancer ? "On" : "Off"}</p>
            </button>
            <button type="button" onClick={() => setAutoScaling((value) => !value)} className={`rounded-2xl border p-4 text-left transition-colors ${autoScaling ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Auto-scaling</p>
              <p className="font-display text-2xl font-black text-foreground mt-2">{autoScaling ? "On" : "Off"}</p>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={launchWave} disabled={done} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Launch wave</Button>
            <FinishButton onClick={() => { setDone(true); onComplete(score); }} label="Claim XP" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live feedback</p>
          <p className="text-sm text-foreground">{message}</p>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${Math.min(100, score)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Hint: spread traffic, then keep capacity elastic.</p>
        </div>
      </div>
    </GameShell>
  );
};

const BuildTheCloudGame = ({ rewardXp, onComplete }: { rewardXp: number; onComplete: (score: number) => void }) => {
  const required = ["ALB", "EC2", "RDS"];
  const options = ["ALB", "EC2", "RDS", "S3", "Lambda"];
  const [selected, setSelected] = useState<string[]>(["ALB", "EC2"]);
  const [hint, setHint] = useState("Choose a resilient web, app, and database stack.");
  const [done, setDone] = useState(false);

  const toggle = (option: string) => {
    setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  };

  const validate = () => {
    const hasRequired = required.every((item) => selected.includes(item));
    if (hasRequired && selected.length <= 4) {
      setDone(true);
      setHint("Architecture validated. The cloud city has a stable foundation.");
      onComplete(120 + selected.length * 8);
    } else if (!selected.includes("RDS")) {
      setHint("Missing database: the app needs persistent storage.");
    } else if (!selected.includes("ALB")) {
      setHint("Missing load balancer: traffic needs a front door.");
    } else {
      setHint("Trim extra parts and keep the architecture focused.");
    }
  };

  return (
    <GameShell title="Build the Cloud" objective="Assemble a fault-tolerant web architecture." rewardXp={rewardXp}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button key={option} type="button" onClick={() => toggle(option)} className={`rounded-2xl border p-4 text-left transition-all ${active ? "border-cyan-400/30 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Component</p>
                <p className="font-display text-lg font-bold text-foreground mt-2">{option}</p>
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Selected stack</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((item) => <Badge key={item} className="bg-cyan-500/15 text-cyan-200 border-cyan-400/20">{item}</Badge>)}
          </div>
          <p className="text-sm text-muted-foreground">{hint}</p>
          <Button onClick={validate} disabled={done} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Validate design</Button>
        </div>
      </div>
    </GameShell>
  );
};

const DockerEscapeGame = ({ rewardXp, onComplete }: { rewardXp: number; onComplete: (score: number) => void }) => {
  const fixes = ["Expose port 3000", "Set PORT=3000", "npm install", "Add CMD" as const];
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("The container is broken. Read the clues and patch the image.");
  const [done, setDone] = useState(false);

  const toggle = (fix: string) => setSelected((current) => current.includes(fix) ? current.filter((item) => item !== fix) : [...current, fix]);

  const testEscape = () => {
    const pass = selected.includes("Expose port 3000") && selected.includes("Set PORT=3000");
    if (pass) {
      setDone(true);
      setMessage("Container escaped. Port mapping and environment variables are fixed.");
      onComplete(150 + selected.length * 5);
    } else {
      setMessage("Hint: the service listens on 3000, and the runtime needs the matching PORT variable.");
    }
  };

  return (
    <GameShell title="Docker Escape" objective="Repair the container so the app can start and listen on the right port." rewardXp={rewardXp}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-cyan-200 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">Terminal clues</p>
          <p>$ docker run app</p>
          <p>Error: container starts, but the app is unreachable.</p>
          <p>Service listens on port 3000 inside the container.</p>
          <p>Missing: correct port exposure and runtime PORT variable.</p>
        </div>
        <div className="space-y-3">
          {fixes.map((fix) => (
            <button key={fix} type="button" onClick={() => toggle(fix)} className={`w-full rounded-2xl border p-4 text-left transition-all ${selected.includes(fix) ? "border-cyan-400/30 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
              <p className="font-semibold text-foreground">{fix}</p>
            </button>
          ))}
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button onClick={testEscape} disabled={done} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Run container</Button>
        </div>
      </div>
    </GameShell>
  );
};

const DnsRushGame = ({ rewardXp, onComplete }: { rewardXp: number; onComplete: (score: number) => void }) => {
  const entries = [
    { domain: "api.cloudquest.dev", answer: "10.0.1.12" },
    { domain: "storage.cloudquest.dev", answer: "10.0.2.24" },
    { domain: "portal.cloudquest.dev", answer: "10.0.0.5" },
  ];
  const options = ["10.0.0.5", "10.0.1.12", "10.0.2.24", "10.0.4.8"];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Match each domain to the correct IP before packets bounce.");
  const [done, setDone] = useState(false);

  const validate = () => {
    const correct = entries.every((entry) => answers[entry.domain] === entry.answer);
    if (correct) {
      setDone(true);
      setMessage("Routing complete. DNS records are clean.");
      onComplete(140 + Object.keys(answers).length * 5);
      return;
    }

    setMessage("Check the A records. One domain is still pointing at the wrong server.");
  };

  return (
    <GameShell title="DNS Rush" objective="Route packets by matching domains to IP addresses." rewardXp={rewardXp}>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.domain} className="grid gap-3 md:grid-cols-[1fr_220px] items-center rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold text-foreground">{entry.domain}</p>
            <select
              value={answers[entry.domain] ?? ""}
              onChange={(event) => setAnswers((current) => ({ ...current, [entry.domain]: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-foreground outline-none"
            >
              <option value="">Choose IP</option>
              {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button onClick={validate} disabled={done} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Submit records</Button>
      </div>
    </GameShell>
  );
};

const PipelineRunnerGame = ({ rewardXp, onComplete }: { rewardXp: number; onComplete: (score: number) => void }) => {
  const stages = ["Commit", "Build", "Test", "Deploy", "Monitor"];
  const [pipeline, setPipeline] = useState<string[]>([]);
  const [message, setMessage] = useState("Order the pipeline from commit to monitoring.");
  const [done, setDone] = useState(false);

  const addStage = (stage: string) => {
    if (pipeline.includes(stage) || pipeline.length >= stages.length) return;
    setPipeline((current) => [...current, stage]);
  };

  const removeLast = () => setPipeline((current) => current.slice(0, -1));

  const runPipeline = () => {
    const correct = stages.every((stage, index) => pipeline[index] === stage);
    if (correct) {
      setDone(true);
      setMessage("Pipeline passed. Build, test, deploy, and monitor are in order.");
      onComplete(170 + pipeline.length * 5);
      return;
    }

    setMessage("Hint: commits happen before builds, and monitoring comes last.");
  };

  return (
    <GameShell title="Pipeline Runner" objective="Arrange a safe delivery pipeline from commit to production." rewardXp={rewardXp}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stages.map((stage) => (
              <button key={stage} type="button" onClick={() => addStage(stage)} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-colors">
                <p className="font-semibold text-foreground">{stage}</p>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {pipeline.map((stage, index) => <Badge key={`${stage}-${index}`} className="bg-cyan-500/15 text-cyan-200 border-cyan-400/20">{index + 1}. {stage}</Badge>)}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={runPipeline} disabled={done} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Run pipeline</Button>
            <Button variant="outline" onClick={removeLast}>Remove last</Button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Build log</p>
          <p className="text-sm text-foreground">{message}</p>
          <div className="space-y-2 text-xs text-muted-foreground font-mono">
            <p>commit → {pipeline[0] ?? "?"}</p>
            <p>build → {pipeline[1] ?? "?"}</p>
            <p>test → {pipeline[2] ?? "?"}</p>
            <p>deploy → {pipeline[3] ?? "?"}</p>
            <p>monitor → {pipeline[4] ?? "?"}</p>
          </div>
        </div>
      </div>
    </GameShell>
  );
};

const KubernetesCommanderGame = ({ rewardXp, onComplete }: { rewardXp: number; onComplete: (score: number) => void }) => {
  const [replicas, setReplicas] = useState(2);
  const [serviceType, setServiceType] = useState("ClusterIP");
  const [strategy, setStrategy] = useState("Recreate");
  const [message, setMessage] = useState("Make the cluster resilient and reachable.");
  const [done, setDone] = useState(false);

  const deploy = () => {
    const pass = replicas >= 3 && serviceType === "LoadBalancer" && strategy === "Rolling Update";
    if (pass) {
      setDone(true);
      setMessage("Cluster stable. The service is reachable and the rollout is safe.");
      onComplete(190 + replicas * 5);
      return;
    }

    setMessage("Hint: add more replicas, expose the service, and switch to rolling updates.");
  };

  return (
    <GameShell title="Kubernetes Commander" objective="Deploy a healthy cluster with the right replicas and service type." rewardXp={rewardXp}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setReplicas((value) => Math.min(8, value + 1))} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-colors">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Replicas</p>
              <p className="font-display text-2xl font-black text-foreground mt-2">{replicas}</p>
            </button>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Service type</p>
              <select value={serviceType} onChange={(event) => setServiceType(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-foreground outline-none">
                <option>ClusterIP</option>
                <option>NodePort</option>
                <option>LoadBalancer</option>
              </select>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Rollout strategy</p>
              <div className="flex flex-wrap gap-2">
                { ["Recreate", "Rolling Update"].map((option) => (
                  <button key={option} type="button" onClick={() => setStrategy(option)} className={`rounded-full border px-3 py-2 text-sm transition-colors ${strategy === option ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100" : "border-white/10 bg-white/5 text-foreground hover:bg-white/10"}`}>
                    {option}
                  </button>
                )) }
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={deploy} disabled={done} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Deploy cluster</Button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cluster status</p>
          <p className="text-sm text-foreground">{message}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-muted-foreground">Pods</p><p className="font-display text-xl font-black text-foreground">{replicas}</p></div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-muted-foreground">Service</p><p className="font-display text-xl font-black text-foreground">{serviceType}</p></div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-muted-foreground">Strategy</p><p className="font-display text-xl font-black text-foreground">{strategy.startsWith("Roll") ? "Safe" : "Risky"}</p></div>
          </div>
        </div>
      </div>
    </GameShell>
  );
};

const BossChallengeCard = ({ world, onComplete }: { world: World; onComplete: () => void }) => (
  <GameShell title={`${world.title} Boss Challenge`} objective={world.bossChallenge} rewardXp={world.rewardXp}>
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <p className="text-sm text-muted-foreground">This world currently ships as a guided challenge. Clear the mission card above to unlock the boss checkpoint.</p>
      <Button onClick={onComplete} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Clear boss challenge</Button>
    </div>
  </GameShell>
);

export default CloudComputing;