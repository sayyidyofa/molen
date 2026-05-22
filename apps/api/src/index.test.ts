import { describe, it, expect, beforeAll } from 'bun:test';
import { app } from './index';
import { services } from './services/factory';
import { MockRepository } from './services/MockRepository';
import { MockEventStream } from './services/MockEventStream';

describe('Molen API', () => {
  const mockRepo = new MockRepository();
  const mockStream = new MockEventStream();

  beforeAll(() => {
    services.setRepository(mockRepo);
    services.setEventStream(mockStream);
  });

  describe('Schemas', () => {
    it('should create and list schemas', async () => {
      const createRes = await app.handle(new Request('http://localhost/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Schema',
          fields: [{ id: '1', name: 'amount', type: 'number', required: true }],
          version: 'v1.0'
        })
      }));

      expect(createRes.status).toBe(200);
      const schema = await createRes.json();
      expect(schema.name).toBe('Test Schema');
      expect(schema.fields).toHaveLength(1);

      const listRes = await app.handle(new Request('http://localhost/schemas'));
      const list = await listRes.json();
      expect(list).toContainEqual(schema);
    });

    it('should update a schema', async () => {
      const createRes = await app.handle(new Request('http://localhost/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'To Update',
          fields: []
        })
      }));
      const schema = await createRes.json();

      const updateRes = await app.handle(new Request(`http://localhost/schemas/${schema.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Name',
          fields: [{ id: '1', name: 'new', type: 'string', required: false }]
        })
      }));

      expect(updateRes.status).toBe(200);
      const updated = await updateRes.json();
      expect(updated.name).toBe('Updated Name');
      expect(updated.fields).toHaveLength(1);
    });

    it('should delete a schema', async () => {
      const createRes = await app.handle(new Request('http://localhost/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'To Delete', fields: [] })
      }));
      const schema = await createRes.json();

      const deleteRes = await app.handle(new Request(`http://localhost/schemas/${schema.id}`, {
        method: 'DELETE'
      }));
      expect(deleteRes.status).toBe(200);

      const listRes = await app.handle(new Request('http://localhost/schemas'));
      const list = await listRes.json();
      expect(list.find((s: any) => s.id === schema.id)).toBeUndefined();
    });

    it('should fail on invalid schema body', async () => {
      const res = await app.handle(new Request('http://localhost/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid',
          fields: 'not an array'
        })
      }));
      expect(res.status).toBe(422); // Elysia validation error
    });
  });

  describe('Rules', () => {
    it('should create, update and delete rules', async () => {
      // Create
      const createRes = await app.handle(new Request('http://localhost/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Rule',
          condition: 'amount > 1000',
          anomalyScore: 50,
          action: 'BLOCK'
        })
      }));
      const rule = await createRes.json();
      expect(rule.name).toBe('Test Rule');

      // Update
      const updateRes = await app.handle(new Request(`http://localhost/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Rule',
          anomalyScore: 60
        })
      }));
      const updated = await updateRes.json();
      expect(updated.name).toBe('Updated Rule');
      expect(updated.anomalyScore).toBe(60);

      // Delete
      const deleteRes = await app.handle(new Request(`http://localhost/rules/${rule.id}`, {
        method: 'DELETE'
      }));
      expect(deleteRes.status).toBe(200);

      const listRes = await app.handle(new Request('http://localhost/rules'));
      const list = await listRes.json();
      expect(list.find((r: any) => r.id === rule.id)).toBeUndefined();
    });
  });

  describe('Extractors', () => {
    it('should create, update and delete extractors', async () => {
      // Create
      const createRes = await app.handle(new Request('http://localhost/extractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Amount Extractor',
          sourceField: 'amount',
          transformation: 'identity',
          outputType: 'NUMBER'
        })
      }));
      const extractor = await createRes.json();
      expect(extractor.name).toBe('Amount Extractor');

      // Update
      const updateRes = await app.handle(new Request(`http://localhost/extractors/${extractor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Extractor',
          transformation: 'to_float'
        })
      }));
      const updated = await updateRes.json();
      expect(updated.name).toBe('Updated Extractor');
      expect(updated.transformation).toBe('to_float');

      // Delete
      const deleteRes = await app.handle(new Request(`http://localhost/extractors/${extractor.id}`, {
        method: 'DELETE'
      }));
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Deployments', () => {
    it('should promote version and publish to stream', async () => {
      // 1. Create a draft
      const draft = await mockRepo.saveDraft({
        name: 'Main Orchestrator',
        graph: { nodes: [], edges: [] },
        updatedAt: new Date()
      });

      // 2. Commit a version
      const version = await mockRepo.commitVersion(draft.id);

      // 3. Promote via API
      const res = await app.handle(new Request('http://localhost/deployments/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Production',
          versionId: version.id
        })
      }));

      expect(res.status).toBe(200);
      const deployment = await res.json();
      expect(deployment.activeVersionId).toBe(version.id);

      // 4. Verify stream was called
      expect(mockStream.lastPublishedTopic).toBe('molen_control_dev');
      expect(mockStream.lastPublishedGraph).toEqual(version.graph);
    });
  });
});
