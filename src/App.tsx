import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SpinWheel from "./pages/SpinWheel";
import RockPaperScissors from "./pages/RockPaperScissors";
import SpinWheel2 from "./pages/SpinWheel2";
import SocialArena from "./pages/SocialArena";
import VisionaryArena from "./pages/VisionaryArena";
import TrolleySimulator from "./pages/TrolleySimulator";
import SettleThis from "./pages/SettleThis";
import AuctionChallenge from "./pages/AuctionChallenge";
import WhoWasAlive from "./pages/WhoWasAlive";
import DrawCircle from "./pages/DrawCircle";
import MemoryMatch from "./pages/MemoryMatch";
import SpendBinod from "./pages/SpendBinod";
import LifeProgress from "./pages/LifeProgress";
import UniverseForecast from "./pages/UniverseForecast";
import PasswordChallenge from "./pages/PasswordChallenge";
import QuizHome from "./quiz/QuizHome";
import CQuizPage from "./quiz/CQuizPage";
import JavaQuizPage from "./quiz/JavaQuizPage";
import PythonQuizPage from "./quiz/PythonQuizPage";
import ImposterClassroom from "./pages/ImposterClassroom";
import WordBingo from "./pages/word-bingo/WordBingo";
import NumberBingo from "./pages/number-bingo/NumberBingo";
import ImpromptuPage from "./pages/impromptu/ImpromptuPage";
import MotivationHub from "./pages/motivation/MotivationHub";
import TicTacToe from "./pages/TicTacToe";
import VisualCodeLab from "./pages/visualcode/VisualCodeLab";
import VisualCodeStudio from "./pages/visualcode/VisualCodeStudio";
import TheoryMarks from "./pages/TheoryMarks";
import QuizCompetition from "./pages/quiz-competition/QuizCompetition";
import LoopArcade from "./pages/LoopArcade";
import RandomNumberDuel from "./pages/RandomNumberDuel";
import SpaceLaunchGame from "./pages/SubwaySurferDash";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/spin" element={<SpinWheel />} />
            <Route path="/rps" element={<RockPaperScissors />} />
            <Route path="/spin2" element={<SpinWheel2 />} />
            <Route path="/social" element={<SocialArena />} />
            <Route path="/visionary" element={<VisionaryArena />} />
            <Route path="/trolley" element={<TrolleySimulator />} />
            <Route path="/settle" element={<SettleThis />} />
            <Route path="/auction" element={<AuctionChallenge />} />
            <Route path="/alive" element={<WhoWasAlive />} />
            <Route path="/circle" element={<DrawCircle />} />
            <Route path="/memory-match" element={<MemoryMatch />} />
            <Route path="/spend-binod" element={<SpendBinod />} />
            <Route path="/life-progress" element={<LifeProgress />} />
            <Route path="/universe-forecast" element={<UniverseForecast />} />
            <Route path="/password-challenge" element={<PasswordChallenge />} />
            <Route path="/quiz" element={<QuizHome />} />
            <Route path="/quiz/c" element={<CQuizPage />} />
            <Route path="/quiz/java" element={<JavaQuizPage />} />
            <Route path="/quiz/python" element={<PythonQuizPage />} />
            <Route path="/imposter" element={<ImposterClassroom />} />
            <Route path="/word-bingo" element={<WordBingo />} />
            <Route path="/number-bingo" element={<NumberBingo />} />
            <Route path="/impromptu" element={<ImpromptuPage />} />
            <Route path="/motivation" element={<MotivationHub />} />
            <Route path="/tic-tac-toe" element={<TicTacToe />} />
            <Route path="/visualcode-lab" element={<VisualCodeLab />} />
            <Route path="/visualcode-studio" element={<VisualCodeStudio />} />
            <Route path="/theory-marks" element={<TheoryMarks />} />
            <Route path="/quiz-competition" element={<QuizCompetition />} />
            <Route path="/random-number-duel" element={<RandomNumberDuel />} />
            <Route path="/loop-arcade" element={<LoopArcade />} />
            <Route path="/space-launch" element={<SpaceLaunchGame />} />
            <Route path="/subway-sprint" element={<SpaceLaunchGame />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
