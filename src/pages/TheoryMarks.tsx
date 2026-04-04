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
import { ADMIN_PASSWORD, ADMIN_USERNAME } from "@/lib/adminCredentials";

interface TheoryMarkRecord {
  id: string;
  name: string;
  marks: Record<string, number | null>;
}

interface TheoryCategory {
  key: string;
  title: string;
  subtitle: string;
  records: TheoryMarkRecord[];
}

interface ExamDefinition {
  key: string;
  label: string;
}

const STORAGE_KEY = "neon-challenge-hub-theory-marks-admin-data-v3";
const LEGACY_STORAGE_V2 = "neon-challenge-hub-theory-marks-admin-data-v2";
const LEGACY_STORAGE_V1 = "neon-challenge-hub-theory-marks-admin-data-v1";

const DEFAULT_EXAMS: ExamDefinition[] = [
  { key: "first-term", label: "First Term" },
  { key: "second-term", label: "Second Term" },
  { key: "pre-board", label: "Pre-Board" },
];

const INITIAL_CATEGORIES: TheoryCategory[] = [
  {
    key: "management",
    title: "Management",
    subtitle: "Previous marks set",
    records: [
      {
        id: "management-aarys",
        name: "AARYS",
        marks: { "first-term": 12, "second-term": 14, "pre-board": null },
      },
      {
        id: "management-arbin",
        name: "ARBIN MAHARJAN",
        marks: { "first-term": 20, "second-term": 28, "pre-board": 26 },
      },
      {
        id: "management-belief",
        name: "BELIEF BHAJI",
        marks: { "first-term": 14, "second-term": 21, "pre-board": 20 },
      },
      {
        id: "management-bishal",
        name: "BISHAL KUMAR KUNWAR",
        marks: { "first-term": 38, "second-term": 41, "pre-board": 37 },
      },
      {
        id: "management-diplove",
        name: "DIPLOVE THAPA",
        marks: { "first-term": 24, "second-term": 34, "pre-board": 12 },
      },
      {
        id: "management-lizen",
        name: "LIZEN MAHARJAN",
        marks: { "first-term": 22, "second-term": 40, "pre-board": 31 },
      },
      {
        id: "management-luwish",
        name: "LUWISH MAHARJAN",
        marks: { "first-term": 21, "second-term": 15, "pre-board": 25 },
      },
      {
        id: "management-nirvik",
        name: "NIRVIK MAHARJAN",
        marks: { "first-term": 25, "second-term": 33, "pre-board": 27 },
      },
      {
        id: "management-riz",
        name: "RIZ MAHARJAN",
        marks: { "first-term": 15, "second-term": 19, "pre-board": 14 },
      },
      {
        id: "management-sakchhyyam",
        name: "SAKCHHYYAM TAMANG",
        marks: { "first-term": 25, "second-term": 30, "pre-board": 28 },
      },
      {
        id: "management-shrawika",
        name: "SHRAWIKA MAHARJAN",
        marks: { "first-term": 24, "second-term": 25, "pre-board": 20 },
      },
      {
        id: "management-shital",
        name: "SHITAL BAHADUR KHADKA",
        marks: { "first-term": 20, "second-term": 15, "pre-board": 16 },
      },
      {
        id: "management-timila",
        name: "TIMILA DEVI MAHARJAN",
        marks: { "first-term": 28, "second-term": 39, "pre-board": 24 },
      },
      {
        id: "management-utsav",
        name: "UTSAV MAHARJAN",
        marks: { "first-term": 28, "second-term": 23, "pre-board": 15 },
      },
    ],
  },
  {
    key: "science",
    title: "Science Students",
    subtitle: "Uploaded from the science screenshots",
    records: [
      {
        id: "science-aashraya",
        name: "AASHRAYA SHRESTHA",
        marks: { "first-term": 20, "second-term": 18, "pre-board": 32 },
      },
      {
        id: "science-azelf",
        name: "AZELF MAHARJAN",
        marks: { "first-term": 30, "second-term": 29, "pre-board": 29 },
      },
      {
        id: "science-bidhan",
        name: "BIDHAN KC",
        marks: { "first-term": 31, "second-term": 34, "pre-board": 33 },
      },
      {
        id: "science-jashan",
        name: "JASHAN SHRESTHA",
        marks: { "first-term": 48, "second-term": 46, "pre-board": 37 },
      },
      {
        id: "science-prastut",
        name: "PRASTUT RAUT",
        marks: { "first-term": 30, "second-term": 36, "pre-board": 30 },
      },
      {
        id: "science-ram-hari",
        name: "RAM HARI ADHIKARI",
        marks: { "first-term": 37, "second-term": 41, "pre-board": 28 },
      },
      {
        id: "science-reebik",
        name: "REEBIK DANGOL",
        marks: { "first-term": 27, "second-term": 36, "pre-board": 32 },
      },
      {
        id: "science-saurabhdweep",
        name: "SAURABHDWEEP SHRESTHA",
        marks: { "first-term": 31, "second-term": 40, "pre-board": 36 },
      },
      {
        id: "science-shalim",
        name: "SHALIM TAMANG",
        marks: { "first-term": 7, "second-term": 14, "pre-board": 7 },
      },
    ],
  },
];

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ").toUpperCase();
const formatMark = (mark: number | null) => (mark === null ? "-" : mark);

const createRecordId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const slugify = (value: string, fallbackPrefix: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized || `${fallbackPrefix}-${Date.now()}`;
};

const hasAnyMark = (record: TheoryMarkRecord, exams: ExamDefinition[]) =>
  exams.some((exam) => typeof record.marks[exam.key] === "number");

const sanitizeExams = (candidate: ExamDefinition[] | undefined): ExamDefinition[] => {
  if (!Array.isArray(candidate) || candidate.length === 0) return DEFAULT_EXAMS;

  const seen = new Set<string>();
  const exams = candidate
    .map((exam) => {
      const label = (exam?.label ?? "").trim();
      const baseKey = typeof exam?.key === "string" && exam.key ? exam.key : slugify(label || "exam", "exam");
      let key = baseKey;
      let i = 1;
      while (seen.has(key)) {
        i += 1;
        key = `${baseKey}-${i}`;
      }
      if (!label) return null;
      seen.add(key);
      return { key, label };
    })
    .filter((exam): exam is ExamDefinition => exam !== null);

  return exams.length > 0 ? exams : DEFAULT_EXAMS;
};

const sanitizeRecords = (records: TheoryMarkRecord[] | unknown, exams: ExamDefinition[]): TheoryMarkRecord[] => {
  if (!Array.isArray(records)) return [];

  return records
    .map((record) => {
      const sourceMarks = typeof record?.marks === "object" && record?.marks !== null ? record.marks : {};
      const marks: Record<string, number | null> = {};

      exams.forEach((exam) => {
        const value = (sourceMarks as Record<string, unknown>)[exam.key];
        marks[exam.key] = typeof value === "number" ? value : null;
      });

      return {
        id: typeof record?.id === "string" && record.id ? record.id : createRecordId(),
        name: normalizeName(typeof record?.name === "string" ? record.name : ""),
        marks,
      };
    })
    .filter((record) => record.name.length > 0)
    .filter((record) => hasAnyMark(record, exams));
};

const convertLegacyRecord = (record: unknown, exams: ExamDefinition[]): TheoryMarkRecord => {
  const candidate = (record ?? {}) as {
    id?: string;
    name?: string;
    firstTerm?: number | null;
    secondTerm?: number | null;
    preBoard?: number | null;
    marks?: Record<string, number | null>;
  };

  const marks: Record<string, number | null> = {};
  exams.forEach((exam) => {
    marks[exam.key] = null;
  });

  const labelMap: Record<string, keyof typeof candidate> = {
    "first-term": "firstTerm",
    "second-term": "secondTerm",
    "pre-board": "preBoard",
  };

  exams.forEach((exam) => {
    const fromMarks = candidate.marks?.[exam.key];
    if (typeof fromMarks === "number") {
      marks[exam.key] = fromMarks;
      return;
    }

    const legacyKey = labelMap[exam.key];
    const fromLegacy = legacyKey ? candidate[legacyKey] : null;
    marks[exam.key] = typeof fromLegacy === "number" ? fromLegacy : null;
  });

  return {
    id: typeof candidate.id === "string" && candidate.id ? candidate.id : createRecordId(),
    name: normalizeName(candidate.name ?? ""),
    marks,
  };
};

const buildInitialState = () => {
  if (typeof window === "undefined") {
    return { exams: DEFAULT_EXAMS, categories: INITIAL_CATEGORIES };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { exams?: ExamDefinition[]; categories?: TheoryCategory[] };
      const exams = sanitizeExams(parsed.exams);
      const categories = Array.isArray(parsed.categories)
        ? parsed.categories
            .map((category) => ({
              key:
                typeof category?.key === "string" && category.key
                  ? category.key
                  : slugify(category?.title || "category", "category"),
              title: (category?.title || "CATEGORY").trim(),
              subtitle: (category?.subtitle || "").trim(),
              records: sanitizeRecords(category?.records, exams),
            }))
            .filter((category) => category.title.length > 0)
        : [];

      if (categories.length > 0) {
        return { exams, categories };
      }
    }

    const v2Raw = window.localStorage.getItem(LEGACY_STORAGE_V2);
    if (v2Raw) {
      const v2Categories = JSON.parse(v2Raw) as TheoryCategory[];
      const exams = DEFAULT_EXAMS;
      const categories = Array.isArray(v2Categories)
        ? v2Categories
            .map((category) => ({
              key:
                typeof category?.key === "string" && category.key
                  ? category.key
                  : slugify(category?.title || "category", "category"),
              title: (category?.title || "CATEGORY").trim(),
              subtitle: (category?.subtitle || "").trim(),
              records: sanitizeRecords((category?.records || []).map((record) => convertLegacyRecord(record, exams)), exams),
            }))
            .filter((category) => category.title.length > 0)
        : [];

      if (categories.length > 0) {
        return { exams, categories };
      }
    }

    const v1Raw = window.localStorage.getItem(LEGACY_STORAGE_V1);
    if (v1Raw) {
      const v1 = JSON.parse(v1Raw) as { management?: unknown[]; science?: unknown[] };
      const exams = DEFAULT_EXAMS;
      return {
        exams,
        categories: INITIAL_CATEGORIES.map((category) => {
          const legacyList = category.key === "management" ? v1.management : v1.science;
          if (!Array.isArray(legacyList)) return category;

          const records = sanitizeRecords(legacyList.map((record) => convertLegacyRecord(record, exams)), exams);
          return {
            ...category,
            records,
          };
        }),
      };
    }
  } catch {
    return { exams: DEFAULT_EXAMS, categories: INITIAL_CATEGORIES };
  }

  return { exams: DEFAULT_EXAMS, categories: INITIAL_CATEGORIES };
};

const getCategoryIcon = (key: string) => {
  if (key === "management") return <Building2 className="w-5 h-5 text-neon-cyan" />;
  if (key === "science") return <Atom className="w-5 h-5 text-neon-cyan" />;
  return <BookOpen className="w-5 h-5 text-neon-cyan" />;
};

const TheoryMarks = () => {
  const initialState = useMemo(() => buildInitialState(), []);
  const [isPageUnlocked, setIsPageUnlocked] = useState(false);
  const [unlockUsername, setUnlockUsername] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  const [exams, setExams] = useState<ExamDefinition[]>(initialState.exams);
  const [categories, setCategories] = useState<TheoryCategory[]>(initialState.categories);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialState.categories[0]?.key ?? "management");
  const [query, setQuery] = useState("");

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");

  const [adminCategory, setAdminCategory] = useState<string>(initialState.categories[0]?.key ?? "management");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [recordName, setRecordName] = useState("");
  const [recordFormMarks, setRecordFormMarks] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialState.exams.map((exam) => [exam.key, ""]))
  );

  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newCategorySubtitle, setNewCategorySubtitle] = useState("");
  const [newExamLabel, setNewExamLabel] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ exams, categories }));
  }, [exams, categories]);

  useEffect(() => {
    if (!categories.some((category) => category.key === selectedCategory) && categories.length > 0) {
      setSelectedCategory(categories[0].key);
    }

    if (!categories.some((category) => category.key === adminCategory) && categories.length > 0) {
      setAdminCategory(categories[0].key);
    }
  }, [categories, selectedCategory, adminCategory]);

  useEffect(() => {
    setRecordFormMarks((prev) => {
      const next: Record<string, string> = {};
      exams.forEach((exam) => {
        next[exam.key] = prev[exam.key] ?? "";
      });
      return next;
    });
  }, [exams]);

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

  const examStats = useMemo(
    () =>
      exams.map((exam) => {
        const available = activeRecords
          .map((record) => record.marks[exam.key])
          .filter((mark): mark is number => typeof mark === "number");

        const total = available.reduce((sum, mark) => sum + mark, 0);
        const average = available.length ? (total / available.length).toFixed(1) : "0.0";
        const topScore = available.length ? Math.max(...available) : 0;

        return {
          key: exam.key,
          label: exam.label,
          availableCount: available.length,
          average,
          topScore,
        };
      }),
    [activeRecords, exams]
  );

  const resetForm = () => {
    setEditingRecordId(null);
    setRecordName("");
    setRecordFormMarks(Object.fromEntries(exams.map((exam) => [exam.key, ""])));
    setAdminError("");
  };

  const updateCategoryRecords = (categoryKey: string, updater: (records: TheoryMarkRecord[]) => TheoryMarkRecord[]) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.key !== categoryKey) return category;

        const nextRecords = updater(category.records)
          .map((record) => ({
            ...record,
            marks: Object.fromEntries(exams.map((exam) => [exam.key, record.marks[exam.key] ?? null])),
          }))
          .filter((record) => record.name.trim().length > 0)
          .filter((record) => hasAnyMark(record, exams));

        return {
          ...category,
          records: nextRecords,
        };
      })
    );
  };

  const startEdit = (categoryKey: string, record: TheoryMarkRecord) => {
    setEditingRecordId(record.id);
    setAdminCategory(categoryKey);
    setRecordName(record.name);
    setRecordFormMarks(
      Object.fromEntries(
        exams.map((exam) => [exam.key, record.marks[exam.key] === null || record.marks[exam.key] === undefined ? "" : String(record.marks[exam.key])])
      )
    );
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

    const name = normalizeName(recordName);
    if (!name) {
      setAdminError("Student name is required.");
      return;
    }

    const marks: Record<string, number | null> = {};
    for (const exam of exams) {
      const raw = (recordFormMarks[exam.key] ?? "").trim();
      const parsed = raw === "" ? null : Number(raw);
      if (parsed !== null && Number.isNaN(parsed)) {
        setAdminError(`Invalid mark for ${exam.label}.`);
        return;
      }
      marks[exam.key] = parsed;
    }

    const candidate: TheoryMarkRecord = {
      id: editingRecordId ?? createRecordId(),
      name,
      marks,
    };

    if (!hasAnyMark(candidate, exams)) {
      setAdminError("At least one exam mark is required.");
      return;
    }

    setCategories((prev) =>
      prev.map((category) => {
        const withoutRecord = category.records.filter((record) => record.id !== candidate.id);
        if (category.key === adminCategory) {
          return {
            ...category,
            records: [...withoutRecord, candidate],
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

    const baseKey = slugify(title, "category");
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

  const handleAddExam = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdminAuthenticated) {
      setAdminError("Please log in as admin first.");
      return;
    }

    const label = newExamLabel.trim();
    if (!label) {
      setAdminError("Exam name is required.");
      return;
    }

    const baseKey = slugify(label, "exam");
    let uniqueKey = baseKey;
    let suffix = 1;

    while (exams.some((exam) => exam.key === uniqueKey)) {
      suffix += 1;
      uniqueKey = `${baseKey}-${suffix}`;
    }

    const nextExam: ExamDefinition = { key: uniqueKey, label };
    const nextExams = [...exams, nextExam];
    setExams(nextExams);

    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        records: category.records.map((record) => ({
          ...record,
          marks: {
            ...record.marks,
            [uniqueKey]: null,
          },
        })),
      }))
    );

    setRecordFormMarks((prev) => ({
      ...prev,
      [uniqueKey]: "",
    }));

    setNewExamLabel("");
    setAdminMessage(`Exam ${label} added.`);
    setAdminError("");
  };

  const handleRemoveExam = (examKey: string) => {
    if (!isAdminAuthenticated) {
      setAdminError("Please log in as admin first.");
      return;
    }

    if (exams.length <= 1) {
      setAdminError("At least one exam must remain.");
      return;
    }

    const removedExam = exams.find((exam) => exam.key === examKey);
    const nextExams = exams.filter((exam) => exam.key !== examKey);

    setExams(nextExams);
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        records: category.records
          .map((record) => {
            const nextMarks = { ...record.marks };
            delete nextMarks[examKey];
            return {
              ...record,
              marks: nextMarks,
            };
          })
          .filter((record) => hasAnyMark(record, nextExams)),
      }))
    );

    setRecordFormMarks((prev) => {
      const next = { ...prev };
      delete next[examKey];
      return next;
    });

    setAdminMessage(`Exam ${removedExam?.label ?? examKey} removed.`);
    setAdminError("");
  };

  const openCreateForm = () => {
    setEditingRecordId(null);
    setRecordName("");
    setRecordFormMarks(Object.fromEntries(exams.map((exam) => [exam.key, ""])));
    setAdminMessage("Adding a new student.");
    setAdminError("");
  };

  const handleUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (unlockUsername.trim().toLowerCase() === ADMIN_USERNAME && unlockPassword === ADMIN_PASSWORD) {
      setIsPageUnlocked(true);
      setIsAdminAuthenticated(true);
      setLoginUsername(ADMIN_USERNAME);
      setLoginPassword(unlockPassword);
      setUnlockPassword("");
      setUnlockError("");
      setAdminMessage("Register unlocked.");
      return;
    }

    setUnlockError("Invalid username or password.");
  };

  if (!isPageUnlocked) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />

        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-15%] left-[-10%] w-[420px] h-[420px] bg-neon-purple/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[420px] h-[420px] bg-neon-cyan/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-xl mx-auto glass-panel rounded-2xl border border-border/40 p-6 sm:p-8 mt-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">Theory Marks Register Locked</h1>
              <KeyRound className="w-6 h-6 text-neon-cyan" />
            </div>

            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Enter the authorized username and password to unlock this card.
            </p>

            <form className="space-y-4" onSubmit={handleUnlock}>
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Username</label>
                <Input
                  value={unlockUsername}
                  onChange={(event) => setUnlockUsername(event.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="bg-background/40 border-border/40"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Password</label>
                <Input
                  value={unlockPassword}
                  onChange={(event) => setUnlockPassword(event.target.value)}
                  type="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="bg-background/40 border-border/40"
                />
              </div>

              {unlockError && <p className="text-sm text-red-400">{unlockError}</p>}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" className="gap-2">
                  <KeyRound className="w-4 h-4" />
                  Unlock Register
                </Button>
                <Link to="/" className="inline-flex">
                  <Button type="button" variant="outline" className="gap-2 w-full sm:w-auto">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
              Choose a category first. Admin can add categories and also add or remove exams like Board Exam.
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
                  Log in to add categories, add or remove exams, and manage student marks.
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

                <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" onSubmit={handleAddExam}>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">New Exam</label>
                    <Input
                      value={newExamLabel}
                      onChange={(event) => setNewExamLabel(event.target.value)}
                      placeholder="BOARD EXAM"
                      className="bg-background/40 border-border/40"
                    />
                  </div>
                  <div className="xl:col-span-2">
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Existing Exams</label>
                    <div className="flex flex-wrap gap-2">
                      {exams.map((exam) => (
                        <span key={exam.key} className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1 text-xs">
                          {exam.label}
                          <button
                            type="button"
                            onClick={() => handleRemoveExam(exam.key)}
                            className="text-red-400 hover:text-red-300"
                            title={`Remove ${exam.label}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Add Exam
                    </Button>
                  </div>
                </form>

                <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" onSubmit={handleRecordSave}>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Student Name</label>
                    <Input
                      value={recordName}
                      onChange={(event) => setRecordName(normalizeName(event.target.value))}
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

                  {exams.map((exam) => (
                    <div key={exam.key}>
                      <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{exam.label}</label>
                      <Input
                        value={recordFormMarks[exam.key] ?? ""}
                        onChange={(event) =>
                          setRecordFormMarks((prev) => ({
                            ...prev,
                            [exam.key]: event.target.value,
                          }))
                        }
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Optional"
                        className="bg-background/40 border-border/40"
                      />
                    </div>
                  ))}

                  <div className="md:col-span-2 xl:col-span-4 flex flex-col sm:flex-row gap-3">
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
                              {exams.map((exam) => `${exam.label}: ${formatMark(record.marks[exam.key] ?? null)}`).join(" | ")}
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
                      <p>Admin can add/remove exams and categories.</p>
                      <p>Rows with all exam marks empty are automatically blocked.</p>
                      <p>Removing an exam removes that column from all categories.</p>
                    </div>
                    {adminMessage && <div className="mt-4 text-sm text-neon-cyan">{adminMessage}</div>}
                    {adminError && <div className="mt-4 text-sm text-red-400">{adminError}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {examStats.map((stat) => (
              <div key={stat.key} className="glass-panel rounded-2xl p-5 border border-border/40">
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
                    {exams.map((exam) => (
                      <th
                        key={exam.key}
                        className="px-4 sm:px-6 py-4 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground"
                      >
                        {exam.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} className={index % 2 === 0 ? "bg-background/10" : "bg-transparent"}>
                      <td className="px-4 sm:px-6 py-3 border-t border-border/30 font-semibold text-foreground">{record.name}</td>
                      {exams.map((exam) => (
                        <td key={`${record.id}-${exam.key}`} className="px-4 sm:px-6 py-3 border-t border-border/30 text-muted-foreground">
                          {formatMark(record.marks[exam.key] ?? null)}
                        </td>
                      ))}
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
