const fs = require('fs');
const path = require('path');

// Manually parse .env without external dotenv dependency
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const val = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

loadEnv();

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      apiKey: process.env.APIKEY || process.env.EXPO_PUBLIC_APIKEY || '',
    },
  };
};
