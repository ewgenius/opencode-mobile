import { useSessionStore, Session, Message, SessionState } from '../../stores/sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    const store = useSessionStore.getState();
    store.resetSessions();
  });

  describe('initial state', () => {
    it('should have empty sessions object', () => {
      const state = useSessionStore.getState();
      expect(state.sessions).toEqual({});
    });

    it('should have empty messages object', () => {
      const state = useSessionStore.getState();
      expect(state.messages).toEqual({});
    });

    it('should have null activeSessionId', () => {
      const state = useSessionStore.getState();
      expect(state.activeSessionId).toBeNull();
    });
  });

  describe('setSessions', () => {
    it('should set sessions for a project', () => {
      const store = useSessionStore.getState();
      const sessions: Session[] = [
        {
          id: 'session-1',
          projectId: 'project-1',
          title: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      store.setSessions('project-1', sessions);

      const state = useSessionStore.getState();
      expect(state.sessions['project-1']).toEqual(sessions);
    });

    it('should overwrite existing sessions for a project', () => {
      const store = useSessionStore.getState();
      const oldSessions: Session[] = [
        {
          id: 'old-session',
          projectId: 'project-1',
          title: 'Old Session',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      const newSessions: Session[] = [
        {
          id: 'new-session',
          projectId: 'project-1',
          title: 'New Session',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      store.setSessions('project-1', oldSessions);
      store.setSessions('project-1', newSessions);

      const state = useSessionStore.getState();
      expect(state.sessions['project-1']).toHaveLength(1);
      expect(state.sessions['project-1'][0].title).toBe('New Session');
    });
  });

  describe('addSession', () => {
    it('should add a new session with generated id and timestamps', () => {
      const store = useSessionStore.getState();
      const beforeAdd = Date.now();

      store.addSession('project-1', {
        title: 'New Session',
        workspaceId: 'workspace-1',
      });

      const state = useSessionStore.getState();
      const sessions = state.sessions['project-1'];
      expect(sessions).toHaveLength(1);

      const session = sessions[0];
      expect(session.title).toBe('New Session');
      expect(session.projectId).toBe('project-1');
      expect(session.workspaceId).toBe('workspace-1');
      expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(session.createdAt).toBeGreaterThanOrEqual(beforeAdd);
      expect(session.updatedAt).toBeGreaterThanOrEqual(beforeAdd);
    });

    it('should set first session as active automatically', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'First Session' });

      const state = useSessionStore.getState();
      expect(state.activeSessionId).toBe(state.sessions['project-1'][0].id);
    });

    it('should append sessions to existing project sessions', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session 1' });
      store.addSession('project-1', { title: 'Session 2' });

      const state = useSessionStore.getState();
      expect(state.sessions['project-1']).toHaveLength(2);
    });

    it('should keep separate sessions per project', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Project 1 Session' });
      store.addSession('project-2', { title: 'Project 2 Session' });

      const state = useSessionStore.getState();
      expect(state.sessions['project-1']).toHaveLength(1);
      expect(state.sessions['project-2']).toHaveLength(1);
      expect(state.sessions['project-1'][0].title).toBe('Project 1 Session');
      expect(state.sessions['project-2'][0].title).toBe('Project 2 Session');
    });
  });

  describe('updateSession', () => {
    it('should update session properties and updatedAt timestamp', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Original Title' });
      const sessionId = useSessionStore.getState().sessions['project-1'][0].id;
      const originalUpdatedAt = useSessionStore.getState().sessions['project-1'][0].updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      setTimeout(() => {
        store.updateSession('project-1', sessionId, { title: 'Updated Title' });

        const state = useSessionStore.getState();
        const session = state.sessions['project-1'][0];
        expect(session.title).toBe('Updated Title');
        expect(session.updatedAt).toBeGreaterThan(originalUpdatedAt);
      }, 10);
    });

    it('should not update sessions in other projects', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Project 1 Session' });
      store.addSession('project-2', { title: 'Project 2 Session' });

      const sessionId = useSessionStore.getState().sessions['project-1'][0].id;
      store.updateSession('project-1', sessionId, { title: 'Updated' });

      const state = useSessionStore.getState();
      expect(state.sessions['project-2'][0].title).toBe('Project 2 Session');
    });
  });

  describe('removeSession', () => {
    it('should remove a session by id', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session 1' });
      store.addSession('project-1', { title: 'Session 2' });

      const sessionId = useSessionStore.getState().sessions['project-1'][0].id;
      store.removeSession('project-1', sessionId);

      const state = useSessionStore.getState();
      expect(state.sessions['project-1']).toHaveLength(1);
      expect(state.sessions['project-1'][0].title).toBe('Session 2');
    });

    it('should remove messages when removing session', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session' });
      const sessionId = useSessionStore.getState().sessions['project-1'][0].id;

      store.addMessage(sessionId, {
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      });

      store.removeSession('project-1', sessionId);

      const state = useSessionStore.getState();
      expect(state.messages[sessionId]).toBeUndefined();
    });

    it('should update active session when removing active session', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session 1' });
      store.addSession('project-1', { title: 'Session 2' });

      const firstId = useSessionStore.getState().sessions['project-1'][0].id;
      const secondId = useSessionStore.getState().sessions['project-1'][1].id;

      store.removeSession('project-1', firstId);

      const state = useSessionStore.getState();
      expect(state.activeSessionId).toBe(secondId);
    });

    it('should set active session to null when removing last session', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Only Session' });
      const sessionId = useSessionStore.getState().sessions['project-1'][0].id;

      store.removeSession('project-1', sessionId);

      const state = useSessionStore.getState();
      expect(state.activeSessionId).toBeNull();
    });
  });

  describe('removeAllSessionsForProject', () => {
    it('should remove all sessions for a project', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session 1' });
      store.addSession('project-1', { title: 'Session 2' });
      store.addSession('project-2', { title: 'Project 2 Session' });

      store.removeAllSessionsForProject('project-1');

      const state = useSessionStore.getState();
      expect(state.sessions['project-1']).toBeUndefined();
      expect(state.sessions['project-2']).toHaveLength(1);
    });

    it('should remove messages for all sessions in project', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session 1' });
      const session1Id = useSessionStore.getState().sessions['project-1'][0].id;
      store.addMessage(session1Id, { role: 'user', content: 'Hello', timestamp: Date.now() });

      store.addSession('project-2', { title: 'Session 2' });
      const session2Id = useSessionStore.getState().sessions['project-2'][0].id;
      store.addMessage(session2Id, { role: 'user', content: 'World', timestamp: Date.now() });

      store.removeAllSessionsForProject('project-1');

      const state = useSessionStore.getState();
      expect(state.messages[session1Id]).toBeUndefined();
      expect(state.messages[session2Id]).toHaveLength(1);
    });

    it('should reset active session if it was from removed project', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session 1' });
      const sessionId = useSessionStore.getState().sessions['project-1'][0].id;
      store.setActiveSession(sessionId);

      store.removeAllSessionsForProject('project-1');

      const state = useSessionStore.getState();
      expect(state.activeSessionId).toBeNull();
    });
  });

  describe('message operations', () => {
    it('should set messages for a session', () => {
      const store = useSessionStore.getState();
      const messages: Message[] = [
        {
          id: 'msg-1',
          sessionId: 'session-1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        },
      ];

      store.setMessages('session-1', messages);

      const state = useSessionStore.getState();
      expect(state.messages['session-1']).toEqual(messages);
    });

    it('should add a message with generated id', () => {
      const store = useSessionStore.getState();

      store.addMessage('session-1', {
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      });

      const state = useSessionStore.getState();
      const messages = state.messages['session-1'];
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(messages[0].content).toBe('Hello');
    });

    it('should update a message', () => {
      const store = useSessionStore.getState();

      store.addMessage('session-1', { role: 'user', content: 'Hello', timestamp: Date.now() });
      const messageId = useSessionStore.getState().messages['session-1'][0].id;

      store.updateMessage('session-1', messageId, { content: 'Updated content' });

      const state = useSessionStore.getState();
      expect(state.messages['session-1'][0].content).toBe('Updated content');
    });

    it('should remove a message', () => {
      const store = useSessionStore.getState();

      store.addMessage('session-1', { role: 'user', content: 'Hello', timestamp: Date.now() });
      store.addMessage('session-1', { role: 'assistant', content: 'Hi', timestamp: Date.now() });

      const messageId = useSessionStore.getState().messages['session-1'][0].id;
      store.removeMessage('session-1', messageId);

      const state = useSessionStore.getState();
      expect(state.messages['session-1']).toHaveLength(1);
      expect(state.messages['session-1'][0].role).toBe('assistant');
    });

    it('should clear messages for a session', () => {
      const store = useSessionStore.getState();

      store.addMessage('session-1', { role: 'user', content: 'Hello', timestamp: Date.now() });
      store.addMessage('session-1', { role: 'assistant', content: 'Hi', timestamp: Date.now() });

      store.clearMessagesForSession('session-1');

      const state = useSessionStore.getState();
      expect(state.messages['session-1']).toBeUndefined();
    });
  });

  describe('getSessionsByProjectId', () => {
    it('should return sessions for a project', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session 1' });
      store.addSession('project-1', { title: 'Session 2' });

      const sessions = useSessionStore.getState().getSessionsByProjectId('project-1');
      expect(sessions).toHaveLength(2);
    });

    it('should return empty array for non-existent project', () => {
      const sessions = useSessionStore.getState().getSessionsByProjectId('non-existent');
      expect(sessions).toEqual([]);
    });
  });

  describe('getSessionById', () => {
    it('should return session by id', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session 1' });
      store.addSession('project-2', { title: 'Session 2' });

      const sessionId = useSessionStore.getState().sessions['project-2'][0].id;
      const session = useSessionStore.getState().getSessionById(sessionId);

      expect(session?.title).toBe('Session 2');
    });

    it('should return undefined for non-existent session', () => {
      const session = useSessionStore.getState().getSessionById('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('getMessagesBySessionId', () => {
    it('should return messages for a session', () => {
      const store = useSessionStore.getState();

      store.addMessage('session-1', { role: 'user', content: 'Hello', timestamp: Date.now() });
      store.addMessage('session-1', { role: 'assistant', content: 'Hi', timestamp: Date.now() });

      const messages = useSessionStore.getState().getMessagesBySessionId('session-1');
      expect(messages).toHaveLength(2);
    });

    it('should return empty array for non-existent session', () => {
      const messages = useSessionStore.getState().getMessagesBySessionId('non-existent');
      expect(messages).toEqual([]);
    });
  });

  describe('resetSessions', () => {
    it('should reset to initial state', () => {
      const store = useSessionStore.getState();

      store.addSession('project-1', { title: 'Session 1' });
      store.addMessage('session-1', { role: 'user', content: 'Hello', timestamp: Date.now() });
      store.setActiveSession('session-1');

      store.resetSessions();

      const state = useSessionStore.getState();
      expect(state.sessions).toEqual({});
      expect(state.messages).toEqual({});
      expect(state.activeSessionId).toBeNull();
    });
  });
});
