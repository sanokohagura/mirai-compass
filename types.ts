
export interface Question {
  id: string;
  text: string;
  options: string[];
  multiSelect?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  isDiagnosis?: boolean;
}

export interface UserAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
  answerIndices: number[];
}
