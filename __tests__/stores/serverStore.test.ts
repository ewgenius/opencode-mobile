import { useServerStore, Server, ServerState } from '../../stores/serverStore';

describe('serverStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const store = useServerStore.getState();
    store.resetServers();
  });

  describe('initial state', () => {
    it('should have empty servers array', () => {
      const state = useServerStore.getState();
      expect(state.servers).toEqual([]);
    });

    it('should have null activeServerId', () => {
      const state = useServerStore.getState();
      expect(state.activeServerId).toBeNull();
    });
  });

  describe('addServer', () => {
    it('should add a new server with generated id and timestamp', () => {
      const store = useServerStore.getState();
      const beforeAdd = Date.now();

      store.addServer({
        name: 'Test Server',
        url: 'http://localhost:8080',
        password: 'secret',
      });

      const state = useServerStore.getState();
      expect(state.servers).toHaveLength(1);

      const server = state.servers[0];
      expect(server.name).toBe('Test Server');
      expect(server.url).toBe('http://localhost:8080');
      expect(server.password).toBe('secret');
      expect(server.id).toMatch(/^server_\d+_[a-z0-9]+$/);
      expect(server.createdAt).toBeGreaterThanOrEqual(beforeAdd);
    });

    it('should set first server as active automatically', () => {
      const store = useServerStore.getState();

      store.addServer({
        name: 'First Server',
        url: 'http://localhost:8080',
      });

      const state = useServerStore.getState();
      expect(state.activeServerId).toBe(state.servers[0].id);
    });

    it('should not change active server when adding subsequent servers', () => {
      const store = useServerStore.getState();

      store.addServer({
        name: 'First Server',
        url: 'http://localhost:8080',
      });

      const firstActiveId = useServerStore.getState().activeServerId;

      store.addServer({
        name: 'Second Server',
        url: 'http://localhost:8081',
      });

      const state = useServerStore.getState();
      expect(state.activeServerId).toBe(firstActiveId);
      expect(state.servers).toHaveLength(2);
    });
  });

  describe('updateServer', () => {
    it('should update server properties', () => {
      const store = useServerStore.getState();

      store.addServer({
        name: 'Original Name',
        url: 'http://localhost:8080',
        password: 'oldpass',
      });

      const serverId = useServerStore.getState().servers[0].id;

      store.updateServer(serverId, {
        name: 'Updated Name',
        password: 'newpass',
      });

      const state = useServerStore.getState();
      const server = state.servers[0];
      expect(server.name).toBe('Updated Name');
      expect(server.password).toBe('newpass');
      expect(server.url).toBe('http://localhost:8080'); // Unchanged
    });

    it('should not modify other servers', () => {
      const store = useServerStore.getState();

      store.addServer({ name: 'Server 1', url: 'http://localhost:8080' });
      store.addServer({ name: 'Server 2', url: 'http://localhost:8081' });

      const servers = useServerStore.getState().servers;
      const firstId = servers[0].id;
      const secondId = servers[1].id;

      store.updateServer(firstId, { name: 'Updated Server 1' });

      const state = useServerStore.getState();
      expect(state.servers[1].name).toBe('Server 2');
      expect(state.servers[1].id).toBe(secondId);
    });
  });

  describe('removeServer', () => {
    it('should remove a server by id', () => {
      const store = useServerStore.getState();

      store.addServer({ name: 'Server 1', url: 'http://localhost:8080' });
      store.addServer({ name: 'Server 2', url: 'http://localhost:8081' });

      const serverId = useServerStore.getState().servers[0].id;
      store.removeServer(serverId);

      const state = useServerStore.getState();
      expect(state.servers).toHaveLength(1);
      expect(state.servers[0].name).toBe('Server 2');
    });

    it('should set new active server when removing active server', () => {
      const store = useServerStore.getState();

      store.addServer({ name: 'Server 1', url: 'http://localhost:8080' });
      store.addServer({ name: 'Server 2', url: 'http://localhost:8081' });

      const firstId = useServerStore.getState().servers[0].id;
      const secondId = useServerStore.getState().servers[1].id;

      store.removeServer(firstId);

      const state = useServerStore.getState();
      expect(state.activeServerId).toBe(secondId);
    });

    it('should set activeServerId to null when removing last server', () => {
      const store = useServerStore.getState();

      store.addServer({ name: 'Only Server', url: 'http://localhost:8080' });
      const serverId = useServerStore.getState().servers[0].id;

      store.removeServer(serverId);

      const state = useServerStore.getState();
      expect(state.activeServerId).toBeNull();
      expect(state.servers).toHaveLength(0);
    });
  });

  describe('setActiveServer', () => {
    it('should set active server id', () => {
      const store = useServerStore.getState();

      store.addServer({ name: 'Server 1', url: 'http://localhost:8080' });
      store.addServer({ name: 'Server 2', url: 'http://localhost:8081' });

      const secondId = useServerStore.getState().servers[1].id;
      store.setActiveServer(secondId);

      const state = useServerStore.getState();
      expect(state.activeServerId).toBe(secondId);
    });

    it('should set active server to null', () => {
      const store = useServerStore.getState();

      store.addServer({ name: 'Server 1', url: 'http://localhost:8080' });
      store.setActiveServer(null);

      const state = useServerStore.getState();
      expect(state.activeServerId).toBeNull();
    });
  });

  describe('getServerById', () => {
    it('should return server by id', () => {
      const store = useServerStore.getState();

      store.addServer({ name: 'Server 1', url: 'http://localhost:8080' });
      store.addServer({ name: 'Server 2', url: 'http://localhost:8081' });

      const servers = useServerStore.getState().servers;
      const found = useServerStore.getState().getServerById(servers[1].id);

      expect(found?.name).toBe('Server 2');
    });

    it('should return undefined for non-existent id', () => {
      const store = useServerStore.getState();
      store.addServer({ name: 'Server 1', url: 'http://localhost:8080' });

      const found = useServerStore.getState().getServerById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('resetServers', () => {
    it('should reset to initial state', () => {
      const store = useServerStore.getState();

      store.addServer({ name: 'Server 1', url: 'http://localhost:8080' });
      store.addServer({ name: 'Server 2', url: 'http://localhost:8081' });
      store.setActiveServer(useServerStore.getState().servers[1].id);

      store.resetServers();

      const state = useServerStore.getState();
      expect(state.servers).toEqual([]);
      expect(state.activeServerId).toBeNull();
    });
  });
});
