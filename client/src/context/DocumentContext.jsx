import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DocumentContext = createContext(null);

export function DocumentProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // Active shared document state
  const [currentDoc, setCurrentDoc] = useState({
    file: null,
    filename: '',
    fileType: '',
    text: '',
    topic: '',
    docId: null
  });

  // Generated tool outputs preserved across navigation
  const [notesData, setNotesData] = useState({
    simplifiedText: '',
    keyTakeaways: [],
    definitions: [],
    activeTab: 'simplified'
  });

  const [quizData, setQuizData] = useState({
    activeQuiz: null,
    latestAttempt: null,
    phase: 'setup',
    numQuestions: 5,
    difficulty: 'medium'
  });

  const [conceptMapData, setConceptMapData] = useState({
    title: '',
    description: '',
    rawNodesData: [],
    rawEdgesData: [],
    flowNodes: [],
    flowEdges: []
  });

  // Monotonic request counter to prevent race conditions from out-of-order async responses
  const activeRequestIdRef = useRef(0);

  // Clear state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearDocument();
    }
  }, [isAuthenticated]);

  /**
   * Uploads or activates a new document.
   * Completely replaces the previous document, updates the topic from the new document,
   * invalidates stale async requests, and resets tool-specific outputs.
   */
  const setDocument = useCallback(({ file = null, filename = '', fileType = '', text = '', topic = '', docId = null }) => {
    activeRequestIdRef.current += 1;
    const newReqId = activeRequestIdRef.current;

    setCurrentDoc({
      file,
      filename: filename || file?.name || '',
      fileType: fileType || (filename?.endsWith('.docx') ? 'docx' : 'pdf'),
      text: text || '',
      topic: topic || '',
      docId: docId || null
    });

    // Reset all tool-specific outputs for the previous document
    setNotesData({
      simplifiedText: '',
      keyTakeaways: [],
      definitions: [],
      activeTab: 'simplified'
    });

    setQuizData({
      activeQuiz: null,
      latestAttempt: null,
      phase: 'setup',
      numQuestions: 5,
      difficulty: 'medium'
    });

    setConceptMapData({
      title: '',
      description: '',
      rawNodesData: [],
      rawEdgesData: [],
      flowNodes: [],
      flowEdges: []
    });

    return newReqId;
  }, []);

  /**
   * Updates only the text content (e.g. user manually edits textarea)
   */
  const updateText = useCallback((newText) => {
    setCurrentDoc((prev) => ({ ...prev, text: newText }));
  }, []);

  /**
   * Updates only the topic name (e.g. user manually edits topic field)
   */
  const updateTopic = useCallback((newTopic) => {
    setCurrentDoc((prev) => ({ ...prev, topic: newTopic }));
  }, []);

  /**
   * Checks whether an async request ID is still current (prevents late responses from overwriting newer document)
   */
  const isRequestCurrent = useCallback((reqId) => {
    return reqId === activeRequestIdRef.current;
  }, []);

  /**
   * Updates notes generation state
   */
  const updateNotesData = useCallback((updates) => {
    setNotesData((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Updates quiz generation state
   */
  const updateQuizData = useCallback((updates) => {
    setQuizData((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Updates concept map state
   */
  const updateConceptMapData = useCallback((updates) => {
    setConceptMapData((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Completely clears the active document and all tool data
   */
  const clearDocument = useCallback(() => {
    activeRequestIdRef.current += 1;
    setCurrentDoc({
      file: null,
      filename: '',
      fileType: '',
      text: '',
      topic: '',
      docId: null
    });

    setNotesData({
      simplifiedText: '',
      keyTakeaways: [],
      definitions: [],
      activeTab: 'simplified'
    });

    setQuizData({
      activeQuiz: null,
      latestAttempt: null,
      phase: 'setup',
      numQuestions: 5,
      difficulty: 'medium'
    });

    setConceptMapData({
      title: '',
      description: '',
      rawNodesData: [],
      rawEdgesData: [],
      flowNodes: [],
      flowEdges: []
    });
  }, []);

  const value = {
    currentDoc,
    setDocument,
    updateText,
    updateTopic,
    clearDocument,
    isRequestCurrent,
    getActiveRequestId: () => activeRequestIdRef.current,
    // Notes state
    notesData,
    updateNotesData,
    // Quiz state
    quizData,
    updateQuizData,
    // Concept Map state
    conceptMapData,
    updateConceptMapData
  };

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocument() {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return ctx;
}

export default DocumentContext;
