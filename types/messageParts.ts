/**
 * Message Part Types
 *
 * Type definitions for message parts based on @opencode-ai/sdk format.
 * Parts represent different types of content within a message.
 */

export type PartType = 'text' | 'reasoning' | 'tool' | 'patch' | 'agent' | 'question';

export interface BasePart {
  id: string;
  type: PartType;
  sessionID: string;
  messageID: string;
}

export interface TextPart extends BasePart {
  type: 'text';
  text: string;
}

export interface ReasoningPart extends BasePart {
  type: 'reasoning';
  text: string;
  time?: {
    start: number;
    end: number;
  };
}

export interface ToolPart extends BasePart {
  type: 'tool';
  tool: string;
  state: {
    input: unknown;
    output: unknown;
    status: 'pending' | 'running' | 'success' | 'error';
  };
}

export interface PatchPart extends BasePart {
  type: 'patch';
  files: string[];
}

export interface AgentPart extends BasePart {
  type: 'agent';
  name: string;
}

export interface QuestionPart extends BasePart {
  type: 'question';
  question: string;
  options?: string[];
}

export type Part = TextPart | ReasoningPart | ToolPart | PatchPart | AgentPart | QuestionPart;

export interface MessageWithParts {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  parts: Part[];
  agent?: string;
  model?: string;
  timestamp: number;
}
