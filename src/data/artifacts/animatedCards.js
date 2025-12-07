/**
 * Animated Cards Demo
 * Showcases Framer Motion animations available via CDN - Modern responsive design
 */

export const animatedCardsArtifact = {
  id: 'animated-cards',
  name: 'Animated Cards',
  description: 'Interactive cards showcasing Framer Motion capabilities: hover scale effects, click interactions, draggable elements, and AnimatePresence for smooth enter/exit animations. A hands-on demo of animation fundamentals.',
  icon: 'sparkles',
  category: 'demos',
  files: {
    'App.jsx': `
function App() {
  const [cards, setCards] = useState([
    { id: 1, title: 'Hover Me', color: 'from-purple-500 to-pink-500' },
    { id: 2, title: 'Click Me', color: 'from-blue-500 to-cyan-500' },
    { id: 3, title: 'Drag Me', color: 'from-orange-500 to-yellow-500' },
  ]);
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 p-4 sm:p-6 lg:p-8">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center mb-6 sm:mb-8"
      >
        Framer Motion Demo
      </motion.h1>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.2, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            drag={card.id === 3}
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            onClick={() => setSelected(selected === card.id ? null : card.id)}
            className={\`bg-gradient-to-br \${card.color} rounded-2xl sm:rounded-3xl p-4 sm:p-6 cursor-pointer shadow-xl shadow-black/20 backdrop-blur-sm border border-white/10\`}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{card.title}</h2>
            <p className="text-white/80 text-xs sm:text-sm">
              {card.id === 1 && 'Hover to see scale effect'}
              {card.id === 2 && 'Click to select/deselect'}
              {card.id === 3 && 'Drag me around!'}
            </p>

            <AnimatePresence>
              {selected === card.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20"
                >
                  <p className="text-white text-xs sm:text-sm">
                    This content animates in and out smoothly using AnimatePresence!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 sm:mt-12 text-center"
      >
        <p className="text-gray-400 text-xs sm:text-sm">
          All animations powered by Framer Motion via CDN
        </p>
      </motion.div>
    </div>
  );
}

export default App;
`
  }
};
