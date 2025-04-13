import React from 'react';
import { format } from 'date-fns';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { DailyEntry } from '../types';

interface Props {
  entries: DailyEntry[];
}

export const HistoryView: React.FC<Props> = ({ entries }) => {
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedEntries.map((entry) => (
        <div key={entry.id} className="gradient-border glass-effect overflow-hidden">
          <div className="border-b border-gray-800 px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-300">
                {format(new Date(entry.date), 'yyyy年MM月dd日')}
              </h3>
              <div className="flex items-center space-x-2 text-purple-300">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{entry.messages.length}件のメッセージ</span>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            {entry.morningAnswers && (
              <div>
                <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-3">
                  朝の目標設定
                </h4>
                <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-lg p-4 border border-blue-800/30">
                  <p className="text-blue-300 font-medium mb-2">今日の目標</p>
                  <p className="text-blue-100">{entry.morningAnswers.eveningGoal}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-300 font-medium">創るコンテキスト</p>
                      <p className="text-blue-100">{entry.morningAnswers.context}</p>
                    </div>
                    <div>
                      <p className="text-blue-300 font-medium">体現する言動</p>
                      <p className="text-blue-100">{entry.morningAnswers.behaviors}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {entry.eveningAnswers && (
              <div>
                <h4 className="text-sm font-medium text-purple-400 uppercase tracking-wider mb-3">
                  夜の振り返り
                </h4>
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-lg p-4 border border-purple-800/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-purple-300 font-medium">今日のフォーカス</p>
                      <p className="text-purple-100">{entry.eveningAnswers.focus}</p>
                    </div>
                    <div>
                      <p className="text-purple-300 font-medium">結果</p>
                      <p className="text-purple-100">{entry.eveningAnswers.results}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-purple-300 font-medium">上手くいったこと</p>
                      <p className="text-purple-100">{entry.eveningAnswers.successes}</p>
                    </div>
                    <div>
                      <p className="text-purple-300 font-medium">課題</p>
                      <p className="text-purple-100">{entry.eveningAnswers.challenges}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-6 py-3 border-t border-gray-800">
            <button className="w-full flex items-center justify-center space-x-2 text-blue-400 hover:text-purple-400 transition-colors">
              <span className="text-sm font-medium">詳細を見る</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}