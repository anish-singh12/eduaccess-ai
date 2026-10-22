import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  Network,
  FileText,
  Upload,
  Sparkles,
  Save,
  BookOpen,
  X
} from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { conceptMapApi, aiApi } from '../services/api';
import { useDocument } from '../context/DocumentContext';
import { useTheme } from '../context/ThemeContext';
import ConceptNode from '../components/conceptMap/ConceptNode';
import NodeDetailPanel from '../components/conceptMap/NodeDetailPanel';
import AlertBanner from '../components/common/AlertBanner';

export default function ConceptMapStudioPage() {
  const { isDark } = useTheme();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mapId = searchParams.get('id');

  // Shared persistent document context across tools and navigation
  const {
    currentDoc,
    setDocument,
    updateText,
    updateTopic,
    clearDocument,
    isRequestCurrent,
    conceptMapData,
    updateConceptMapData
  } = useDocument();

  // Generator inputs synchronized with shared context
  const topic = currentDoc.topic || location.state?.initialTopic || '';
  const contextText = currentDoc.text || location.state?.initialText || '';
  const selectedFile = currentDoc.file;

  const [depth, setDepth] = useState('detailed'); // 'overview' | 'detailed' | 'deep'
  const [isExtractingFile, setIsExtractingFile] = useState(false);

  // Map metadata & data states
  const title = conceptMapData.title || (topic ? `${topic} Concept Map` : '');
  const mapDescription = conceptMapData.description || '';
  const [currentMapId, setCurrentMapId] = useState(mapId || null);

  // Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(conceptMapData.flowNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(conceptMapData.flowEdges || []);
  const rawNodesData = conceptMapData.rawNodesData || [];
  const rawEdgesData = conceptMapData.rawEdgesData || [];
  const [selectedNodeData, setSelectedNodeData] = useState(null);

  // Sync flow states whenever conceptMapData changes
  useEffect(() => {
    if (conceptMapData.flowNodes && conceptMapData.flowNodes.length > 0) {
      setNodes(conceptMapData.flowNodes);
      setEdges(conceptMapData.flowEdges || []);
    }
  }, [conceptMapData.flowNodes, conceptMapData.flowEdges, setNodes, setEdges]);

  const [showGenerateModal, setShowGenerateModal] = useState(
    !mapId && !conceptMapData.flowNodes?.length && !location.state?.initialText && !currentDoc.text
  );

  // Prevent background scrolling while the modal is open
  useEffect(() => {
    if (showGenerateModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showGenerateModal]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [error, setError] = useState(null);

  const nodeTypes = useMemo(() => ({ concept: ConceptNode }), []);

  // Compute Layout Positions for Concept Nodes
  const calculateLayout = useCallback((nodesList, edgesList) => {
    const levelSpacingY = 160;
    const nodeSpacingX = 260;

    const levels = {};
    nodesList.forEach((n) => {
      const lvl =
        typeof n.data?.level === 'number'
          ? n.data.level
          : typeof n.level === 'number'
          ? n.level
          : 1;
      if (!levels[lvl]) levels[lvl] = [];
      levels[lvl].push(n);
    });

    const flowNodes = [];
    Object.entries(levels).forEach(([lvlStr, list]) => {
      const lvl = parseInt(lvlStr, 10);
      const totalInLevel = list.length;
      const startX = -((totalInLevel - 1) * nodeSpacingX) / 2 + 350;

      list.forEach((n, idx) => {
        const xPos =
          typeof n.position?.x === 'number'
            ? n.position.x
            : startX + idx * nodeSpacingX;
        const yPos =
          typeof n.position?.y === 'number'
            ? n.position.y
            : 50 + lvl * levelSpacingY;

        flowNodes.push({
          id: n.id,
          type: 'concept',
          position: { x: xPos, y: yPos },
          data: {
            label: n.data?.label || n.label || 'Concept',
            description: n.data?.description || n.description || '',
            level: lvl,
            details: n.data?.details || n.details || [],
            keywords: n.data?.keywords || n.keywords || [],
            importance: n.data?.importance || n.importance || (lvl === 0 ? 'high' : 'medium')
          }
        });
      });
    });

    const flowEdges = edgesList.map((e, idx) => ({
      id: e.id || `e-${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      label: e.label || '',
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#2d6a4f',
        width: 18,
        height: 18
      },
      style: { stroke: '#2d6a4f', strokeWidth: 2 }
    }));

    return { flowNodes, flowEdges };
  }, []);

  // Load existing saved map if ID is in URL query parameters
  useEffect(() => {
    if (!mapId) return;

    let isMounted = true;
    async function loadMap() {
      try {
        setError(null);
        const res = await conceptMapApi.getById(mapId);
        if (!isMounted || !res.conceptMap) return;

        const map = res.conceptMap;
        setCurrentMapId(map._id);

        const { flowNodes, flowEdges } = calculateLayout(map.nodes || [], map.edges || []);
        updateConceptMapData({
          title: map.title || '',
          description: map.description || '',
          rawNodesData: map.nodes || [],
          rawEdgesData: map.edges || [],
          flowNodes,
          flowEdges
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
        setShowGenerateModal(false);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load concept map.');
      }
    }

    loadMap();
    return () => { isMounted = false; };
  }, [mapId, calculateLayout, setNodes, setEdges, updateConceptMapData]);

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

    // Immediately update topic to match new file and clear older outputs
    const newTopic = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
    const reqId = setDocument({
      file,
      filename: file.name,
      fileType: isDocx ? 'docx' : 'pdf',
      text: '',
      topic: newTopic,
      docId: null
    });

    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsExtractingFile(true);
      const res = await aiApi.extractDocument(formData);

      if (!isRequestCurrent(reqId)) return; // Invalidate stale response

      const extracted = res?.extractedText || res?.data?.text || res?.text || '';
      const detectedTopic = res?.topic || res?.data?.topic || newTopic;

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
        setError('No text could be extracted from this document. If it is a scanned image, OCR is required.');
      }
    } catch (err) {
      if (isRequestCurrent(reqId)) {
        setError(err.message || 'Failed to extract text from document.');
      }
    } finally {
      if (isRequestCurrent(reqId)) {
        setIsExtractingFile(false);
      }
    }
  };

  // Handle AI generation
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();

    const finalContextText = (currentDoc.text || contextText).trim();
    const finalTopic = (currentDoc.topic || topic).trim();

    if (!finalTopic && !finalContextText) {
      setError('Please provide a topic or study text to generate a concept map.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const res = await aiApi.generateConceptMap({
        topic: finalTopic || 'General Subject',
        text: finalContextText,
        options: { depth }
      });

      const generated = res.conceptMap || res.data?.conceptMap || res.data || res;
      if (generated && Array.isArray(generated.nodes) && generated.nodes.length > 0) {
        const genTitle = generated.title || `${finalTopic || 'Subject'} Concept Map`;
        const genDesc = generated.description || generated.summary || '';
        const { flowNodes, flowEdges } = calculateLayout(generated.nodes, generated.edges || []);

        updateConceptMapData({
          title: genTitle,
          description: genDesc,
          rawNodesData: generated.nodes,
          rawEdgesData: generated.edges || [],
          flowNodes,
          flowEdges
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
        setShowGenerateModal(false);
      } else {
        setError('The AI service did not produce usable concept map nodes. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate concept map.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Node selection for detail drawer
  const onNodeClick = useCallback(
    (_, node) => {
      const raw = rawNodesData.find((n) => n.id === node.id) || {
        id: node.id,
        ...node.data
      };
      setSelectedNodeData(raw);
    },
    [rawNodesData]
  );

  // Save map to MongoDB
  const handleSaveMap = async () => {
    if (isSaving) return;

    if (!title.trim()) {
      setError('Please provide a title for the concept map.');
      return;
    }

    if (!nodes || nodes.length === 0) {
      setError('Cannot save an empty concept map. Please generate concepts first.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        topic: (currentDoc.topic || topic).trim() || 'General',
        summary: mapDescription || '',
        description: mapDescription || '',
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type || 'concept',
          position: {
            x: typeof n.position?.x === 'number' ? n.position.x : 0,
            y: typeof n.position?.y === 'number' ? n.position.y : 0
          },
          data: {
            label: n.data?.label || n.label || 'Concept',
            description: n.data?.description || n.description || '',
            level: n.data?.level ?? n.level ?? 1,
            details: n.data?.details || n.details || [],
            keywords: n.data?.keywords || n.keywords || [],
            importance: n.data?.importance || n.importance || 'medium'
          }
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || '',
          animated: Boolean(e.animated)
        }))
      };

      let res;
      if (currentMapId) {
        res = await conceptMapApi.update(currentMapId, payload);
      } else {
        res = await conceptMapApi.create(payload);
      }

      const savedMap = res?.conceptMap || res?.data?.conceptMap;
      if (savedMap?._id) {
        setCurrentMapId(savedMap._id);
        setSaveSuccess('Concept map saved successfully!');
        setTimeout(() => setSaveSuccess(null), 4000);
      } else {
        throw new Error('Save completed, but did not receive confirmation from server.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save concept map.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Network className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ConceptMap AI Canvas</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            {title || 'Interactive Knowledge Graph'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Generate / Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSaveMap}
            disabled={isSaving || nodes.length === 0}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isSaving ? 'Saving...' : currentMapId ? 'Update Map' : 'Save Map'}</span>
          </button>

          <Link
            to="/concept-maps/library"
            className="px-3 py-2 border border-charcoal-300 dark:border-charcoal-700 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 text-charcoal-800 dark:text-ivory-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Library</span>
          </Link>
        </div>
      </div>

      {saveSuccess && (
        <AlertBanner type="success" message={saveSuccess} onClose={() => setSaveSuccess(null)} />
      )}
      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* Main Canvas View Container */}
      <div className="relative w-full h-[650px] bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
        {nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Network className="w-8 h-8" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
              No Concept Map Loaded
            </h2>
            <p className="text-xs text-charcoal-500 max-w-md">
              Generate an interactive knowledge graph from any topic, chapter, or uploaded study notes.
            </p>
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Generate Concept Map Now</span>
            </button>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            colorMode={isDark ? 'dark' : 'light'}
            attributionPosition="bottom-right"
            className="w-full h-full"
          >
            <Background gap={18} size={1} color={isDark ? '#475569' : '#94a3b8'} />
            <Controls
              position="bottom-left"
              className="react-flow-controls-custom"
            />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="bg-ivory-50/80 dark:bg-charcoal-800/80 border border-charcoal-200 dark:border-charcoal-700 rounded-xl overflow-hidden shadow-sm"
              maskColor={isDark ? 'rgba(20, 20, 25, 0.7)' : 'rgba(240, 240, 240, 0.6)'}
            />
          </ReactFlow>
        )}

        {/* Selected Node Details Drawer */}
        {selectedNodeData && (
          <div className="absolute top-0 right-0 w-80 md:w-96 h-full z-20 shadow-2xl">
            <NodeDetailPanel
              node={selectedNodeData}
              edges={rawEdgesData.length > 0 ? rawEdgesData : edges}
              nodes={nodes}
              onClose={() => setSelectedNodeData(null)}
            />
          </div>
        )}
      </div>

      {/* Generator Modal mounted to document.body */}
      {showGenerateModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#14181e]/35 backdrop-blur-[4px] transition-opacity duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-concept-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowGenerateModal(false);
            }}
          >
            <div className="bg-white dark:bg-charcoal-900 rounded-3xl p-6 md:p-8 max-w-xl w-full border border-charcoal-200 dark:border-charcoal-800 shadow-2xl space-y-6 relative z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="modal-concept-title" className="text-xl font-extrabold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                    <Network className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>Generate Concept Map</span>
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    AI will extract nodes, hierarchies, and relationship links
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  aria-label="Close modal"
                  className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200 transition-colors"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label htmlFor="gen-topic" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                    Topic or Concept Name
                  </label>
                  <input
                    id="gen-topic"
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => updateTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis, Neural Networks, World War I"
                    className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="gen-depth" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                    Graph Detail Level
                  </label>
                  <select
                    id="gen-depth"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <option value="overview">Overview (4-6 core nodes)</option>
                    <option value="detailed">Detailed (8-12 nodes with sub-concepts)</option>
                    <option value="deep">Deep Dive (15+ nodes with multi-level relations)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="gen-context" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                    Study Material
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                        Upload PDF / Word or Paste Text
                      </span>
                      {(selectedFile || currentDoc.filename || contextText) && (
                        <button
                          type="button"
                          onClick={clearDocument}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Clear Document
                        </button>
                      )}
                    </div>

                    {/* Document Upload Area (PDF & DOCX) */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedFile = e.dataTransfer.files?.[0];
                        if (droppedFile) handleFileUpload(droppedFile);
                      }}
                      className="p-4 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border-2 border-dashed border-charcoal-300 dark:border-charcoal-700 hover:border-emerald-500 flex flex-col items-center justify-between gap-3 text-center transition-all"
                    >
                      {isExtractingFile ? (
                        <div className="flex flex-col items-center space-y-2 py-3">
                          <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></span>
                          <span className="text-xs font-semibold text-emerald-600">Extracting text from document...</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-xs text-charcoal-600 dark:text-charcoal-300">
                            {selectedFile || currentDoc.filename ? (
                              <>
                                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden="true" />
                                <span className="font-bold truncate max-w-[200px]">
                                  {selectedFile ? selectedFile.name : currentDoc.filename}
                                </span>
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  (Ready)
                                </span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-5 h-5 text-charcoal-400 dark:text-charcoal-500 flex-shrink-0" aria-hidden="true" />
                                <span>Drag & drop PDF or Word (.docx) here, or browse</span>
                              </>
                            )}
                          </div>
                          <label className="cursor-pointer px-4 py-2 bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-700 hover:border-emerald-500 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-sm transition-all inline-flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{selectedFile || currentDoc.filename ? 'Change Document' : 'Browse File (max 10MB)'}</span>
                            <input
                              type="file"
                              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileUpload}
                              disabled={isExtractingFile}
                              className="sr-only"
                            />
                          </label>
                        </>
                      )}
                    </div>

                    <textarea
                      id="gen-context"
                      rows={5}
                      value={contextText}
                      onChange={(e) => updateText(e.target.value)}
                      placeholder="Or paste chapter text, bullet points, or lecture transcript..."
                      className="w-full p-4 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 leading-relaxed resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-charcoal-600 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:text-ivory-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || (!topic.trim() && !contextText.trim())}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isGenerating ? 'AI Generating Knowledge Graph...' : 'Generate Graph'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
