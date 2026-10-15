import { ConceptMap } from '../models/ConceptMap.js';
import { isValidObjectId } from '../utils/sanitize.js';
import { isDatabaseConnected } from '../config/db.js';

/**
 * Normalizes graph nodes to guarantee both React Flow properties ({ id, type, position, data })
 * and top-level convenience properties ({ label, description, level, ... }) are populated.
 */
function normalizeNodes(nodes = []) {
  return nodes.map((n, idx) => {
    const id = String(n.id || (idx === 0 ? 'root' : `node_${idx}`));
    const position = {
      x: typeof n.position?.x === 'number' ? n.position.x : 0,
      y: typeof n.position?.y === 'number' ? n.position.y : 0
    };
    const label = String(n.data?.label || n.label || `Concept ${idx + 1}`).trim();
    const desc = String(n.data?.description || n.description || '').trim();
    const level =
      typeof n.data?.level === 'number'
        ? n.data.level
        : typeof n.level === 'number'
        ? n.level
        : idx === 0
        ? 0
        : 1;
    const details = Array.isArray(n.data?.details)
      ? n.data.details
      : Array.isArray(n.details)
      ? n.details
      : n.data?.details
      ? [String(n.data.details)]
      : [];
    const keywords = Array.isArray(n.data?.keywords)
      ? n.data.keywords
      : Array.isArray(n.keywords)
      ? n.keywords
      : [];
    const importance =
      n.data?.importance || n.importance || (level === 0 ? 'high' : 'medium');

    return {
      id,
      type: n.type || 'concept',
      position,
      data: {
        label,
        description: desc,
        level,
        details,
        keywords,
        importance,
        ...(n.data || {})
      },
      label,
      description: desc,
      level,
      details,
      keywords,
      importance
    };
  });
}

/**
 * Normalizes graph edges ensuring all required directional fields exist.
 */
function normalizeEdges(edges = []) {
  return edges.map((e, idx) => ({
    id: String(e.id || `e_${e.source}_${e.target}_${idx}`),
    source: String(e.source),
    target: String(e.target),
    label: String(e.label || ''),
    animated: Boolean(e.animated)
  }));
}

/**
 * List all concept maps owned by the user
 */
export async function listConceptMaps(req, res, next) {
  try {
    const userId = req.user._id;

    if (!isDatabaseConnected()) {
      return res.status(200).json({
        success: true,
        data: { conceptMaps: [], total: 0 },
        conceptMaps: []
      });
    }

    const conceptMaps = await ConceptMap.find({ userId })
      .select('title topic summary description documentId createdAt updatedAt nodes edges')
      .sort({ updatedAt: -1 })
      .lean();

    const formattedMaps = conceptMaps.map((m) => ({
      ...m,
      topic: m.topic || 'General',
      description: m.description || m.summary || '',
      nodeCount: m.nodes?.length || 0,
      edgeCount: m.edges?.length || 0
    }));

    res.status(200).json({
      success: true,
      data: {
        conceptMaps: formattedMaps,
        total: formattedMaps.length
      },
      conceptMaps: formattedMaps
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single concept map by ID with ownership verification
 */
export async function getConceptMapById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid concept map ID' }
      });
    }

    const conceptMap = await ConceptMap.findOne({ _id: id, userId }).lean();
    if (!conceptMap) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Concept map not found or access denied.' }
      });
    }

    res.status(200).json({
      success: true,
      data: { conceptMap },
      conceptMap
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new concept map
 */
export async function createConceptMap(req, res, next) {
  try {
    const userId = req.user._id;
    const { documentId, title, summary, description, topic, nodes, edges } = req.body;

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is not connected.' }
      });
    }

    const normalizedNodes = normalizeNodes(nodes);
    const normalizedEdges = normalizeEdges(edges);

    const map = await ConceptMap.create({
      userId,
      documentId: documentId || null,
      title: title.trim(),
      topic: (topic || 'General').trim(),
      summary: (summary || description || '').trim(),
      description: (description || summary || '').trim(),
      nodes: normalizedNodes,
      edges: normalizedEdges
    });

    res.status(201).json({
      success: true,
      message: 'Concept map saved successfully',
      data: { conceptMap: map },
      conceptMap: map
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing concept map
 */
export async function updateConceptMap(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid concept map ID' }
      });
    }

    const updatePayload = {};
    if (req.body.title !== undefined) updatePayload.title = req.body.title.trim();
    if (req.body.topic !== undefined) updatePayload.topic = req.body.topic.trim();
    if (req.body.summary !== undefined) updatePayload.summary = req.body.summary;
    if (req.body.description !== undefined) updatePayload.description = req.body.description;
    if (req.body.nodes !== undefined) updatePayload.nodes = normalizeNodes(req.body.nodes);
    if (req.body.edges !== undefined) updatePayload.edges = normalizeEdges(req.body.edges);

    const updated = await ConceptMap.findOneAndUpdate(
      { _id: id, userId },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Concept map not found or access denied.' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Concept map updated successfully',
      data: { conceptMap: updated },
      conceptMap: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a concept map
 */
export async function deleteConceptMap(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid concept map ID' }
      });
    }

    const deleted = await ConceptMap.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Concept map not found or access denied.' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Concept map deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
