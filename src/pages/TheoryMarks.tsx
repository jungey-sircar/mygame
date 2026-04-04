import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Atom,
  BookOpen,
  Building2,
  CheckCircle2,
  Edit3,
  KeyRound,
  Plus,
  Search,
  Shield,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ParticleBackground from "@/components/ParticleBackground";
import Footer from "@/components/Footer";

interface TheoryMarkRecord {
  id: string;
  name: string;
  firstTerm: number | null;
  secondTerm: number | null;
  preBoard: number | null;
}

interface TheoryCategory {
  key: string;
  title: string;
  subtitle: string;
  records: TheoryMarkRecord[];
}

type TermKey = "firstTerm" | "secondTerm" | "preBoard";

const ADMIN_USERNAME = "jungeysircar";
const ADMIN_PASSWORD = "eric@123";
const STORAGE_KEY = "neon-challenge-hub-theory-marks-admin-data-v2";
const LEGACY_STORAGE_KEY = "neon-challenge-hub-theory-marks-admin-data-v1";

const INITIAL_CATEGORIES: TheoryCategory[] = [
  {
    key: "management",
    title: "Management",
    subtitle: "Previous marks set",
    records: [
      { id: "management-aarys", name: "AARYS", firstTerm: 12, secondTerm: 14, preBoard: null },
      { id: "management-arbin", name: "ARBIN MAHARJAN", firstTerm: 20, secondTerm: 28, preBoard: 26 },
      { id: "management-belief", name: "BELIEF BHAJI", firstTerm: 14, secondTerm: 21, preBoard: 20 },
      { id: "management-bishal", name: "BISHAL KUMAR KUNWAR", firstTerm: 38, secondTerm: 41, preBoard: 37 },
      { id: "management-diplove", name: "DIPLOVE THAPA", firstTerm: 24, secondTerm: 34, preBoard: 12 },
      { id: "management-lizen", name: "LIZEN MAHARJAN", firstTerm: 22, secondTerm: 40, preBoard: 31 },
      { id: "management-luwish", name: "LUWISH MAHARJAN", firstTerm: 21, secondTerm: 15, preBoard: 25 },
      { id: "management-nirvik", name: "NIRVIK MAHARJAN", firstTerm: 25, secondTerm: 33, preBoard: 27 },
      { id: "management-riz", name: "RIZ MAHARJAN", firstTerm: 15, secondTerm: 19, preBoard: 14 },
      { id: "management-sakchhyyam", name: "SAKCHHYYAM TAMANG", firstTerm: 25, secondTerm: 30, preBoard: 28 },
      { id: "management-shrawika", name: "SHRAWIKA MAHARJAN", firstTerm: 24, secondTerm: 25, preBoard: 20 },
      { id: "management-shital", name: "SHITAL BAHADUR KHADKA", firstTerm: 20, secondTerm: 15, preBoard: 16 },
      { id: "management-timila", name: "TIMILA DEVI MAHARJAN", firstTerm: 28, secondTerm: 39, preBoard: 24 },
      { id: "management-utsav", name: "UTSAV MAHARJAN", firstTerm: 28, secondTerm: 23, preBoard: 15 },
    ],
  },
  {
    key: "science",
    title: "Science Students",
    subtitle: "Uploaded from the science screenshots",
    records: [
      { id: "science-aashraya", name: "AASHRAYA SHRESTHA", firstTerm: 20, secondTerm: 18, preBoard: 32 },
      { id: "science-azelf", name: "AZELF MAHARJAN", firstTerm: 30, secondTerm: 29, preBoard: 29 },
      { id: "science-bidhan", name: "BIDHAN KC", firstTerm: 31, secondTerm: 34, preBoard: 33 },
      { id: "science-jashan", name: "JASHAN SHRESTHA", firstTerm: 48, secondTerm: 46, preBoard: 37 },
      { id: "science-prastut", name: "PRASTUT RAUT", firstTerm: 30, secondTerm: 36, preBoard: 30 },
      { id: "science-ram-hari", name: "RAM HARI ADHIKARI", firstTerm: 37, secondTerm: 41, preBoard: 28 },
      { id: "science-reebik", name: "REEBIK DANGOL", firstTerm: 27, secondTerm: 36, preBoard: 32 },
      { id: "science-saurabhdweep", name: "SAURABHDWEEP SHRESTHA", firstTerm: 31, secondTerm: 40, preBoard: 36 },
      { id: "science-shalim", name: "SHALIM TAMANG", firstTerm: 7, secondTerm: 14, preBoard: 7 },
    ],
  },
];

const termColumns: Array<{ key: TermKey; label: string }> = [
  { key: "firstTerm", label: "First Term" },
  { key: "secondTerm", label: "Second Term" },
  { key: "preBoard", label: "Pre-Board" },
];

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ").toUpperCase();
const formatMark = (mark: number | null) => (mark === null ? "-" : mark);

const hasAnyMark = (record: Pick<TheoryMarkRecord, "firstTerm" | "secondTerm" | "preBoard">) =>
  [record.firstTerm, record.secondTerm, record.preBoard].some((mark) => typeof mark === "number");

const createRecordId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const sanitizeRecords = (records: TheoryMarkRecord[]) =>
  records
    .map((record) => ({
      id: typeof record.id === "string" && record.id ? record.id : createRecordId(),
      name: normalizeName(record.name ?? ""),
      firstTerm: typeof record.firstTerm === "number" ? record.firstTerm : null,
      secondTerm: typeof record.secondTerm === "number" ? record.secondTerm : null,
      preBoard: typeof record.preBoard === "number" ? record.preBoard : null,
    }))
    .filter((record) => record.name.length > 0)
    .filter(hasAnyMark);

const slugifyCategoryKey = (title: string) =>
  title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || `category-${Date.now()}`;

const loadCategories = (): TheoryCategory[] => {
  if (typeof window === "undefined") {
    return INITIAL_CATEGORIES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TheoryCategory[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .map((category) => ({
            key: typeof category.key === "string" && category.key ? category.key : slugifyCategoryKey(category.title || "CATEGORY"),
            title: (category.title || "CATEGORY").trim(),
            subtitle: (category.subtitle || "").trim(),
            records: sanitizeRecords(Array.isArray(category.records) ? category.records : []),
          }))
          .filter((category) => category.title.length > 0);
      }
    }

    // Backward compatibility with previous storage shape.
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw) as { management?: TheoryMarkRecord[]; science?: TheoryMarkRecord[] };
      return INITIAL_CATEGORIES.map((category) => ({
        ...category,
        records: sanitizeRecords(parsedLegacy[category.key as "management" | "science"] ?? category.records),
      }));
    }
  } catch {
    return INITIAL_CATEGORIES;
  }

  return INITIAL_CATEGORIES;
};

const buildTermStats = (records: TheoryMarkRecord[], key: TermKey) => {
  const availableMarks = records
    .map((record) => record[key])
    .filter((mark): mark is number => typeof mark === "number");

  const total = availableMarks.reduce((sum, mark) => sum + mark, 0);
  const average = availableMarks.length ? (total / availableMarks.length).toFixed(1) : "0.0";
  const topScore = availableMarks.length ? Math.max(...availableMarks) : 0;

  return {
    availableCount: availableMarks.length,
    average,
    topScore,
  };
};

const getCategoryIcon = (key: string) => {
  if (key === "management") return <Building2 className="w-5 h-5 text-neon-cyan" />;
  if (key === "science") return <Atom className="w-5 h-5 text-neon-cyan" />;
  return <BookOpen className="w-5 h-5 text-neon-cyan" />;
};

const TheoryMarks = () => {
  const [categories, setCategories] = useState<TheoryCategory[]>(() => loadCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>("management");
  const [query, setQuery] = useState("");

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");

  const [adminCategory, setAdminCategory] = useState<string>("management");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [recordForm, setRecordForm] = useState({
    name: "",
    firstTerm: "",
    secondTerm: "",
    preBoard: "",
  });

  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newCategorySubtitle, setNewCategorySubtitle] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (!categories.some((category) => category.key === selectedCategory) && categories.length > 0) {
      setSelectedCategory(categories[0].key);
    }

    if (!categories.some((category) => category.key === adminCategory) && categories.length > 0) {
      setAdminCategory(categories[0].key);
    }
  }, [categories, selectedCategory, adminCategory]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.key === selectedCategory) ?? categories[0],
    [categories, selectedCategory]
  );

  const activeRecords = activeCategory?.records ?? [];

  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return activeRecords;
    return activeRecords.filter((record) => record.name.toLowerCase().includes(normalized));
  }, [query, activeRecords]);

  const termStats = useMemo(
    () =>
      termColumns.map((column) => ({
        ...column,
        ...buildTermStats(activeRecords, column.key),
      })),
    [activeRecords]
  );

  const updateCategoryRecords = (categoryKey: string, updater: (records: TheoryMarkRecord[]) => TheoryMarkRecord[]) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.key === categoryKey
          ? {
              ...category,
              records: sanitizeRecords(updater(category.records)),
            }
          : category
      )
    );
  };

  const resetForm = () => {
    setEditingRecordId(null);
    setRecordForm({
      name: "",
      firstTerm: "",
      secondTerm: "",
      preBoard: "",
    });
    setAdminError("");
  };

  const startEdit = (categoryKey: string, record: TheoryMarkRecord) => {
    setEditingRecordId(record.id);
    setAdminCategory(categoryKey);
    setRecordForm({
      name: record.name,
      firstTerm: record.firstTerm === null ? "" : String(record.firstTerm),
      secondTerm: record.secondTerm === null ? "" : String(record.secondTerm),
      preBoard: record.preBoard === null ? "" : String(record.preBoard),
    });
    setAdminMessage(`Editing ${record.name}`);
    setAdminError("");
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loginUsername.trim().toLowerCase() === ADMIN_USERNAME && loginPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setAdminMessage("Admin access granted.");
      setAdminError("");
      return;
    }

    setAdminError("Invalid username or password.");
    setAdminMessage("");
  };

  const handleRecordSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdminAuthenticated) {
      setAdminError("Please log in as admin first.");
      return;
    }

    const targetCategory = categories.find((category) => category.key === adminCategory);
    if (!targetCategory) {
      setAdminError("Please select a valid category.");
      return;
    }

    const name = normalizeName(recordForm.name);
    const firstTerm = recordForm.firstTerm.trim() === "" ? null : Number(recordForm.firstTerm);
    const secondTerm = recordForm.secondTerm.trim() === "" ? null : Number(recordForm.secondTerm);
    const preBoard = recordForm.preBoard.trim() === "" ? null : Number(recordForm.preBoard);

    if (!name) {
      setAdminError("Student name is required.");
      return;
    }

    if ([firstTerm, secondTerm, preBoard].some((mark) => mark !== null && Number.isNaN(mark))) {
      setAdminError("Marks must be valid numbers.");
      return;
    }

    if (!hasAnyMark({ firstTerm, secondTerm, preBoard })) {
      setAdminError("At least one exam mark is required.");
      return;
    }

    const recordId = editingRecordId ?? createRecordId();
    const nextRecord: TheoryMarkRecord = {
      id: recordId,
      name,
      firstTerm,
      secondTerm,
      preBoard,
    };

    setCategories((prev) =>
      prev.map((category) => {
        const withoutRecord = category.records.filter((record) => record.id !== recordId);
        if (category.key === adminCategory) {
          return {
            ...category,
            records: sanitizeRecords([...withoutRecord, nextRecord]),
          };
        }

        return {
          ...category,
          records: withoutRecord,
        };
      })
    );

    setAdminMessage(editingRecordId ? `${name} updated.` : `${name} added.`);
    setAdminError("");
    resetForm();
  };

  const handleDeleteRecord = (categoryKey: string, recordId: string) => {
    updateCategoryRecords(categoryKey, (records) => records.filter((record) => record.id !== recordId));

    if (editingRecordId === recordId) {
      resetForm();
    }

    setAdminMessage("Student removed.");
    setAdminError("");
  };

  const handleAddCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdminAuthenticated) {
      setAdminError("Please log in as admin first.");
      return;
    }

    const title = newCategoryTitle.trim();
    const subtitle = newCategorySubtitle.trim();

    if (!title) {
      setAdminError("Category name is required.");
      return;
    }

    const baseKey = slugifyCategoryKey(title);
    let uniqueKey = baseKey;
    let suffix = 1;

    while (categories.some((category) => category.key === uniqueKey)) {
      suffix += 1;
      uniqueKey = `${baseKey}-${suffix}`;
    }

    setCategories((prev) => [...prev, { key: uniqueKey, title, subtitle, records: [] }]);
    setSelectedCategory(uniqueKey);
    setAdminCategory(uniqueKey);
    setNewCategoryTitle("");
    setNewCategorySubtitle("");
    setAdminMessage(`Category ${title} created.`);
    setAdminError("");
  };

  const openCreateForm = () => {
    setEditingRecordId(null);
    setRecordForm({
      name: "",
      firstTerm: "",
      secondTerm: "",
      preBoard: "",
    });
    setAdminMessage("Adding a new student.");
    setAdminError("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[420px] h-[420px] bg-neon-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[420px] h-[420px] bg-neon-cyan/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <Link to="/" className="w-fit">
              <Button variant="outline" size="sm" className="gap-2 font-display text-xs">
                <ArrowLeft className="w-3 h-3" /> Back to Home
              </Button>
            </Link>

            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
              <BookOpen className="w-4 h-4 text-neon-cyan" />
              Theory marks register
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10">
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground text-glow-purple mb-4">
              Classroom Theory Marks
            </h1>
            <p className="font-body text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Choose a category first. Admin can add new categories like BIT, BCA, SEE, or Grade 9, then add students
              and marks inside each one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {categories.map((category) => {
              const isActive = category.key === selectedCategory;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category.key);
                    setQuery("");
                  }}
                  className={`glass-panel rounded-2xl p-5 text-left border transition-all duration-300 ${
                    isActive
                      ? "border-neon-cyan/60 shadow-[0_0_30px_hsl(185_80%_50%/0.16)]"
                      : "border-border/40 hover:border-neon-purple/30 hover:-translate-y-1"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-background/50 border border-border/40 mb-4">
                        {getCategoryIcon(category.key)}
                      </div>
                      <h2 className="font-display text-xl font-bold text-foreground mb-2">{category.title}</h2>
                      <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-sm">
                        {category.subtitle || "Custom category"}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-neon-purple/15 text-neon-purple text-xs font-display font-bold tracking-[0.2em] uppercase">
                      {category.records.length} students
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-6 border border-border/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-neon-cyan" />
                  <h2 className="font-display text-xl font-bold text-foreground">Admin Panel</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Log in to add categories, add students, edit marks, or delete records. Names are stored in uppercase.
                </p>
              </div>
              {isAdminAuthenticated && (
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.25em] text-neon-cyan">Authenticated</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setIsAdminAuthenticated(false);
                      setLoginPassword("");
                      setAdminMessage("Logged out.");
                    }}
                  >
                    <X className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              )}
            </div>

            {!isAdminAuthenticated ? (
              <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleLogin}>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Username</label>
                  <Input
                    value={loginUsername}
                    onChange={(event) => setLoginUsername(event.target.value)}
                    placeholder="Enter admin username"
                    autoComplete="username"
                    className="bg-background/40 border-border/40"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Password</label>
                  <Input
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    type="password"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="bg-background/40 border-border/40"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full gap-2">
                    <KeyRound className="w-4 h-4" />
                    Unlock Admin
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" onSubmit={handleAddCategory}>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">New Category</label>
                    <Input
                      value={newCategoryTitle}
                      onChange={(event) => setNewCategoryTitle(event.target.value)}
                      placeholder="BIT / BCA / SEE / GRADE 9"
                      className="bg-background/40 border-border/40"
                    />
                  </div>
                  <div className="xl:col-span-2">
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Subtitle (optional)</label>
                    <Input
                      value={newCategorySubtitle}
                      onChange={(event) => setNewCategorySubtitle(event.target.value)}
                      placeholder="Describe this class group"
                      className="bg-background/40 border-border/40"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Add Category
                    </Button>
                  </div>
                </form>

                <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4" onSubmit={handleRecordSave}>
                  <div className="xl:col-span-2">
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Student Name</label>
                    <Input
                      value={recordForm.name}
                      onChange={(event) => setRecordForm((prev) => ({ ...prev, name: normalizeName(event.target.value) }))}
                      placeholder="ENTER STUDENT NAME"
                      className="bg-background/40 border-border/40 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Category</label>
                    <select
                      value={adminCategory}
                      onChange={(event) => setAdminCategory(event.target.value)}
                      className="w-full h-10 rounded-md border border-border/40 bg-background/40 px-3 text-sm outline-none"
                    >
                      {categories.map((category) => (
                        <option key={category.key} value={category.key}>
                          {category.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">First Term</label>
                    <Input
                      value={recordForm.firstTerm}
                      onChange={(event) => setRecordForm((prev) => ({ ...prev, firstTerm: event.target.value }))}
                      type="number"
                      min="0"
                      max="50"
                      placeholder="Optional"
                      className="bg-background/40 border-border/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Second Term</label>
                    <Input
                      value={recordForm.secondTerm}
                      onChange={(event) => setRecordForm((prev) => ({ ...prev, secondTerm: event.target.value }))}
                      type="number"
                      min="0"
                      max="50"
                      placeholder="Optional"
                      className="bg-background/40 border-border/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Pre-Board</label>
                    <Input
                      value={recordForm.preBoard}
                      onChange={(event) => setRecordForm((prev) => ({ ...prev, preBoard: event.target.value }))}
                      type="number"
                      min="0"
                      max="50"
                      placeholder="Optional"
                      className="bg-background/40 border-border/40"
                    />
                  </div>
                  <div className="xl:col-span-6 flex flex-col sm:flex-row gap-3">
                    <Button type="submit" className="gap-2">
                      {editingRecordId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingRecordId ? "Update Student" : "Add Student"}
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" onClick={openCreateForm}>
                      <Plus className="w-4 h-4" />
                      New Entry
                    </Button>
                    {editingRecordId && (
                      <Button type="button" variant="ghost" className="gap-2" onClick={resetForm}>
                        <X className="w-4 h-4" />
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </form>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/40 p-4 bg-background/20">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h3 className="font-display text-base font-bold text-foreground">Current Category Records</h3>
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{activeCategory?.title ?? "Category"}</span>
                    </div>
                    <div className="max-h-72 overflow-auto pr-1 space-y-2">
                      {activeRecords.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-background/30 px-3 py-2"
                        >
                          <div>
                            <div className="font-semibold text-foreground">{record.name}</div>
                            <div className="text-xs text-muted-foreground">
                              F:{formatMark(record.firstTerm)} S:{formatMark(record.secondTerm)} P:{formatMark(record.preBoard)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button type="button" size="icon" variant="ghost" onClick={() => startEdit(selectedCategory, record)}>
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" onClick={() => handleDeleteRecord(selectedCategory, record.id)}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/40 p-4 bg-background/20">
                    <h3 className="font-display text-base font-bold text-foreground mb-4">Admin Status</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>Username is locked to the provided admin account.</p>
                      <p>You can add custom categories and manage records per category.</p>
                      <p>Rows with all three marks empty cannot be saved.</p>
                    </div>
                    {adminMessage && <div className="mt-4 text-sm text-neon-cyan">{adminMessage}</div>}
                    {adminError && <div className="mt-4 text-sm text-red-400">{adminError}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {termStats.map((stat) => (
              <div key={stat.label} className="glass-panel rounded-2xl p-5 border border-border/40">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-lg font-bold text-foreground">{stat.label}</h2>
                  <Trophy className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-display font-black text-foreground">{stat.availableCount}</div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Scores</div>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-black text-foreground">{stat.average}</div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Average</div>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-black text-foreground">{stat.topScore}</div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Top</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-2xl p-4 sm:p-6 mb-6 border border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${(activeCategory?.title ?? "category").toLowerCase()} student...`}
                  className="pl-10 bg-background/40 border-border/40"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-neon-pink" />
                {filteredRecords.length} {(activeCategory?.title ?? "category").toLowerCase()} students shown
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-border/40">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">Name</th>
                    <th className="px-4 sm:px-6 py-4 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">First Term</th>
                    <th className="px-4 sm:px-6 py-4 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">Second Term</th>
                    <th className="px-4 sm:px-6 py-4 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">Pre-Board</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} className={index % 2 === 0 ? "bg-background/10" : "bg-transparent"}>
                      <td className="px-4 sm:px-6 py-3 border-t border-border/30 font-semibold text-foreground">{record.name}</td>
                      <td className="px-4 sm:px-6 py-3 border-t border-border/30 text-muted-foreground">{formatMark(record.firstTerm)}</td>
                      <td className="px-4 sm:px-6 py-3 border-t border-border/30 text-muted-foreground">{formatMark(record.secondTerm)}</td>
                      <td className="px-4 sm:px-6 py-3 border-t border-border/30 text-muted-foreground">{formatMark(record.preBoard)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">No students matched your search.</div>
            )}
          </div>

          <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheoryMarks;
