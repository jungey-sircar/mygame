import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";

const languages = [
  { name: "C Quiz", icon: "🟦", route: "/quiz/c", description: "100 questions on C fundamentals", color: "from-blue-500/20 to-blue-600/10" },
  { name: "Java Quiz", icon: "🟨", route: "/quiz/java", description: "60 popular Java questions", color: "from-amber-500/20 to-yellow-600/10" },
  { name: "Python Quiz", icon: "🟩", route: "/quiz/python", description: "60 popular Python questions", color: "from-green-500/20 to-emerald-600/10" },
];

const QuizHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-cyan/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 sm:py-20">
        {/* Back button */}
        <button onClick={() => navigate("/")} className="mb-8 p-2 rounded-lg glass-panel hover:bg-muted/50 transition-colors text-muted-foreground inline-flex items-center gap-2 font-body text-sm">
          <ArrowLeft size={18} /> Back to Arena
        </button>

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-foreground mb-3 text-glow-purple">🧠 Quiz Portal</h1>
          <p className="font-body text-lg text-muted-foreground">Select a category to begin</p>
          <div className="mt-6 mx-auto w-48 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-60" />
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {languages.map((lang, i) => (
            <motion.button
              key={lang.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(lang.route)}
              className="glass-panel p-6 sm:p-8 text-center group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${lang.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none gradient-border" />
              <div className="relative z-10">
                <span className="text-5xl block mb-4">{lang.icon}</span>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{lang.name}</h3>
                <p className="font-body text-sm text-muted-foreground">{lang.description}</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-neon-cyan font-display text-sm font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>START</span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizHome;
