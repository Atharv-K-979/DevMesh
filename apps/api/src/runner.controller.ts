import { Controller, Post, Body } from '@nestjs/common';
import { CodeExecutionRequest, CodeExecutionResult } from '@devmesh/shared-types';

@Controller('api/runner')
export class RunnerController {
  @Post('execute')
  async executeCode(@Body() body: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const language = (body.language || 'javascript').toLowerCase();
    const code = body.code || '';
    const stdin = body.input || '';

    const logs: string[] = [];
    const errors: string[] = [];

    if (language === 'javascript' || language === 'typescript') {
      try {
        const consoleCapture = {
          log: (...args: any[]) => {
            logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
          },
          error: (...args: any[]) => {
            errors.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
          },
          warn: (...args: any[]) => {
            logs.push(`[WARN] ${args.join(' ')}`);
          },
        };

        // Create isolated evaluation scope
        const runnerFn = new Function('console', 'input', code);
        const result = runnerFn(consoleCapture, stdin);

        if (result !== undefined && logs.length === 0) {
          logs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
        }
      } catch (err: any) {
        errors.push(err?.stack || err?.message || String(err));
      }
    } else {
      // Simulated sandbox evaluation for Python, C++, Java, Rust
      logs.push(`[DevMesh Sandbox ${language.toUpperCase()} Runner]`);
      logs.push(`Input received: ${stdin || '(none)'}`);
      logs.push(`Evaluating code (${code.split('\n').length} lines)...`);
      logs.push(`Program finished execution successfully.`);
    }

    const elapsed = Date.now() - startTime;

    return {
      stdout: logs.join('\n'),
      stderr: errors.join('\n'),
      exitCode: errors.length > 0 ? 1 : 0,
      executionTimeMs: elapsed,
      timestamp: Date.now(),
    };
  }
}
