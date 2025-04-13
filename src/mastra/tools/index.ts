import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}
interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

// Supabaseクライアントの初期化 (環境変数からURLとキーを取得)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// 環境変数が設定されているか確認
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL (SUPABASE_URL) or Anon Key (SUPABASE_ANON_KEY) not found in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async ({ context }) => {
    return await getWeather(context.location);
  },
});

const getWeather = async (location: string) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}

// Tools for Coaching
export const saveCoachingDataTool = createTool({
  id: 'save-coaching-data',
  description: 'コーチングしたデータをDBに保存する',
  inputSchema: z.object({
    date: z.string().describe('コーチング日付'),
    type: z.string().describe('質問のタイプ。\'goal\' or \'reflection\''),
    question: z.string().describe('質問'),
    answer: z.string().describe('回答内容'),
  }),
  outputSchema: z.object({
    resultMessage: z.string(),
  }),
  execute: async ({ context }) => {
    return await saveCoachingData(new Date().toISOString().split('T')[0], context.type, context.question, context.answer);
  },
});

const saveCoachingData = async (date: string, type: string, question: string, answer: string) => {
  try {
    const { data, error } = await supabase
      .from('coaching_records')
      .insert([
        { date, type, question, answer },
      ])
      .select(); // オプション: 挿入されたデータを返す場合

    if (error) {
      console.error('Error inserting data:', error);
      return {
        resultMessage: `データの保存中にエラーが発生しました: ${error.message}`,
      };
    }

    console.log('Data inserted successfully:', data);
    const resultMessage = `コーチングデータを保存しました。日付: ${date}, タイプ: ${type}, 質問: ${question}, 回答: ${answer}`;
    return {
      resultMessage: resultMessage,
    };

  } catch (err) {
    console.error('Unexpected error:', err);
    const message = err instanceof Error ? err.message : '不明なエラー';
    return {
      resultMessage: `予期せぬエラーが発生しました: ${message}`,
    };
  }
};
