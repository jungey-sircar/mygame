import { useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2, ChevronRight, CircleAlert, Database, LineChart as LineChartIcon, Medal, Star, Trophy } from "lucide-react";

type ViewKey = "lesson" | "quiz" | "dashboard" | "achievements";
type MetricKey = "revenue" | "orders" | "margin";

type Lesson = {
  id: number;
  title: string;
  objective: string;
  summary: string;
  takeaway: string;
};

type Question = {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type SalesRecord = {
  month: string;
  region: string;
  revenue: number;
  orders: number;
  margin: number;
};

const lessons: Lesson[] = [
  {
    id: 1,
    title: "What BI Does",
    objective: "Define BI as the process of turning raw business data into decisions.",
    summary: "BI helps teams collect, clean, analyze, and visualize data so they can act with confidence.",
    takeaway: "Good BI is not just charts. It is data plus context plus action.",
  },
  {
    id: 2,
    title: "Where the Data Comes From",
    objective: "Recognize common business sources like CRM, sales, marketing, and support systems.",
    summary: "A BI workflow usually combines multiple sources, then prepares them into a single trusted view.",
    takeaway: "The same customer can appear in more than one system, so cleaning and joining data matters.",
  },
  {
    id: 3,
    title: "How Teams Read Dashboards",
    objective: "Use KPIs, filters, and trends to answer a business question.",
    summary: "Dashboards show what changed, where it changed, and whether it needs action.",
    takeaway: "A strong dashboard answers a question fast instead of showing every metric at once.",
  },
];

const quizQuestions: Question[] = [
  {
    prompt: "Which step usually happens before a BI chart is trusted?",
    options: ["Guessing the trend", "Cleaning and modeling the data", "Changing the colors", "Removing all filters"],
    answerIndex: 1,
    explanation: "Raw data often needs cleaning and modeling so the chart reflects the real business story.",
  },
  {
    prompt: "What does a dashboard mainly help people do?",
    options: ["Hide KPIs", "Explore metrics and make decisions", "Replace all meetings", "Predict the weather"],
    answerIndex: 1,
    explanation: "Dashboards make it easier to explore KPIs, trends, and exceptions at a glance.",
  },
  {
    prompt: "If revenue drops in one region, what is the best BI reaction?",
    options: ["Ignore it", "Ask a follow-up business question", "Delete the chart", "Assume it is impossible"],
    answerIndex: 1,
    explanation: "BI is about turning a signal into a useful action or investigation.",
  },
];

const salesData: SalesRecord[] = [
  { month: "Jan", region: "North", revenue: 120, orders: 44, margin: 34 },
  { month: "Feb", region: "North", revenue: 140, orders: 48, margin: 37 },
  { month: "Mar", region: "North", revenue: 155, orders: 52, margin: 39 },
  { month: "Apr", region: "North", revenue: 168, orders: 55, margin: 41 },
  { month: "Jan", region: "South", revenue: 98, orders: 36, margin: 24 },
  { month: "Feb", region: "South", revenue: 112, orders: 38, margin: 27 },
  { month: "Mar", region: "South", revenue: 121, orders: 39, margin: 29 },
  { month: "Apr", region: "South", revenue: 139, orders: 42, margin: 32 },
  { month: "Jan", region: "West", revenue: 132, orders: 41, margin: 31 },
  { month: "Feb", region: "West", revenue: 146, orders: 45, margin: 35 },
  { month: "Mar", region: "West", revenue: 160, orders: 49, margin: 38 },
  { month: "Apr", region: "West", revenue: 174, orders: 53, margin: 40 },
];

const regions = ["All regions", "North", "South", "West"] as const;
const metricOptions: Array<{ key: MetricKey; label: string; color: string }> = [
  { key: "revenue", label: "Revenue", color: "#22d3ee" },
  { key: "orders", label: "Orders", color: "#a855f7" },
  { key: "margin", label: "Margin", color: "#f472b6" },
];

const metricLabel: Record<MetricKey, string> = {
  revenue: "Revenue",
  orders: "Orders",
  margin: "Margin",
};

const lessonBadgeColors = ["bg-cyan-500/20 text-cyan-300", "bg-violet-500/20 text-violet-300", "bg-pink-500/20 text-pink-300"];
const gremlinButtons = ["Hide filter", "Export to CSV", "Blame Excel"];
const gremlinWins = [
  "Gremlin squashed. The dashboard is emotionally stable again.",
  "Nice shot. The KPI goblin dropped its coffee.",
  "Victory. The spreadsheet spirits have been appeased.",
];
const gremlinFails = [
  "Missed it. The gremlin hid in a pivot table.",
  "Nope. It escaped through a suspicious slicer.",
  "Close, but the goblin is still freelancing.",
];

const BusinessIntelligence = () => {
  const [view, setView] = useState<ViewKey>("lesson");
  const [showIntro, setShowIntro] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<number[]>([]);
  const [region, setRegion] = useState<(typeof regions)[number]>("All regions");
  const [metric, setMetric] = useState<MetricKey>("revenue");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [insightTracked, setInsightTracked] = useState(false);
  const [gremlinTarget, setGremlinTarget] = useState(0);
  const [gremlinScore, setGremlinScore] = useState(0);
  const [gremlinLine, setGremlinLine] = useState("The spreadsheet gremlin has escaped. Catch it before it renames your columns.");

  const completedLessonSet = useMemo(() => new Set(completedLessons), [completedLessons]);
  const submittedQuestionSet = useMemo(() => new Set(submittedQuestions), [submittedQuestions]);

  const filteredRows = useMemo(() => {
    return salesData.filter((row) => region === "All regions" || row.region === region);
  }, [region]);

  const chartData = useMemo(() => {
    const aggregate = new Map<string, { month: string; value: number }>();

    for (const row of filteredRows) {
      const current = aggregate.get(row.month) ?? { month: row.month, value: 0 };
      current.value += row[metric];
      aggregate.set(row.month, current);
    }

    return ["Jan", "Feb", "Mar", "Apr"].map((month) => aggregate.get(month) ?? { month, value: 0 });
  }, [filteredRows, metric]);

  const totalMetric = useMemo(() => filteredRows.reduce((sum, row) => sum + row[metric], 0), [filteredRows, metric]);

  const topRegion = useMemo(() => {
    const regionTotals = new Map<string, number>();
    for (const row of salesData) {
      regionTotals.set(row.region, (regionTotals.get(row.region) ?? 0) + row.revenue);
    }

    return Array.from(regionTotals.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "North";
  }, []);

  const quizScore = useMemo(() => {
    if (quizQuestions.length === 0) return 0;
    const correctAnswers = quizQuestions.reduce((count, question, index) => count + (selectedAnswers[index] === question.answerIndex ? 1 : 0), 0);
    return Math.round((correctAnswers / quizQuestions.length) * 100);
  }, [selectedAnswers]);

  const earnedBadges = useMemo(() => {
    const badges = [
      { label: "Data Detective", earned: completedLessonSet.size >= 1, detail: "Finish one lesson." },
      { label: "Dashboard Creator", earned: region !== "All regions" || metric !== "revenue" || chartType !== "bar", detail: "Interact with the dashboard." },
      { label: "Quiz Closer", earned: submittedQuestionSet.size === quizQuestions.length, detail: "Answer every quiz question." },
      { label: "BI Master", earned: completedLessonSet.size === lessons.length && quizScore >= 80, detail: "Complete the full card with a strong score." },
    ];

    return badges;
  }, [chartType, completedLessonSet.size, metric, quizScore, region, submittedQuestionSet.size]);

  const activeLesson = lessons[currentLesson];
  const activeQuestion = quizQuestions[currentQuestion];

  const completeLesson = () => {
    if (!completedLessonSet.has(activeLesson.id)) {
      setCompletedLessons((current) => [...current, activeLesson.id]);
    }
  };

  const submitQuestion = () => {
    if (selectedAnswers[currentQuestion] === undefined) return;
    setSubmittedQuestions((current) => (current.includes(currentQuestion) ? current : [...current, currentQuestion]));
  };

  const advanceQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion((value) => value + 1);
    } else {
      setView("dashboard");
    }
  };

  const handleInsight = () => {
    setInsightTracked(true);
  };

  const handleGremlinClick = (index: number) => {
    const isHit = index === gremlinTarget;

    if (isHit) {
      setGremlinScore((current) => current + 1);
      setGremlinLine(gremlinWins[(gremlinScore + index) % gremlinWins.length]);
    } else {
      setGremlinLine(gremlinFails[(gremlinScore + index) % gremlinFails.length]);
    }

    setGremlinTarget((current) => (current + 1 + index) % gremlinButtons.length);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.65),rgba(3,7,18,0.92))]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <section className="glass-panel p-6 sm:p-8 border border-border/60 shadow-2xl shadow-cyan-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <Badge className="w-fit bg-cyan-500/15 text-cyan-200 border-cyan-400/30">New Learning Card</Badge>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Database className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">Business Intelligence Lab</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">Turn raw business data into decisions with lessons, quizzes, dashboards, and unlockable badges.</p>
                </div>
              </div>

              {showIntro && (
                <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4 sm:p-5">
                  <p className="font-semibold text-cyan-100">Welcome, data detective. Learn the BI workflow, answer quiz prompts, and explore a mini dashboard built from sales data.</p>
                  <p className="text-sm text-cyan-100/80 mt-1">Use the view switcher below to move between lessons, quiz, dashboard, and achievements.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={() => setView("lesson")} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                      Start Lesson
                    </Button>
                    <Button variant="outline" onClick={() => setShowIntro(false)} className="border-cyan-400/30 text-cyan-100 hover:bg-cyan-500/10">
                      Skip Intro
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-[360px]">
              <StatCard label="Lessons" value={`${completedLessonSet.size}/${lessons.length}`} icon={<BookOpen className="w-4 h-4" />} />
              <StatCard label="Quiz Score" value={`${quizScore}%`} icon={<Star className="w-4 h-4" />} />
              <StatCard label="Metric" value={metricLabel[metric]} icon={<LineChartIcon className="w-4 h-4" />} />
              <StatCard label="Region" value={region} icon={<Trophy className="w-4 h-4" />} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {([
              ["lesson", "Lessons"],
              ["quiz", "Quiz"],
              ["dashboard", "Dashboard"],
              ["achievements", "Achievements"],
            ] as Array<[ViewKey, string]>).map(([key, label]) => (
              <Button key={key} variant={view === key ? "default" : "outline"} onClick={() => setView(key)} className={view === key ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300" : "border-border/70"}>
                {label}
              </Button>
            ))}
          </div>
        </section>

        <Card className="glass-panel border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Spreadsheet Gremlin Hunt</CardTitle>
                <CardDescription>Click the button that the gremlin is hiding behind. Catch it before it corrupts your dashboard.</CardDescription>
              </div>
              <Badge className="bg-amber-500/15 text-amber-200 border-amber-400/30">Gremlin score: {gremlinScore}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3 text-sm text-muted-foreground">{gremlinLine}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {gremlinButtons.map((label, index) => (
                <Button
                  key={label}
                  type="button"
                  onClick={() => handleGremlinClick(index)}
                  className={index === gremlinTarget ? "bg-amber-400 text-slate-950 hover:bg-amber-300" : "border-border/70 bg-transparent hover:bg-background/50"}
                  variant={index === gremlinTarget ? "default" : "outline"}
                >
                  {label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Tip: the gremlin changes hiding spots after every click. It is not a good employee.</p>
          </CardContent>
        </Card>

        {view === "lesson" && (
          <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card className="glass-panel border-border/60">
              <CardHeader>
                <CardTitle>Lesson Path</CardTitle>
                <CardDescription>Tap a lesson to read the concept, then mark it complete.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setCurrentLesson(index)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${currentLesson === index ? "border-cyan-400/50 bg-cyan-500/10" : "border-border/70 bg-background/30 hover:bg-background/50"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Level {lesson.id}</p>
                        <p className="font-semibold">{lesson.title}</p>
                      </div>
                      {completedLessonSet.has(lesson.id) ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>{activeLesson.title}</CardTitle>
                    <CardDescription>{activeLesson.objective}</CardDescription>
                  </div>
                  <Badge className={lessonBadgeColors[(activeLesson.id - 1) % lessonBadgeColors.length]}>{completedLessonSet.has(activeLesson.id) ? "Completed" : "In Progress"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-border/70 bg-background/40 p-5 space-y-3">
                  <p className="leading-7 text-muted-foreground">{activeLesson.summary}</p>
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <p className="text-sm font-semibold text-cyan-100 uppercase tracking-[0.18em] mb-1">Key takeaway</p>
                    <p className="text-cyan-50">{activeLesson.takeaway}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <InfoPill icon={<Database className="w-4 h-4" />} title="Real data sources" text="CRM, sales, marketing, and support systems all feed BI." />
                  <InfoPill icon={<BookOpen className="w-4 h-4" />} title="Actionable output" text="BI is useful when the report leads to a business decision." />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={completeLesson} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                    Mark Complete
                  </Button>
                  <Button variant="outline" onClick={() => setView("quiz")} className="border-border/70">
                    Go to Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {view === "quiz" && (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="glass-panel border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>Quiz Challenge</CardTitle>
                    <CardDescription>Answer one question at a time and unlock the Quiz Closer badge.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-border/70">Question {currentQuestion + 1} of {quizQuestions.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
                  <p className="text-lg font-semibold mb-4">{activeQuestion.prompt}</p>
                  <div className="grid gap-3">
                    {activeQuestion.options.map((option, optionIndex) => {
                      const isSelected = selectedAnswers[currentQuestion] === optionIndex;
                      const isAnswered = submittedQuestionSet.has(currentQuestion);
                      const isCorrect = optionIndex === activeQuestion.answerIndex;
                      const selectedIsWrong = isAnswered && isSelected && !isCorrect;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSelectedAnswers((current) => ({ ...current, [currentQuestion]: optionIndex }))}
                          className={`rounded-xl border px-4 py-3 text-left transition-all ${
                            isCorrect && isAnswered ? "border-emerald-400/60 bg-emerald-500/10" : selectedIsWrong ? "border-rose-400/60 bg-rose-500/10" : isSelected ? "border-cyan-400/50 bg-cyan-500/10" : "border-border/70 bg-background/40 hover:bg-background/60"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {submittedQuestionSet.has(currentQuestion) && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <p className="font-semibold text-emerald-100 mb-1">Nice work.</p>
                    <p className="text-emerald-50/90">{activeQuestion.explanation}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={submitQuestion} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                    Submit Answer
                  </Button>
                  <Button variant="outline" onClick={advanceQuestion} disabled={selectedAnswers[currentQuestion] === undefined} className="border-border/70">
                    {currentQuestion < quizQuestions.length - 1 ? "Next Question" : "Build Dashboard"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/60">
              <CardHeader>
                <CardTitle>Quiz Signals</CardTitle>
                <CardDescription>Track what you have answered and how close you are to mastery.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quizQuestions.map((question, index) => {
                  const answered = submittedQuestionSet.has(index);
                  const correct = selectedAnswers[index] === question.answerIndex;

                  return (
                    <div key={question.prompt} className="rounded-xl border border-border/70 bg-background/40 p-4 flex items-start gap-3">
                      {answered ? (
                        correct ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> : <CircleAlert className="w-5 h-5 text-rose-400 mt-0.5" />
                      ) : (
                        <Medal className="w-5 h-5 text-muted-foreground mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">Question {index + 1}</p>
                        <p className="text-sm text-muted-foreground">{answered ? (correct ? "Correct answer locked in." : "Answered, but not quite right yet.") : "Not submitted yet."}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        )}

        {view === "dashboard" && (
          <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="glass-panel border-border/60">
              <CardHeader>
                <CardTitle>Dashboard Sandbox</CardTitle>
                <CardDescription>Change the region, metric, or chart type to explore the sales story.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldSelect label="Region" value={region} options={[...regions]} onChange={(value) => setRegion(value as (typeof regions)[number])} />
                  <FieldSelect label="Metric" value={metricLabel[metric]} options={metricOptions.map((option) => option.label)} onChange={(value) => setMetric(metricOptions.find((option) => option.label === value)?.key ?? "revenue")} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ToggleSelect label="Chart type" value={chartType} leftLabel="Bar" rightLabel="Line" onChange={() => setChartType((current) => (current === "bar" ? "line" : "bar"))} />
                  <Button variant="outline" onClick={handleInsight} className="border-border/70 h-full py-5">
                    I found an insight
                  </Button>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-100 mb-1">BI prompt</p>
                  <p className="text-cyan-50">Which region is growing fastest, and what would you do next if you owned the team goal?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InfoPill icon={<LineChartIcon className="w-4 h-4" />} title="Filtered total" text={`${totalMetric} ${metricLabel[metric].toLowerCase()}`} />
                  <InfoPill icon={<Star className="w-4 h-4" />} title="Top region" text={topRegion} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>{metricLabel[metric]} by Month</CardTitle>
                    <CardDescription>{region === "All regions" ? "All regions" : `${region} region`} dataset with four months of sample performance data.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-border/70">{chartType === "bar" ? "Bar chart" : "Line chart"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] rounded-2xl border border-border/70 bg-background/40 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="month" stroke="rgba(226,232,240,0.7)" />
                        <YAxis stroke="rgba(226,232,240,0.7)" />
                        <Tooltip cursor={{ fill: "rgba(34,211,238,0.08)" }} contentStyle={{ background: "rgba(2,6,23,0.92)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12 }} />
                        <Legend />
                        <Bar dataKey="value" name={metricLabel[metric]} radius={[10, 10, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={entry.month} fill={metricOptions.find((option) => option.key === metric)?.color ?? "#22d3ee"} opacity={index % 2 === 0 ? 0.95 : 0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="month" stroke="rgba(226,232,240,0.7)" />
                        <YAxis stroke="rgba(226,232,240,0.7)" />
                        <Tooltip contentStyle={{ background: "rgba(2,6,23,0.92)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12 }} />
                        <Legend />
                        <Line type="monotone" dataKey="value" name={metricLabel[metric]} stroke={metricOptions.find((option) => option.key === metric)?.color ?? "#22d3ee"} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-border/70">
                  <table className="w-full text-sm">
                    <thead className="bg-background/60 text-left text-muted-foreground uppercase tracking-[0.18em] text-xs">
                      <tr>
                        <th className="px-4 py-3">Month</th>
                        <th className="px-4 py-3">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row) => (
                        <tr key={row.month} className="border-t border-border/70 bg-background/20">
                          <td className="px-4 py-3">{row.month}</td>
                          <td className="px-4 py-3 font-semibold">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {insightTracked && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-50">
                    Insight logged. This kind of note can be stored as telemetry in a real BI learning card.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {view === "achievements" && (
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="glass-panel border-border/60">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Badges show progress across lessons, quiz mastery, and dashboard exploration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {earnedBadges.map((badge) => (
                  <div key={badge.label} className="rounded-2xl border border-border/70 bg-background/40 p-4 flex items-start gap-3">
                    {badge.earned ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> : <Medal className="w-5 h-5 text-muted-foreground mt-0.5" />}
                    <div>
                      <p className="font-semibold">{badge.label}</p>
                      <p className="text-sm text-muted-foreground">{badge.earned ? "Unlocked" : badge.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/60">
              <CardHeader>
                <CardTitle>Progress Summary</CardTitle>
                <CardDescription>These counters reflect the main learning outcomes for the card.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <SummaryTile label="Lessons completed" value={`${completedLessonSet.size}/${lessons.length}`} note="Tracks concept coverage." />
                <SummaryTile label="Quiz score" value={`${quizScore}%`} note="Measures concept retention." />
                <SummaryTile label="Dashboard interaction" value={insightTracked ? "Logged" : "Pending"} note="Captures exploration behavior." />
                <SummaryTile label="Next step" value={quizScore >= 80 ? "Advanced mode" : "Review lessons"} note="Keeps the learner moving." />
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
};

function StatCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.18em] mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-semibold text-sm sm:text-base">{value}</p>
    </div>
  );
}

function InfoPill({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4 flex gap-3">
      <div className="mt-1 text-cyan-300">{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-6">{text}</p>
      </div>
    </div>
  );
}

function FieldSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-400/40"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleSelect({ label, value, leftLabel, rightLabel, onChange }: { label: string; value: string; leftLabel: string; rightLabel: string; onChange: () => void }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/40 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value === "bar" ? leftLabel : rightLabel}</p>
      </div>
      <Button type="button" variant="outline" onClick={onChange} className="border-border/70">
        Switch to {value === "bar" ? rightLabel : leftLabel}
      </Button>
    </div>
  );
}

function SummaryTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">{label}</p>
      <p className="text-lg font-semibold mb-2">{value}</p>
      <p className="text-sm text-muted-foreground leading-6">{note}</p>
    </div>
  );
}

export default BusinessIntelligence;