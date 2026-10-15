import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Folder,
  Save,
  FileText,
  Upload,
  Sparkles
} from 'lucide-react';
import { documentApi, aiApi } from '../services/api';
import { useDocument } from '../context/DocumentContext';
import AudioReader from '../components/common/AudioReader';
import AlertBanner from '../components/common/AlertBanner';

export default function NotesWorkspacePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');

  // Shared persistent document context across tools and navigation
  const {
    currentDoc,
    setDocument,
    updateText,
    updateTopic,
    clearDocument,
    isRequestCurrent,
    getActiveRequestId,
    notesData,
    updateNotesData
  } = useDocument();

  // Local UI / interaction states
  const [subject, setSubject] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDocId, setSavedDocId] = useState(docId || currentDoc.docId || null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  // Synchronize title, originalText, and outputs from shared context
  const title = currentDoc.topic || '';
  const originalText = currentDoc.text || '';
  const selectedFile = currentDoc.file;
  const simplifiedText = notesData.simplifiedText || '';
  const keyTakeaways = notesData.keyTakeaways || [];
  const definitions = notesData.definitions || [];
  const activeTab = notesData.activeTab || 'simplified';

  const setActiveTab = (tab) => updateNotesData({ activeTab: tab });

  // Load existing saved doc if ID is present in query parameters
  useEffect(() => {
    if (!docId) return;

    let isMounted = true;
    async function loadDoc() {
      try {
        setError(null);
        const res = await documentApi.getById(docId);
        if (!isMounted || !res.document) return;

        const doc = res.document;
        setDocument({
          file: null,
          filename: doc.title || '',
          fileType: 'text',
          text: doc.sourceText || doc.originalText || '',
          topic: doc.title || '',
          docId: doc._id
        });

        updateNotesData({
          simplifiedText: doc.simplifiedText || '',
          keyTakeaways: doc.keyPoints || doc.keyTakeaways || [],
          definitions: doc.definitions || [],
          activeTab: 'simplified'
        });

        setSubject(doc.subject || '');
        setSavedDocId(doc._id);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load document.');
      }
    }

    loadDoc();
    return () => { isMounted = false; };
  }, [docId, setDocument, updateNotesData]);

  // Handle PDF and DOCX Upload & Text Extraction
  const handleFileUpload = async (eOrFile) => {
    let file = null;
    if (eOrFile?.target?.files) {
      file = eOrFile.target.files[0];
    } else if (eOrFile instanceof File) {
      file = eOrFile;
    }
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.doc')) {
      setError('Legacy .doc format is not supported. Please save or export your document as .docx or .pdf.');
      return;
    }

    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isDocx = file.type.includes('wordprocessingml') || lowerName.endsWith('.docx');

    if (!isPdf && !isDocx) {
      setError('Only PDF (.pdf) and Word (.docx) documents are supported for upload.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Document file size must be less than 10MB.');
      return;
    }

    // Generate initial clean topic from filename
    const initialTopic = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();

    // Invalidate stale in-flight requests and clear older document state
    const reqId = setDocument({
      file,
      filename: file.name,
      fileType: isDocx ? 'docx' : 'pdf',
      text: '',
      topic: initialTopic,
      docId: null
    });

    setSavedDocId(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsProcessingFile(true);
      const res = await aiApi.extractDocument(formData);

      // Prevent race conditions: check if this is still the active request
      if (!isRequestCurrent(reqId)) return;

      const extracted = res?.extractedText || res?.data?.text || res?.text || '';
      const detectedTopic = res?.topic || res?.data?.topic || initialTopic;

      if (extracted && extracted.trim().length >= 10) {
        setDocument({
          file,
          filename: file.name,
          fileType: isDocx ? 'docx' : 'pdf',
          text: extracted,
          topic: detectedTopic,
          docId: null
        });
      } else {
        setError('No readable text could be extracted from this file. If it is a scanned PDF, OCR is required.');
      }
    } catch (err) {
      if (isRequestCurrent(reqId)) {
        setError(err.message || 'Failed to extract text from document.');
      }
    } finally {
      if (isRequestCurrent(reqId)) {
        setIsProcessingFile(false);
      }
    }
  };

  // Trigger Real AI Simplification
  const handleSimplify = async () => {
    if (!originalText || originalText.trim().length < 20) {
      setError('Please provide at least 20 characters of study notes to simplify.');
      return;
    }

    try {
      setIsSimplifying(true);
      setError(null);

      const res = await aiApi.simplifyNotes({
        text: originalText,
        options: { level: 'beginner', subject: subject || title || 'General' }
      });

      const noteResult = res.result || res.data || res;
      if (noteResult && noteResult.simplifiedText) {
        updateNotesData({
          simplifiedText: noteResult.simplifiedText,
          keyTakeaways: noteResult.keyTakeaways || noteResult.keyPoints || [],
          definitions: noteResult.definitions || [],
          activeTab: 'simplified'
        });
      } else {
        setError('The AI service did not produce readable simplified text. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to simplify notes. Please check connection and try again.');
    } finally {
      setIsSimplifying(false);
    }
  };

  // Save Document to MongoDB Library
  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please provide a title for your notes.');
      return;
    }

    if (!originalText.trim()) {
      setError('Original text cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        subject: subject.trim() || 'General',
        sourceText: originalText,
        simplifiedText,
        keyPoints: keyTakeaways,
        definitions
      };

      let res;
      if (savedDocId) {
        res = await documentApi.update(savedDocId, payload);
      } else {
        res = await documentApi.create(payload);
      }

      if (res.document?._id) {
        setSavedDocId(res.document._id);
        setSaveSuccessMessage('Notes saved successfully to your library!');
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to save notes.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasOutput = Boolean(simplifiedText || keyTakeaways.length > 0 || definitions.length > 0);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Multi-Modal Notes Studio</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            {savedDocId ? 'Edit Study Note' : 'Notes Simplifier Workspace'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/notes/library"
            className="px-4 py-2 border border-charcoal-300 dark:border-charcoal-700 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 text-charcoal-800 dark:text-ivory-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Folder className="w-3.5 h-3.5" aria-hidden="true" />
            <span>My Saved Notes</span>
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !originalText}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isSaving ? 'Saving...' : savedDocId ? 'Update Note' : 'Save to Library'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}
      {saveSuccessMessage && <AlertBanner type="success" message={saveSuccessMessage} onClose={() => setSaveSuccessMessage(null)} />}

      {/* Title & Domain Metadata Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm">
        <div className="md:col-span-2">
          <label htmlFor="note-title" className="block text-xs font-bold text-charcoal-600 dark:text-charcoal-300 uppercase mb-1">
            Document Title / Topic
          </label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => updateTopic(e.target.value)}
            placeholder="e.g. Chapter 4: Cellular Respiration and ATP Cycle"
            className="w-full px-4 py-2 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="note-subject" className="block text-xs font-bold text-charcoal-600 dark:text-charcoal-300 uppercase mb-1">
            Subject / Domain
          </label>
          <input
            id="note-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Biology, History, Physics"
            className="w-full px-4 py-2 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Original Notes Input & Document extraction */}
        <div className="p-6 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              <span>Original Text or Document</span>
            </h2>
            <div className="flex items-center gap-3">
              {originalText && (
                <button
                  type="button"
                  onClick={clearDocument}
                  className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
                >
                  Clear All
                </button>
              )}
              <span className="text-xs font-mono text-charcoal-400">
                {originalText.length} chars
              </span>
            </div>
          </div>

          {/* Document Upload File Input Bar (PDF & DOCX) */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) handleFileUpload(dropped);
            }}
            className="p-3.5 bg-ivory-50 dark:bg-charcoal-800 rounded-2xl border-2 border-dashed border-charcoal-300 dark:border-charcoal-700 hover:border-brand-500 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all"
          >
            <div className="flex items-center gap-2 text-xs text-charcoal-600 dark:text-charcoal-300 truncate max-w-[280px]">
              <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" aria-hidden="true" />
              <span className="font-semibold truncate">
                {selectedFile ? selectedFile.name : currentDoc.filename ? currentDoc.filename : 'Drag & drop or browse PDF or Word (.docx) max 10MB'}
              </span>
            </div>
            <label className="cursor-pointer px-3.5 py-1.5 bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-700 hover:border-brand-500 rounded-xl text-xs font-bold text-brand-700 dark:text-brand-300 shadow-sm transition-all inline-flex items-center gap-1.5 flex-shrink-0">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isProcessingFile ? 'Extracting...' : selectedFile || currentDoc.filename ? 'Change File' : 'Browse File'}</span>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileUpload}
                disabled={isProcessingFile}
                className="sr-only"
              />
            </label>
          </div>

          {/* Raw Textarea */}
          <textarea
            value={originalText}
            onChange={(e) => updateText(e.target.value)}
            rows={14}
            placeholder="Paste your textbook notes, lecture transcript, or study material here..."
            className="w-full p-4 rounded-2xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/40 dark:bg-charcoal-800/40 text-charcoal-900 dark:text-ivory-100 text-sm leading-relaxed resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 font-sans"
          />

          {/* Simplification Trigger Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSimplify}
              disabled={isSimplifying || !originalText.trim()}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 focus-visible:ring-4 focus-visible:ring-brand-400 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>{isSimplifying ? 'AI is Simplifying Notes...' : 'Generate Beginner Explanation & Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Output Tabs & Accessible Views */}
        <div className="p-6 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-4 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-charcoal-100 dark:border-charcoal-800 pb-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('simplified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'simplified'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800'
                }`}
              >
                Simplified
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('takeaways')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'takeaways'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800'
                }`}
              >
                Key Takeaways ({keyTakeaways.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('definitions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'definitions'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800'
                }`}
              >
                Vocabulary ({definitions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comparison')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'comparison'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800'
                }`}
              >
                Side-by-Side
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="flex-1 min-h-[300px]">
            {!hasOutput ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 bg-ivory-50/50 dark:bg-charcoal-800/30 rounded-2xl border border-charcoal-100 dark:border-charcoal-800">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <BookOpen className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="font-extrabold text-sm text-charcoal-900 dark:text-ivory-100">
                  Ready for AI Simplification
                </h3>
                <p className="text-xs text-charcoal-500 max-w-sm leading-relaxed">
                  Upload a PDF or Word document on the left and click "Generate Beginner Explanation" to create structured summaries and vocabulary definitions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Audio Reader Toolbar */}
                {simplifiedText && (
                  <div className="p-2 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border border-charcoal-100 dark:border-charcoal-700 flex justify-between items-center">
                    <AudioReader text={simplifiedText} label="Listen to Explanation" />
                  </div>
                )}

                {/* Tab: Simplified View */}
                {activeTab === 'simplified' && (
                  <div className="prose dark:prose-invert max-w-none text-charcoal-900 dark:text-ivory-100 text-sm leading-relaxed whitespace-pre-line p-2">
                    {simplifiedText}
                  </div>
                )}

                {/* Tab: Key Takeaways */}
                {activeTab === 'takeaways' && (
                  <ul className="space-y-2.5 p-2">
                    {keyTakeaways.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 font-medium"
                      >
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Tab: Vocabulary Definitions */}
                {activeTab === 'definitions' && (
                  <div className="space-y-3 p-2">
                    {definitions.map((def, index) => (
                      <div
                        key={index}
                        className="p-3.5 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 space-y-1"
                      >
                        <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
                          {def.term}
                        </span>
                        <p className="text-xs text-charcoal-600 dark:text-charcoal-300">
                          {def.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: Side-by-Side Comparison */}
                {activeTab === 'comparison' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 text-xs">
                    <div className="p-3 bg-ivory-100 dark:bg-charcoal-800 rounded-xl space-y-2">
                      <span className="font-bold text-charcoal-500 uppercase tracking-wider text-[10px]">
                        Original Source Text
                      </span>
                      <p className="line-clamp-[12] text-charcoal-700 dark:text-charcoal-300 leading-relaxed font-mono text-[11px]">
                        {originalText}
                      </p>
                    </div>
                    <div className="p-3 bg-brand-50/50 dark:bg-brand-950/30 rounded-xl space-y-2 border border-brand-200 dark:border-brand-900">
                      <span className="font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider text-[10px]">
                        Simplified Language
                      </span>
                      <p className="text-charcoal-900 dark:text-ivory-100 leading-relaxed">
                        {simplifiedText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
