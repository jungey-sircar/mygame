import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import Confetti from '@/components/Confetti';
import { getCategoryBadgeTone, getCategoryLabel } from '../lib/categoryStyles';

interface MillionaireQuestionDisplayProps {
  question: any;
  showAnswer: boolean;
  onToggleAnswer: () => void;
  onHideQuestion: () => void;
  state: any;
}

const MillionaireQuestionDisplay = ({
  question,
  showAnswer,
  onToggleAnswer,
  onHideQuestion,
  state,
}: MillionaireQuestionDisplayProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedIndex(null);
    setShowResult(false);
    setIsCorrect(false);
  }, [question?.id]);

  const handleOptionClick = (index: number) => {
    if (showResult) return; // Don't allow changing selection after showing result

    setSelectedIndex(index);
    const correct = index === question.correctIndex;
    setIsCorrect(correct);
    setShowResult(true);

    // Auto reveal answer if wrong
    if (!correct) {
      setTimeout(() => {
        // Keep showing result
      }, 1000);
    }
  };

  const options = question.options || [];

  return (
    <>
      {isCorrect && showResult && <Confetti />}

      <motion.div
        key={question.id}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className="max-w-4xl w-full text-center space-y-8"
      >
        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${getCategoryBadgeTone(question.category)}`}>
          {getCategoryLabel(question.category)}
        </span>

        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight">
          {question.text}
        </h2>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
          {options.map((option: string, index: number) => {
            let bgColor = 'bg-muted/20 hover:bg-muted/30 border-border hover:border-neon-cyan/40';
            let textColor = 'text-foreground';
            let borderColor = 'border-border';

            if (showResult && selectedIndex === index) {
              if (isCorrect) {
                bgColor = 'bg-green-500/20 hover:bg-green-500/20';
                textColor = 'text-green-400';
                borderColor = 'border-green-500/50';
              } else {
                bgColor = 'bg-red-500/20 hover:bg-red-500/20';
                textColor = 'text-red-400';
                borderColor = 'border-red-500/50';
              }
            } else if (showResult && index === question.correctIndex) {
              bgColor = 'bg-green-500/20 hover:bg-green-500/20';
              textColor = 'text-green-400';
              borderColor = 'border-green-500/50';
            }

            return (
              <motion.button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={showResult}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 rounded-lg border-2 transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed
                  ${bgColor} ${borderColor}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Option {String.fromCharCode(65 + index)}
                    </div>
                    <p className={`text-lg font-semibold ${textColor}`}>
                      {option}
                    </p>
                  </div>
                  {showResult && selectedIndex === index && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                    >
                      {isCorrect ? (
                        <Check className="w-6 h-6 text-green-400" />
                      ) : (
                        <X className="w-6 h-6 text-red-400" />
                      )}
                    </motion.div>
                  )}
                  {showResult && index === question.correctIndex && selectedIndex !== index && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="w-6 h-6 text-green-400" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Show correct answer message */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg border ${
                isCorrect
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <p className="font-bold">
                {isCorrect ? '🎉 Correct Answer!' : '❌ Wrong Answer'}
              </p>
              {!isCorrect && (
                <p className="text-sm mt-1">
                  The correct answer is: <span className="font-bold">{question.options[question.correctIndex]}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button size="lg" variant="secondary" onClick={onToggleAnswer} className="gap-2">
            {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
            {showAnswer ? 'Hide Answer' : 'Reveal Answer'}
          </Button>
          <Button size="lg" variant="outline" onClick={onHideQuestion} className="gap-2">
            <EyeOff size={16} /> Hide Question
          </Button>
        </div>
      </motion.div>
    </>
  );
};

export default MillionaireQuestionDisplay;
