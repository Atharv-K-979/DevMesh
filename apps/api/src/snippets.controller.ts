import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { CodeSnippet } from '@devmesh/shared-types';

@Controller('api/snippets')
export class SnippetsController {
  private snippets: CodeSnippet[] = [
    {
      id: 'snip-ws-client',
      title: 'Socket.IO Client Connection',
      description: 'Production-ready WebSocket client with reconnect options',
      language: 'typescript',
      tags: ['websocket', 'networking'],
      createdAt: Date.now(),
      code: `import { io, Socket } from 'socket.io-client';

export const createRealtimeSocket = (serverUrl: string): Socket => {
  return io(serverUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
};`,
    },
    {
      id: 'snip-jwt-guard',
      title: 'NestJS JWT Auth Guard',
      description: 'NestJS CanActivate guard verifying Bearer JWT headers',
      language: 'typescript',
      tags: ['nestjs', 'auth', 'security'],
      createdAt: Date.now(),
      code: `import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }
    return true;
  }
}`,
    },
  ];

  @Get()
  getAllSnippets(): { snippets: CodeSnippet[] } {
    return { snippets: this.snippets };
  }

  @Post()
  createSnippet(@Body() body: Omit<CodeSnippet, 'id' | 'createdAt'>): CodeSnippet {
    const newSnippet: CodeSnippet = {
      ...body,
      id: `snip_${Date.now()}`,
      createdAt: Date.now(),
    };
    this.snippets.unshift(newSnippet);
    return newSnippet;
  }

  @Delete(':id')
  deleteSnippet(@Param('id') id: string): { success: boolean } {
    const beforeLen = this.snippets.length;
    this.snippets = this.snippets.filter((s) => s.id !== id);
    return { success: this.snippets.length < beforeLen };
  }
}
