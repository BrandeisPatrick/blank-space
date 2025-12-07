/**
 * Data Fetcher Demo
 * Showcases fetching data from APIs using native fetch - Modern responsive design
 */

export const dataFetcherArtifact = {
  id: 'data-fetcher',
  name: 'API Data Fetcher',
  description: 'A user directory that fetches data from JSONPlaceholder API. Demonstrates native fetch() with async/await, skeleton loading states, error handling with retry, and animated card grid with staggered entrance.',
  icon: 'globe',
  category: 'demos',
  files: {
    'App.jsx': `
function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">API Data Fetcher</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors text-sm sm:text-base shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 backdrop-blur border border-red-500/50 rounded-xl p-4 mb-4 sm:mb-6"
          >
            <p className="text-red-400 text-sm sm:text-base">Error: {error}</p>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-6 animate-pulse shadow-lg shadow-black/10">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-700"></div>
                  <div className="flex-1">
                    <div className="h-5 sm:h-6 bg-slate-700 rounded w-3/4 mb-2 sm:mb-3"></div>
                    <div className="h-3 sm:h-4 bg-slate-700 rounded w-1/2 mb-1 sm:mb-2"></div>
                    <div className="h-3 sm:h-4 bg-slate-700 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/10 transition-shadow hover:shadow-xl"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-white truncate">{user.name}</h2>
                      <p className="text-slate-400 text-xs sm:text-sm truncate">{user.email}</p>
                      <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">@{user.username}</p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700/50">
                    <p className="text-slate-400 text-xs sm:text-sm">
                      <span className="text-slate-500">Company:</span> {user.company?.name}
                    </p>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      <span className="text-slate-500">City:</span> {user.address?.city}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <p className="text-center text-slate-500 text-xs sm:text-sm mt-6 sm:mt-8">
          Data from JSONPlaceholder API
        </p>
      </motion.div>
    </div>
  );
}

export default App;
`
  }
};
