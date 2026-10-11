import { SkyObject, ObserverLocation } from '../types/astronomy';
import Constants from 'expo-constants';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

export interface ChatContext {
  targetObject?: SkyObject | null;
  location?: ObserverLocation | null;
  timeContext?: string;
}

// Fallback intelligent offline astronomist responses
const generateOfflineAstronomerReply = (userQuery: string, context?: ChatContext): string => {
  const query = userQuery.toLowerCase();
  const obj = context?.targetObject;

  if (obj) {
    if (query.includes('how far') || query.includes('distance')) {
      if (obj.distanceLightYears) {
        return `${obj.name} is approximately ${obj.distanceLightYears} light-years away from Earth. That means the photons striking your eyes tonight departed during ancient history!`;
      }
      return `${obj.name} is a celestial object in our catalog. Its precise stellar parallax distance varies depending on orbital epoch.`;
    }

    if (query.includes('bright') || query.includes('magnitude') || query.includes('visible')) {
      return `${obj.name} has an apparent visual magnitude of ${obj.magnitude}. In astronomy, lower or negative numbers indicate brighter luminaries. Currently it is at altitude ${Math.round(obj.altitude)}° and azimuth ${Math.round(obj.azimuth)}°.`;
    }

    if (query.includes('constellation') || query.includes('where')) {
      return `${obj.name} is located in the constellation of ${obj.constellationName || 'the deep celestial sphere'}. Look toward ${Math.round(obj.azimuth)}° azimuth (${getDirectionName(obj.azimuth)}) at ~${Math.round(obj.altitude)}° above the horizon.`;
    }

    if (query.includes('myth') || query.includes('story') || query.includes('history')) {
      if (obj.mythology) {
        return `Ancient lore for ${obj.name}: ${obj.mythology}`;
      }
      return `${obj.name} is rich in celestial folklore across civilizations, symbolizing orientation and cosmic order.`;
    }

    if (query.includes('how to see') || query.includes('find') || query.includes('look')) {
      return `To see ${obj.name} with your naked eyes: Put your phone screen face down, let your pupils dilate for 5 minutes, and face ${getDirectionName(obj.azimuth)} (${Math.round(obj.azimuth)}°) at roughly ${Math.round(obj.altitude)}° above your horizon.`;
    }

    return `${obj.name} (${obj.latinName || obj.type}) is fascinating! ${obj.description} You can ask me about its distance, mythology, how to spot it, or its constellation.`;
  }

  // General questions
  if (query.includes('star') || query.includes('planet')) {
    return `Stars produce their own light through nuclear fusion in their cores, whereas planets reflect sunlight and typically do not twinkle as dramatically through Earth's turbulent atmosphere. Tap any star in the sky view to focus our chat on it!`;
  }

  return `I am your celestial guide! Select any star, planet, or constellation in the sky overlay, and I'll tell you its real-time position, mythology, physical distance, and tips to spot it with your naked eyes.`;
};

function getDirectionName(azimuth: number): string {
  const normalized = ((azimuth % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'North';
  if (normalized < 67.5) return 'North-East';
  if (normalized < 112.5) return 'East';
  if (normalized < 157.5) return 'South-East';
  if (normalized < 202.5) return 'South';
  if (normalized < 247.5) return 'South-West';
  if (normalized < 292.5) return 'West';
  return 'North-West';
}

export class AIChatService {
  private static apiKey: string = '';

  public static setApiKey(key: string) {
    this.apiKey = key.trim();
  }

  public static getApiKey(): string {
    if (this.apiKey) return this.apiKey;
    const configExtraKey = Constants.expoConfig?.extra?.apiKey;
    if (configExtraKey && typeof configExtraKey === 'string') {
      return configExtraKey.trim();
    }
    if (typeof process !== 'undefined') {
      const pKey = process.env?.EXPO_PUBLIC_APIKEY || process.env?.APIKEY;
      if (pKey) return pKey.trim();
    }
    return '';
  }

  public static async askAstronomer(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    context?: ChatContext
  ): Promise<string> {
    const target = context?.targetObject;

    const systemPrompt = `You are "SkyScout Celestial AI", a warm, passionate, and knowledgeable astronomer and night-sky guide.
You are helping a stargazer observing the night sky through an AR and sensor-fusion stargazing mobile app.
${
  target
    ? `The user is currently inspecting this celestial target:
- Name: ${target.name} (${target.latinName || target.type})
- Type: ${target.type}
- Constellation: ${target.constellationName || 'Unknown'}
- Magnitude (Brightness): ${target.magnitude}
- Distance: ${target.distanceLightYears ? `${target.distanceLightYears} light-years` : 'N/A'}
- Current Altitude above Horizon: ${Math.round(target.altitude)}° (${target.isVisible ? 'currently above horizon' : 'currently below horizon'})
- Current Azimuth Compass Heading: ${Math.round(target.azimuth)}° (${getDirectionName(target.azimuth)})
- Description: ${target.description}
- Mythology/Lore: ${target.mythology || 'Ancient astronomical object'}
- Stargazing hint: ${target.missionHint || 'Look toward its coordinates'}`
    : 'No single star is currently highlighted; answer questions about the night sky, stargazing, planets, and constellations.'
}
Keep answers engaging, conversational, concise (2-4 paragraphs maximum), and encourage them to look up at the actual sky and "touch grass" rather than staring at their screen for too long. If they ask specific questions (e.g. how far, mythology, how to find it), answer accurately based on the astronomical data provided.`;

    const effectiveApiKey = this.getApiKey();

    if (!effectiveApiKey) {
      console.warn('[AIChatService] No API key detected in Constants.expoConfig.extra or process.env. Using offline astronomer fallback.');
      // Use intelligent offline astronomical reasoning
      const lastUserMsg = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
      return generateOfflineAstronomerReply(lastUserMsg, context);
    }

    const candidateModels = [
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-flash-1.5',
      'meta-llama/llama-3.3-70b-instruct:free',
      'openrouter/auto',
    ];

    for (const modelName of candidateModels) {
      try {
        console.log(`[AIChatService] Calling OpenRouter model: ${modelName}`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${effectiveApiKey}`,
            'HTTP-Referer': 'https://skyscout.app',
            'X-Title': 'SkyScout Mobile Astronomer',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.warn(`[AIChatService] OpenRouter ${modelName} returned status ${response.status}:`, errorBody);
          continue; // Try next model candidate
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content && typeof content === 'string') {
          console.log(`[AIChatService] Received live AI completion from ${modelName}!`);
          return content.trim();
        }
      } catch (err) {
        console.warn(`[AIChatService] Fetch error with model ${modelName}:`, err);
      }
    }

    // If all models failed or offline, use local astronomical reasoning
    const lastUserMsg = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
    return generateOfflineAstronomerReply(lastUserMsg, context);
  }
}
