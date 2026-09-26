import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { AiController } from '../src/ai.controller';

describe('AiController (POST /api/ai/completion)', () => {
  let app;
  let controller;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    controller = app.get(AiController);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return explain AI completion', async () => {
    const res = await controller.getCompletion({
      prompt: 'Explain code',
      contextCode: 'const x = 10;',
      action: 'explain',
    });

    expect(res).toBeDefined();
    expect(res.action).toBe('explain');
    expect(res.result).toContain('Code Explanation');
  });

  it('should return generate code completion', async () => {
    const res = await controller.getCompletion({
      prompt: 'User Auth Helper',
      action: 'generate',
    });

    expect(res).toBeDefined();
    expect(res.action).toBe('generate');
    expect(res.result).toContain('UserAuthHelper');
  });

  it('should return refactor code completion', async () => {
    const res = await controller.getCompletion({
      prompt: 'Clean array processing',
      contextCode: 'const data = [1, 2, 3];',
      action: 'refactor',
    });

    expect(res).toBeDefined();
    expect(res.action).toBe('refactor');
    expect(res.result).toContain('Refactored Code Optimization');
  });

  it('should return bug fix suggestions', async () => {
    const res = await controller.getCompletion({
      prompt: 'Fix null pointer exception',
      contextCode: 'return user.name;',
      action: 'fix',
    });

    expect(res).toBeDefined();
    expect(res.action).toBe('fix');
    expect(res.result).toContain('Bug Fix Suggestion');
  });
});
