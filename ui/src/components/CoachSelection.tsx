import React from 'react';

interface Coach {
  id: string;
  name: string;
  title: string;
  description: string;
  avatarSrc: string;
}

interface CoachSelectionProps {
  onSelectCoach: (coachId: string) => void;
}

const coaches: Coach[] = [
  {
    id: 'coach1',
    name: '佐藤 洋介',
    title: 'マーケプロダクト「XXX」案件PM',
    description: '20年以上のビジネス経験を持ち、多くの経営者やリーダーをサポート。明確な目標設定と行動計画の策定に強みがあります。',
    avatarSrc: '/images/coaching_ai_avator.png',
  },
  {
    id: 'coach2',
    name: '田中 真由美',
    title: 'キャリア＆ライフコーチAI案件 PM',
    description: 'キャリアと私生活のバランスを重視したコーチング。潜在能力を引き出し、自分らしいキャリアパスを見つけるサポートをします。',
    avatarSrc: '/images/coaching_ai_avator_2.png',
  },
];

export const CoachSelection: React.FC<CoachSelectionProps> = ({ onSelectCoach }) => {
  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        どのPJについて確認しますか？
      </h1>
      
      <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
        確認したいプロジェクトを選択してください。
        各プロジェクトの担当PMがサポートします。
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {coaches.map((coach) => (
          <div 
            key={coach.id}
            onClick={() => onSelectCoach(coach.id)}
            className="relative p-[1px] rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 cursor-pointer transform transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 blur-xl"></div>
            <div className="relative glass-effect rounded-xl overflow-hidden p-6 h-full">
              <div className="flex flex-col items-center">
                <div className="avatar-coach w-32 h-32 rounded-full overflow-hidden border-2 border-blue-400 shadow-lg shadow-blue-500/20 mb-6">
                  <img 
                    src={coach.avatarSrc} 
                    alt={coach.name} 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{coach.name}</h2>
                <p className="text-blue-300 mb-4">{coach.title}</p>
                <p className="text-gray-300 text-center">{coach.description}</p>
              </div>
              
              <div className="mt-6 text-center">
                <button className="ai-gradient-bg px-6 py-2 rounded-lg text-white font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20">
                  このPMを選択
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 