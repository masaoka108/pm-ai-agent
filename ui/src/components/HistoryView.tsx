import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MessageCircle, ChevronRight, Loader2, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toZonedTime } from 'date-fns-tz';

// Supabaseクライアントの初期化
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// 日本のタイムゾーン
const JST_TIMEZONE = 'Asia/Tokyo';

// 日本時間の日付の始まりを取得する関数
const startOfDayJST = (date: Date): string => {
  const zonedDate = toZonedTime(date, JST_TIMEZONE);
  return new Date(Date.UTC(
    zonedDate.getFullYear(),
    zonedDate.getMonth(),
    zonedDate.getDate(),
    0, 0, 0
  )).toISOString();
};

interface CoachingRecord {
  id: number;
  date: string;
  type: 'goal' | 'reflection';  // typeの型を明示的に定義
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

interface DailySummary {
  date: string;
  morningGoals: CoachingRecord[];    // 朝の目標設定（type: goal）
  eveningReflections: CoachingRecord[];  // 夜の振り返り（type: reflection）
  totalRecords: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DailySummary;
}

const DetailModal: React.FC<ModalProps> = ({ isOpen, onClose, summary }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 rounded-lg p-6 m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-semibold text-blue-300 mb-6">
          {format(parseISO(summary.date), 'yyyy年MM月dd日')}の記録
        </h2>

        {/* 朝の目標設定 */}
        {summary.morningGoals.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-blue-300 mb-4">朝の目標設定</h3>
            <div className="space-y-4">
              {summary.morningGoals.map((record) => (
                <div key={record.id} className="bg-blue-500/10 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-300 mb-2">{record.question}</p>
                  <p className="text-sm text-gray-300">{record.answer}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(parseISO(record.created_at), 'HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 夜の振り返り */}
        {summary.eveningReflections.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-purple-300 mb-4">夜の振り返り</h3>
            <div className="space-y-4">
              {summary.eveningReflections.map((record) => (
                <div key={record.id} className="bg-purple-500/10 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-300 mb-2">{record.question}</p>
                  <p className="text-sm text-gray-300">{record.answer}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(parseISO(record.created_at), 'HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const HistoryView: React.FC = () => {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('coaching_records')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;

        // 日本時間で日付ごとにレコードをグループ化（created_atを基準）
        const groupedRecords = data.reduce<Record<string, CoachingRecord[]>>((acc, record) => {
          const dateKey = startOfDayJST(parseISO(record.created_at));
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(record);
          return acc;
        }, {});

        // サマリーを作成
        const dailySummaries = Object.entries(groupedRecords).map(([date, records]): DailySummary => ({
          date,
          morningGoals: records.filter(record => record.type === 'goal'),
          eveningReflections: records.filter(record => record.type === 'reflection'),
          totalRecords: records.length
        }));

        setSummaries(dailySummaries);
      } catch (err) {
        setError(err instanceof Error ? err.message : '履歴の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center py-8 glass-effect rounded-lg p-4">
        <p>エラーが発生しました</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summaries.map((summary) => (
        <div key={summary.date} className="relative p-[1px] rounded-lg bg-gradient-to-r from-blue-400 to-purple-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 blur-xl"></div>
          <div className="relative glass-effect rounded-lg overflow-hidden">
            <div className="border-b border-gray-800 px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-300">
                  {format(parseISO(summary.date), 'yyyy年MM月dd日')}
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-purple-300">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{summary.totalRecords}件の記録</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-lg p-3 ${
                  summary.morningGoals.length > 0
                    ? 'bg-blue-500/10 text-blue-300' 
                    : 'bg-gray-800/50 text-gray-400'
                }`}>
                  <h4 className="text-sm font-medium mb-1">朝の目標設定</h4>
                  <p className="text-xs">
                    {summary.morningGoals.length > 0 
                      ? `${summary.morningGoals.length}件の記録` 
                      : '記録なし'}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${
                  summary.eveningReflections.length > 0
                    ? 'bg-purple-500/10 text-purple-300' 
                    : 'bg-gray-800/50 text-gray-400'
                }`}>
                  <h4 className="text-sm font-medium mb-1">夜の振り返り</h4>
                  <p className="text-xs">
                    {summary.eveningReflections.length > 0 
                      ? `${summary.eveningReflections.length}件の記録` 
                      : '記録なし'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-3 border-t border-gray-800">
              <button 
                className="w-full flex items-center justify-center space-x-2 text-blue-400 hover:text-purple-400 transition-colors"
                onClick={() => setSelectedSummary(summary)}
              >
                <span className="text-sm font-medium">詳細を見る</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <DetailModal
        isOpen={selectedSummary !== null}
        onClose={() => setSelectedSummary(null)}
        summary={selectedSummary!}
      />
    </div>
  );
}