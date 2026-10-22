import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { conceptMapApi } from '../services/api';
import AlertBanner from '../components/common/AlertBanner';

export default function ConceptMapLibraryPage() {
  const navigate = useNavigate();
  const [conceptMaps, setConceptMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchConceptMaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await conceptMapApi.getAll();
      if (res.conceptMaps) {
        setConceptMaps(res.conceptMaps);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch saved concept maps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConceptMaps();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete concept map "${title}"?`)) return;

    try {
      setDeletingId(id);
      await conceptMapApi.delete(id);
      setConceptMaps((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete concept map.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMaps = conceptMaps.filter((map) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = map.title?.toLowerCase().includes(q);
    const topicMatch = map.topic?.toLowerCase().includes(q);
    const descMatch = map.description?.toLowerCase().includes(q);
    return titleMatch || topicMatch || descMatch;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <span>🗺️</span> Knowledge Graph Library
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            My Concept Maps ({conceptMaps.length})
          </h1>
        </div>

        <Link
          to="/concept-maps"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 self-start md:self-auto"
        >
          + Create New Concept Map
        </Link>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* Search Bar */}
      <div className="p-4 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concept maps by topic, title, or keywords..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
          <span className="absolute left-3.5 top-2.5 text-charcoal-400">🔍</span>
        </div>
      </div>

      {/* Concept Maps Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm font-semibold text-charcoal-500 animate-pulse">
          Loading concept maps...
        </div>
      ) : filteredMaps.length === 0 ? (
        <div className="p-12 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 text-center space-y-4">
          <span className="text-4xl">🗺️</span>
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
            {searchQuery ? 'No concept maps match your query.' : 'No concept maps created yet.'}
          </h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try changing your search terms.'
              : 'Generate an interactive knowledge graph to visualize complex connections between core concepts.'}
          </p>
          <Link
            to="/concept-maps"
            className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Open ConceptMap AI
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaps.map((map) => (
            <div
              key={map._id}
              className="p-6 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {map.topic || 'General'}
                  </span>
                  <span className="text-[11px] text-charcoal-400 font-mono">
                    {new Date(map.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-charcoal-900 dark:text-ivory-100 leading-snug line-clamp-2">
                  {map.title}
                </h3>

                {map.description && (
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 line-clamp-2 leading-relaxed">
                    {map.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs font-semibold text-charcoal-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span>🟢</span> {map.nodes?.length || 0} Nodes
                  </span>
                  <span className="flex items-center gap-1">
                    <span>🔗</span> {map.edges?.length || 0} Connections
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-charcoal-100 dark:border-charcoal-800 flex items-center justify-between gap-2">
                <Link
                  to={`/concept-maps?id=${map._id}`}
                  className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-bold rounded-lg transition-all"
                >
                  🎨 Open in Canvas
                </Link>

                <button
                  type="button"
                  disabled={deletingId === map._id}
                  onClick={() => handleDelete(map._id, map.title)}
                  className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold rounded-lg transition-all"
                >
                  {deletingId === map._id ? 'Deleting...' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
