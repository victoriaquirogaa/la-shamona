import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { ArrowLeft, RefreshCw, Users, Shuffle } from 'lucide-react';
import { GameModal } from '../GameModal';

interface QuestionsProps {
  username: string;
  onBack: () => void;
}

interface Question {
  text: string;
  category: 'general' | 'personal' | 'hot' | 'group';
}

export function Questions({ username, onBack }: QuestionsProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionHistory, setQuestionHistory] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryModal, setShowCategoryModal] = useState(true);

  const questions: Question[] = [
    // General
    { text: '¿Cuál es tu mayor miedo?', category: 'general' },
    { text: '¿Qué harías si ganaras la lotería?', category: 'general' },
    { text: '¿Cuál es tu talento oculto?', category: 'general' },
    { text: '¿Qué superpoder elegirías?', category: 'general' },
    { text: '¿Con qué famoso/a te gustaría cenar?', category: 'general' },
    
    // Personal
    { text: '¿Cuál fue tu peor cita?', category: 'personal' },
    { text: '¿Alguna vez mentiste para salir de un plan?', category: 'personal' },
    { text: '¿Cuál es tu secreto más vergonzoso?', category: 'personal' },
    { text: '¿Qué es lo más loco que hiciste por amor?', category: 'personal' },
    { text: '¿Stalkeaste a alguien en redes sociales?', category: 'personal' },
    { text: '¿Cuál es tu guilty pleasure?', category: 'personal' },
    
    // Hot
    { text: '¿Con quién de acá tendrías una cita?', category: 'hot' },
    { text: '¿Cuál es tu fantasía más loca?', category: 'hot' },
    { text: '¿Besarías a alguien de este grupo?', category: 'hot' },
    { text: '¿Cuál fue tu experiencia más hot?', category: 'hot' },
    { text: '¿Qué es lo más arriesgado que hiciste?', category: 'hot' },
    { text: '¿Tuviste un crush con alguien acá?', category: 'hot' },
    
    // Group
    { text: '¿Quién del grupo es el/la más divertido/a?', category: 'group' },
    { text: '¿Quién del grupo sería el primero en hacer algo loco?', category: 'group' },
    { text: '¿A quién del grupo llevarías a una isla desierta?', category: 'group' },
    { text: '¿Quién del grupo es el/la más misterioso/a?', category: 'group' },
    { text: '¿Con quién del grupo te irías de viaje?', category: 'group' },
    { text: '¿Quién del grupo tiene más historias locas?', category: 'group' }
  ];

  const getRandomQuestion = () => {
    let availableQuestions = questions.filter(q => 
      !questionHistory.includes(q) && 
      (selectedCategory === 'all' || q.category === selectedCategory)
    );

    // Si ya usamos todas, reiniciar
    if (availableQuestions.length === 0) {
      setQuestionHistory([]);
      availableQuestions = questions.filter(q => 
        selectedCategory === 'all' || q.category === selectedCategory
      );
    }

    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    setCurrentQuestion(randomQuestion);
    setQuestionHistory([...questionHistory, randomQuestion]);
  };

  const getCategoryInfo = (category: string) => {
    const categories: Record<string, { name: string; emoji: string; color: string }> = {
      all: { name: 'Todas', emoji: '🎯', color: 'from-purple-500 to-pink-500' },
      general: { name: 'General', emoji: '💭', color: 'from-blue-500 to-cyan-500' },
      personal: { name: 'Personal', emoji: '🔒', color: 'from-green-500 to-emerald-500' },
      hot: { name: 'Picantes', emoji: '🔥', color: 'from-red-500 to-orange-500' },
      group: { name: 'Grupales', emoji: '👥', color: 'from-indigo-500 to-purple-500' }
    };
    return categories[category] || categories.all;
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
    setQuestionHistory([]);
    setCurrentQuestion(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 mb-6 text-white">
          <div className="flex justify-between items-center">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-2xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-2xl">❓ Preguntas</h1>
              <p className="text-sm text-white/80">
                {getCategoryInfo(selectedCategory).name} {getCategoryInfo(selectedCategory).emoji}
              </p>
            </div>
            <Button
              onClick={() => setShowCategoryModal(true)}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-2xl"
            >
              <Shuffle className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          {currentQuestion ? (
            <motion.div
              key={currentQuestion.text}
              initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8 min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-6">
                    {getCategoryInfo(currentQuestion.category).emoji}
                  </div>
                  <h2 className="text-3xl text-gray-800 mb-4">
                    {currentQuestion.text}
                  </h2>
                  <div className={`inline-block bg-gradient-to-r ${getCategoryInfo(currentQuestion.category).color} text-white px-6 py-2 rounded-full text-sm`}>
                    {getCategoryInfo(currentQuestion.category).name}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8"
            >
              <div className="bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl p-8 min-h-[300px] flex items-center justify-center border-2 border-white/30 border-dashed">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">❓</div>
                  <p className="text-xl">Tocá "Nueva Pregunta" para comenzar</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={getRandomQuestion}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg shadow-lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {currentQuestion ? 'Siguiente Pregunta' : 'Nueva Pregunta'}
          </Button>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-white text-center">
            <p className="text-sm text-white/80">
              {questionHistory.length} pregunta{questionHistory.length !== 1 ? 's' : ''} realizada{questionHistory.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-white"
        >
          <p className="text-sm text-center text-white/80">
            💡 Quien no responda o mienta, ¡toma un trago!
          </p>
        </motion.div>
      </div>

      {/* Category Selection Modal */}
      <GameModal
        isOpen={showCategoryModal}
        onClose={() => currentQuestion ? setShowCategoryModal(false) : null}
        title="Elegí una Categoría"
        showCloseButton={!!currentQuestion}
      >
        <div className="space-y-3">
          {['all', 'general', 'personal', 'hot', 'group'].map((cat) => {
            const info = getCategoryInfo(cat);
            return (
              <Button
                key={cat}
                onClick={() => selectCategory(cat)}
                className={`w-full rounded-2xl bg-gradient-to-r ${info.color} hover:opacity-90 text-white py-4 justify-start text-left`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{info.emoji}</div>
                  <div>
                    <p className="font-bold">{info.name}</p>
                    <p className="text-xs text-white/80">
                      {cat === 'all' ? 'Mezcla de todas las categorías' : 
                       cat === 'general' ? 'Preguntas ligeras y divertidas' :
                       cat === 'personal' ? 'Preguntas más íntimas' :
                       cat === 'hot' ? 'Preguntas atrevidas' :
                       'Preguntas sobre el grupo'}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </GameModal>
    </div>
  );
}
