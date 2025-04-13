import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { QuestionFlow as QuestionFlowType } from '../types';

const morningQuestions = [
  '今晩ベッドに向かう前にどんな成果が出ていれば最高の価値があるか？',
  'そのためにあなたが創るコンテキストは何か？',
  'そのコンテキストを体現する言動は何か？',
];

const eveningQuestions = [
  '今日1日の私のフォーカスは何だったか？',
  'そのために創った行動の違いは何か？',
  '結果はどうなったか？',
  '上手くいったことは何か？',
  '上手くいかなかったことは何か？',
  'この瞬間からどうすれば上手くいくか？',
  'なぜ上手くいくと言えるのか？',
];

interface Props {
  type: QuestionFlowType;
  onComplete: () => void;
}

export const QuestionFlow: React.FC<Props> = ({ type, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const { updateMorningAnswers, updateEveningAnswers } = useStore();

  const questions = type === 'morning' ? morningQuestions : eveningQuestions;

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (type === 'morning') {
        updateMorningAnswers({
          eveningGoal: newAnswers[0],
          context: newAnswers[1],
          behaviors: newAnswers[2],
        });
      } else {
        updateEveningAnswers({
          focus: newAnswers[0],
          behaviorDifferences: newAnswers[1],
          results: newAnswers[2],
          successes: newAnswers[3],
          challenges: newAnswers[4],
          improvements: newAnswers[5],
          reasoning: newAnswers[6],
        });
      }
      onComplete();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          {type === 'morning' ? '朝の質問' : '夜の振り返り'}
        </h2>
        <div className="h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-500 rounded transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-lg mb-4">{questions[currentQuestionIndex]}</p>
        <textarea
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="あなたの回答を入力してください..."
          onChange={(e) => handleAnswer(e.target.value)}
        />
      </div>
    </div>
  );
};