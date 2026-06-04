const weatherCodes = {
  0: { ru: 'Ясно', en: 'Clear sky', theme: 'clear', iconType: 'sunny' },
  1: { ru: 'Преимущественно ясно', en: 'Mainly clear', theme: 'clear', iconType: 'sunny' },
  2: { ru: 'Переменная облачность', en: 'Partly cloudy', theme: 'partly', iconType: 'partly' },
  3: { ru: 'Пасмурно', en: 'Overcast', theme: 'cloudy', iconType: 'cloudy' },
  45: { ru: 'Туман', en: 'Fog', theme: 'cloudy', iconType: 'cloudy' },
  48: { ru: 'Изморозь и туман', en: 'Depositing rime fog', theme: 'cloudy', iconType: 'cloudy' },
  51: { ru: 'Слабая морось', en: 'Light drizzle', theme: 'rain', iconType: 'drizzle' },
  53: { ru: 'Морось', en: 'Drizzle', theme: 'rain', iconType: 'drizzle' },
  55: { ru: 'Сильная морось', en: 'Dense drizzle', theme: 'rain', iconType: 'rain' },
  56: { ru: 'Ледяная морось', en: 'Freezing drizzle', theme: 'rain', iconType: 'rain' },
  57: { ru: 'Сильная ледяная морось', en: 'Dense freezing drizzle', theme: 'rain', iconType: 'rain' },
  61: { ru: 'Слабый дождь', en: 'Slight rain', theme: 'rain', iconType: 'drizzle' },
  63: { ru: 'Дождь', en: 'Rain', theme: 'rain', iconType: 'rain' },
  65: { ru: 'Сильный дождь', en: 'Heavy rain', theme: 'rain', iconType: 'rain' },
  66: { ru: 'Ледяной дождь', en: 'Freezing rain', theme: 'rain', iconType: 'rain' },
  67: { ru: 'Сильный ледяной дождь', en: 'Heavy freezing rain', theme: 'rain', iconType: 'rain' },
  71: { ru: 'Слабый снег', en: 'Slight snow', theme: 'snow', iconType: 'snow' },
  73: { ru: 'Снег', en: 'Snow', theme: 'snow', iconType: 'snow' },
  75: { ru: 'Сильный снег', en: 'Heavy snow', theme: 'snow', iconType: 'snow' },
  77: { ru: 'Снежные зерна', en: 'Snow grains', theme: 'snow', iconType: 'snow' },
  80: { ru: 'Слабый ливень', en: 'Slight rain showers', theme: 'rain', iconType: 'drizzle' },
  81: { ru: 'Ливень', en: 'Rain showers', theme: 'rain', iconType: 'rain' },
  82: { ru: 'Сильный ливень', en: 'Violent rain showers', theme: 'thunder', iconType: 'thunder' },
  85: { ru: 'Слабый снегопад', en: 'Slight snow showers', theme: 'snow', iconType: 'snow' },
  86: { ru: 'Сильный снегопад', en: 'Heavy snow showers', theme: 'snow', iconType: 'snow' },
  95: { ru: 'Гроза', en: 'Thunderstorm', theme: 'thunder', iconType: 'thunder' },
  96: { ru: 'Гроза с градом', en: 'Thunderstorm with hail', theme: 'thunder', iconType: 'thunder' },
  99: { ru: 'Сильная гроза с градом', en: 'Heavy thunderstorm with hail', theme: 'thunder', iconType: 'thunder' }
};

export function getWeatherInfo(code, language = 'ru', isDay = true) {
  const fallback = language === 'en' ? 'Unknown' : 'Неизвестно';
  const weather = weatherCodes[code];

  if (!weather) {
    return { title: fallback, theme: 'cloudy', iconType: 'cloudy' };
  }

  const nightIcon = weather.iconType === 'sunny' || weather.iconType === 'partly'
    ? (weather.iconType === 'sunny' ? 'moon' : 'partly-night')
    : weather.iconType;

  return {
    title: weather[language] || weather.ru,
    theme: weather.theme,
    iconType: isDay ? weather.iconType : nightIcon
  };
}

export function getThemeClass(code, isDay = true) {
  const theme = weatherCodes[code]?.theme || 'cloudy';

  if (!isDay && (theme === 'clear' || theme === 'partly' || theme === 'cloudy')) {
    return theme === 'clear' ? 'theme-clear-night' : 'theme-cloudy-night';
  }

  return `theme-${theme}${theme === 'clear' ? '-day' : ''}`;
}
