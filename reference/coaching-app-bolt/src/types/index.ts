export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface MorningAnswers {
  eveningGoal: string;
  context: string;
  behaviors: string;
}

export interface EveningAnswers {
  focus: string;
  behaviorDifferences: string;
  results: string;
  successes: string;
  challenges: string;
  improvements: string;
  reasoning: string;
}

export interface DailyEntry {
  id: string;
  userId: string;
  date: string;
  morningAnswers: MorningAnswers | null;
  eveningAnswers: EveningAnswers | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export type QuestionFlow = 'morning' | 'evening';