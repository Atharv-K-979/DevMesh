import * as HocuspocusServerModule from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';

const mod = HocuspocusServerModule;
const HocuspocusClass = mod.Hocuspocus || mod.default?.Hocuspocus || mod.Server?.constructor;

// In-memory CRDT snapshot store for realtime documents and reconnection persistence
export const docStore = new Map();

export const server = new HocuspocusClass({
  port: Number(process.env.HOCUSPOCUS_PORT || 1234),
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        return docStore.get(documentName) || null;
      },
      store: async ({ documentName, state }) => {
        docStore.set(documentName, state);
      },
    }),
  ],
});

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.HOCUSPOCUS_PORT || 1234);
  server.listen(port).then(() => {
    console.log(`DevMesh Hocuspocus Collab Server running on port ${port}`);
  });
}
