
import React, { useState, useEffect, useRef } from 'react';
import { QUESTIONS } from './constants';
import { ChatMessage as ChatMessageType, UserAnswer } from './types';
import ChatMessage from './components/ChatMessage';
import { generateDiagnosis } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [tempSelections, setTempSelections] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const startChat = async () => {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 800));
      setMessages([
        {
          id: 'init-1',
          sender: 'ai',
          text: 'こんにちは！あなたのミライを指し示す「みらいコンパス」だよ。'
        },
        {
          id: 'init-2',
          sender: 'ai',
          text: '質問に対して、自分の言葉で自由に送ってね。選択肢がある時はそれをタップしてもOK！今の正直な気持ちを教えてね✨'
        }
      ]);
      setIsTyping(false);
      setCurrentQuestionIndex(0);
    };
    startChat();
  }, []);

  useEffect(() => {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < QUESTIONS.length) {
      const askQuestion = async () => {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 1000));
        const q = QUESTIONS[currentQuestionIndex];
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${q.id}`,
            sender: 'ai',
            text: `${q.id}. ${q.text}`
          }
        ]);
        setIsTyping(false);
      };
      askQuestion();
    } else if (currentQuestionIndex === QUESTIONS.length) {
      handleFinalDiagnosis();
    }
  }, [currentQuestionIndex]);

  const processUserAnswer = (text: string) => {
    if (!text.trim() || isTyping || currentQuestionIndex < 0 || currentQuestionIndex >= QUESTIONS.length) return;

    const q = QUESTIONS[currentQuestionIndex];
    const userMsg = text.trim();

    const newUserAnswer: UserAnswer = {
      questionId: q.id,
      questionText: q.text,
      answerText: userMsg,
      answerIndices: []
    };

    setMessages(prev => [
      ...prev,
      {
        id: `user-${q.id}-${Date.now()}`,
        sender: 'user',
        text: userMsg
      }
    ]);

    setAnswers(prev => [...prev, newUserAnswer]);
    setInputText('');
    setTempSelections([]);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      processUserAnswer(inputText);
    } else if (tempSelections.length > 0) {
      processUserAnswer(tempSelections.join('、'));
    }
  };

  const handleOptionClick = (option: string) => {
    const q = QUESTIONS[currentQuestionIndex];
    if (q.multiSelect) {
      setTempSelections(prev => 
        prev.includes(option) 
          ? prev.filter(o => o !== option) 
          : [...prev, option]
      );
    } else {
      processUserAnswer(option);
    }
  };

  const handleFinalDiagnosis = async () => {
    setIsTyping(true);
    setMessages(prev => [
      ...prev,
      {
        id: 'diagnosis-wait',
        sender: 'ai',
        text: '全ての質問に答えてくれてありがとう！\n教えてくれた内容をもとに、あなただけの「みらいの地図」を作成中だよ。少しだけ待っててね！🍀'
      }
    ]);

    try {
      const result = await generateDiagnosis(answers);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: 'diagnosis-result',
          sender: 'ai',
          text: result,
          isDiagnosis: true
        }
      ]);
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: 'diagnosis-error',
          sender: 'ai',
          text: 'ごめんね、診断中にエラーが起きちゃった。通信環境を確認して、もう一度最初からやってみよう。'
        }
      ]);
    }
  };

  const resetChat = () => {
    window.location.reload();
  };

  const currentQuestion = currentQuestionIndex >= 0 && currentQuestionIndex < QUESTIONS.length ? QUESTIONS[currentQuestionIndex] : null;

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-xl overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white mr-3 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2a10 10 0 1010 10A10.011 10.011 0 0012 2zm0 18a8 8 0 118-8 8.01 8.01 0 01-8 8z"/>
              <path d="M12 10.5a1.5 1.5 0 101.5 1.5 1.5 1.5 0 00-1.5-1.5z"/>
              <path d="M14.5 9.5l-4 1.5 1.5 4 4-1.5-1.5-4z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">進路診断AI みらいコンパス</h1>
            <p className="text-[10px] text-indigo-500 font-medium flex items-center uppercase tracking-wider">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-1.5 animate-pulse"></span> 指針を確認中...
            </p>
          </div>
        </div>
        <button 
          onClick={resetChat}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
        >
          リセット
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5]">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="chat-bubble-ai px-4 py-3 flex space-x-1.5 items-center shadow-sm">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
      </main>

      {/* Options/Input Area */}
      <footer className="bg-white border-t border-gray-200 p-3 sm:p-4 transition-all">
        {currentQuestion && !isTyping && currentQuestion.options.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 animate-fade-in-up">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = tempSelections.includes(opt);
              return (
                <button
                  key={i}
                  onClick={() => handleOptionClick(opt)}
                  className={`text-xs sm:text-sm px-3 py-1.5 rounded-full transition-all shadow-sm border ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold scale-105'
                      : 'bg-white border-indigo-400 text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {currentQuestion.multiSelect && isSelected ? '✓ ' : ''}
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {currentQuestionIndex >= 0 && currentQuestionIndex < QUESTIONS.length ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={currentQuestion?.multiSelect && tempSelections.length > 0 ? `${tempSelections.length}個 選択中...` : "メッセージを入力..."}
              className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
              disabled={isTyping}
            />
            {currentQuestion?.multiSelect && tempSelections.length > 0 && !inputText.trim() ? (
              <button
                type="button"
                onClick={() => processUserAnswer(tempSelections.join('、'))}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95"
              >
                決定
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  inputText.trim() && !isTyping ? 'bg-indigo-600 text-white shadow-md hover:scale-105' : 'bg-gray-200 text-gray-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            )}
          </form>
        ) : currentQuestionIndex === QUESTIONS.length && !isTyping ? (
          <div className="flex flex-col items-center">
            <button 
              onClick={resetChat}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              もう一度診断する
            </button>
          </div>
        ) : (
          <div className="h-10 flex items-center justify-center text-gray-400 text-sm italic">
            コンパスが未来を指し示しています...
          </div>
        )}
      </footer>
    </div>
  );
};

export default App;
