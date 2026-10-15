import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/token.js';
import { createConceptMapSchema } from '../src/validators/conceptMapValidator.js';
import { isDatabaseConnected } from '../src/config/db.js';

describe('Concept Map Validation Schema', () => {
  it('should reject missing title with accurate validation error', () => {
    const invalidPayload = {
      nodes: [{ id: 'root', label: 'Test Concept' }]
    };
    const result = createConceptMapSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
  });

  it('should accept valid React Flow nodes with nested position and data', () => {
    const validPayload = {
      title: 'Operating Systems Map',
      topic: 'Computer Science',
      summary: 'Hierarchical overview of OS concepts',
      nodes: [
        {
          id: 'root',
          type: 'concept',
          position: { x: 350, y: 50 },
          data: {
            label: 'Operating Systems',
            description: 'Core system software that manages hardware.',
            level: 0,
            details: ['Process management', 'Memory management'],
            keywords: ['kernel', 'scheduling'],
            importance: 'high'
          }
        },
        {
          id: 'process_mgmt',
          type: 'concept',
          position: { x: 220, y: 210 },
          data: {
            label: 'Process Scheduling',
            description: 'Algorithms like Round Robin and SJF.',
            level: 1,
            details: ['Context switching'],
            keywords: ['scheduling', 'pcb'],
            importance: 'medium'
          }
        }
      ],
      edges: [
        {
          id: 'e_root_process',
          source: 'root',
          target: 'process_mgmt',
          label: 'manages',
          animated: false
        }
      ]
    };
    const result = createConceptMapSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Operating Systems Map');
    expect(result.data.nodes).toHaveLength(2);
    expect(result.data.edges).toHaveLength(1);
  });

  it('should accept AI-generated flat nodes and provide default positions', () => {
    const flatAiPayload = {
      title: 'Database Systems',
      nodes: [
        {
          id: 'root',
          label: 'DBMS',
          description: 'Database management system architecture',
          level: 0
        },
        {
          id: 'sql',
          label: 'SQL & Transactions',
          description: 'ACID properties',
          level: 1
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'root',
          target: 'sql',
          label: 'supports'
        }
      ]
    };
    const result = createConceptMapSchema.safeParse(flatAiPayload);
    expect(result.success).toBe(true);
    expect(result.data.nodes[0].position).toEqual({ x: 0, y: 0 });
  });
});

describe('Concept Map API Routes & Auth Protection', () => {
  const mockUser = {
    userId: '507f1f77bcf86cd799439011',
    email: 'learner@eduaccess.ai',
    name: 'Learner One'
  };
  const validToken = generateToken(mockUser);

  it('POST /api/concept-maps should reject unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/concept-maps')
      .send({ title: 'Test Map' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/concept-maps should reject empty title with informative validation error (not generic "Required")', async () => {
    const res = await request(app)
      .post('/api/concept-maps')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: '   ',
        nodes: [{ id: 'root', label: 'Test' }]
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message.toLowerCase()).toContain('title');
  });

  it('POST /api/concept-maps should reject payload with 0 nodes', async () => {
    const res = await request(app)
      .post('/api/concept-maps')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'Empty Map',
        nodes: []
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message.toLowerCase()).toContain('node');
  });
});

describe('Concept Map Save and Retrieve Workflow (when DB connected)', () => {
  const mockUser = {
    userId: '507f1f77bcf86cd799439011',
    email: 'learner@eduaccess.ai',
    name: 'Learner One'
  };
  const validToken = generateToken(mockUser);

  it('should handle saving, retrieving and not overwriting unrelated maps', async () => {
    if (!isDatabaseConnected()) {
      // If DB is offline in test runner, verify graceful 503 response
      const res = await request(app)
        .post('/api/concept-maps')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Offline Test',
          nodes: [{ id: 'root', label: 'Offline' }]
        });
      expect([201, 503]).toContain(res.status);
      return;
    }

    // 1. Create first map
    const map1Res = await request(app)
      .post('/api/concept-maps')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'SDLC Models Concept Map',
        topic: 'Software Engineering',
        summary: 'Comparison of Agile, Waterfall and DevOps',
        nodes: [
          {
            id: 'root',
            type: 'concept',
            position: { x: 350, y: 50 },
            data: {
              label: 'SDLC Methodologies',
              description: 'Software development lifecycle approaches',
              level: 0,
              details: ['Requirement analysis to deployment'],
              importance: 'high'
            }
          },
          {
            id: 'agile',
            type: 'concept',
            position: { x: 200, y: 200 },
            data: {
              label: 'Agile & Scrum',
              description: 'Iterative sprint-based delivery',
              level: 1,
              details: ['2-week sprints'],
              importance: 'medium'
            }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'root',
            target: 'agile',
            label: 'implements'
          }
        ]
      });

    expect(map1Res.status).toBe(201);
    expect(map1Res.body.success).toBe(true);
    const map1 = map1Res.body.conceptMap || map1Res.body.data.conceptMap;
    expect(map1._id).toBeDefined();
    expect(map1.title).toBe('SDLC Models Concept Map');

    // 2. Retrieve map 1 by ID and verify nodes, edges, labels and title preserved
    const get1Res = await request(app)
      .get(`/api/concept-maps/${map1._id}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(get1Res.status).toBe(200);
    const fetched1 = get1Res.body.conceptMap || get1Res.body.data.conceptMap;
    expect(fetched1.title).toBe('SDLC Models Concept Map');
    expect(fetched1.nodes).toHaveLength(2);
    expect(fetched1.edges).toHaveLength(1);
    expect(fetched1.nodes[0].data.label).toBe('SDLC Methodologies');
    expect(fetched1.nodes[1].data.label).toBe('Agile & Scrum');
    expect(fetched1.edges[0].label).toBe('implements');

    // 3. Create second map and ensure it does not overwrite map 1
    const map2Res = await request(app)
      .post('/api/concept-maps')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'Computer Networks Hierarchy',
        topic: 'Networking',
        summary: 'OSI 7 layer model',
        nodes: [
          {
            id: 'root',
            type: 'concept',
            position: { x: 350, y: 50 },
            data: {
              label: 'OSI Architecture',
              description: 'Standard conceptual model',
              level: 0
            }
          }
        ],
        edges: []
      });

    expect(map2Res.status).toBe(201);
    const map2 = map2Res.body.conceptMap || map2Res.body.data.conceptMap;
    expect(map2._id).not.toBe(map1._id);

    // 4. Verify list contains both
    const listRes = await request(app)
      .get('/api/concept-maps')
      .set('Authorization', `Bearer ${validToken}`);

    expect(listRes.status).toBe(200);
    const list = listRes.body.conceptMaps || listRes.body.data.conceptMaps;
    const ids = list.map((m) => m._id);
    expect(ids).toContain(map1._id);
    expect(ids).toContain(map2._id);

    // Clean up test data
    await request(app).delete(`/api/concept-maps/${map1._id}`).set('Authorization', `Bearer ${validToken}`);
    await request(app).delete(`/api/concept-maps/${map2._id}`).set('Authorization', `Bearer ${validToken}`);
  });
});
