import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Folder,
  Search,
  BookOpen,
  Check,
  Edit3,
  Trash2,
  Network,
  FileQuestion
} from 'lucide-react';
import { documentApi } from '../services/api';
import AlertBanner from '../components/common/AlertBanner';
import AudioReader from '../components/common/AudioReader';

export default function NotesLibraryPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await documentApi.getAll();
      if (res.documents) {
        setDocuments(res.documents);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch saved documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete note "${title}"?`)) return;

    try {
      setDeletingId(id);
      await documentApi.delete(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete note.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = doc.title?.toLowerCase().includes(q);
    const subjectMatch = doc.subject?.toLowerCase().includes(q);
    const textMatch = doc.simplifiedText?.toLowerCase().includes(q) || doc.originalText?.toLowerCase().includes(q);
    return titleMatch || subjectMatch || textMatch;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <Folder className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Study Repository</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            My Saved Notes ({documents.length})
          </h1>
        </div>

        <Link
          to="/notes"
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-brand-500 self-start md:self-auto"
        >
          + Simplify New Note
        </Link>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* Search and Filters */}
      <div className="p-4 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, subject, or keywords..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" aria-hidden="true" />
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm font-semibold text-charcoal-500 animate-pulse">
          Loading saved study notes...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400">
            <BookOpen className="w-7 h-7" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
            {searchQuery ? 'No notes matched your search.' : 'Your notes library is empty.'}
          </h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms or clearing the filter.'
              : 'Start by uploading a PDF or pasting textbook notes to generate your first simplified study document.'}
          </p>
          <Link
            to="/notes"
            className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Create New Note
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const hasTakeaways = doc.keyTakeaways && doc.keyTakeaways.length > 0;
            const hasDefinitions = doc.definitions && doc.definitions.length > 0;

            return (
              <div
                key={doc._id}
                className="p-6 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300">
                      {doc.subject || 'General'}
                    </span>
                    <span className="text-[11px] text-charcoal-400 font-mono">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-charcoal-900 dark:text-ivory-100 leading-snug line-clamp-2">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 line-clamp-3 leading-relaxed">
                    {doc.simplifiedText || doc.originalText}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-charcoal-400">
                    {hasTakeaways && (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                        <span>{doc.keyTakeaways.length} Takeaways</span>
                      </span>
                    )}
                    {hasDefinitions && <span>• {doc.definitions.length} Terms</span>}
                  </div>
                </div>

                <div className="pt-4 border-t border-charcoal-100 dark:border-charcoal-800 space-y-3">
                  <AudioReader
                    text={`${doc.title}. ${doc.simplifiedText || doc.originalText}`}
                    label="Listen to Note"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/notes?id=${doc._id}`}
                      className="px-3 py-1.5 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 hover:bg-brand-100 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Edit in Workspace</span>
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === doc._id}
                      onClick={() => handleDelete(doc._id, doc.title)}
                      aria-label="Delete note"
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold rounded-lg transition-all"
                    >
                      {deletingId === doc._id ? 'Deleting...' : <Trash2 className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>

                  {/* Fast action links */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/concept-maps', {
                          state: { initialTopic: doc.title, initialText: doc.simplifiedText || doc.originalText }
                        });
                      }}
                      className="flex-1 py-1.5 px-2 text-center text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <Network className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/quizzes', {
                          state: { initialTopic: doc.title, initialText: doc.simplifiedText || doc.originalText }
                        });
                      }}
                      className="flex-1 py-1.5 px-2 text-center text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <FileQuestion className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Quiz</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
