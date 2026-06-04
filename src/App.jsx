import { useEffect, useMemo, useRef, useState } from 'react';
import { getWeather, reverseGeocode, searchCities } from './services/openMeteo.js';
import { buildRadarTileUrl, getLatestRadarFrame } from './services/rainViewer.js';
import { getThemeClass, getWeatherInfo } from './utils/weatherCodes.js';

const MOSCOW_COORDS = {
  latitude: '55.7558',
  longitude: '37.6173'
};

const POPULAR_CITIES = [
  { id: 'popular-moscow', name: 'Москва', enName: 'Moscow', country: 'Россия', enCountry: 'Russia', admin1: 'Москва', latitude: 55.7558, longitude: 37.6173, timezone: 'Europe/Moscow' },
  { id: 'popular-spb', name: 'Санкт-Петербург', enName: 'Saint Petersburg', country: 'Россия', enCountry: 'Russia', admin1: 'Санкт-Петербург', latitude: 59.9311, longitude: 30.3609, timezone: 'Europe/Moscow' },
  { id: 'popular-london', name: 'Лондон', enName: 'London', country: 'Великобритания', enCountry: 'United Kingdom', admin1: 'England', latitude: 51.5072, longitude: -0.1276, timezone: 'Europe/London' },
  { id: 'popular-new-york', name: 'Нью-Йорк', enName: 'New York', country: 'США', enCountry: 'United States', admin1: 'New York', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  { id: 'popular-paris', name: 'Париж', enName: 'Paris', country: 'Франция', enCountry: 'France', admin1: 'Île-de-France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { id: 'popular-berlin', name: 'Берлин', enName: 'Berlin', country: 'Германия', enCountry: 'Germany', admin1: 'Berlin', latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin' },
  { id: 'popular-tokyo', name: 'Токио', enName: 'Tokyo', country: 'Япония', enCountry: 'Japan', admin1: 'Tokyo', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { id: 'popular-dubai', name: 'Дубай', enName: 'Dubai', country: 'ОАЭ', enCountry: 'United Arab Emirates', admin1: 'Dubai', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'popular-istanbul', name: 'Стамбул', enName: 'Istanbul', country: 'Турция', enCountry: 'Türkiye', admin1: 'Istanbul', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { id: 'popular-seoul', name: 'Сеул', enName: 'Seoul', country: 'Южная Корея', enCountry: 'South Korea', admin1: 'Seoul', latitude: 37.5665, longitude: 126.978, timezone: 'Asia/Seoul' },
  { id: 'popular-sydney', name: 'Сидней', enName: 'Sydney', country: 'Австралия', enCountry: 'Australia', admin1: 'New South Wales', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { id: 'popular-rome', name: 'Рим', enName: 'Rome', country: 'Италия', enCountry: 'Italy', admin1: 'Lazio', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome' }
];

const TIMEZONE_OPTIONS = [
  { value: 'auto', ru: 'Авто', en: 'Auto' },
  { value: 'UTC', ru: 'UTC', en: 'UTC' },
  { value: 'Europe/Moscow', ru: 'Москва', en: 'Moscow' },
  { value: 'Europe/London', ru: 'Лондон', en: 'London' },
  { value: 'Europe/Berlin', ru: 'Берлин', en: 'Berlin' },
  { value: 'Europe/Paris', ru: 'Париж', en: 'Paris' },
  { value: 'America/New_York', ru: 'Нью-Йорк', en: 'New York' },
  { value: 'Asia/Tokyo', ru: 'Токио', en: 'Tokyo' },
  { value: 'Asia/Dubai', ru: 'Дубай', en: 'Dubai' }
];

const TEXT = {
  ru: {
    home: 'дом',
    title: 'Погода',
    search: 'Поиск',
    place: 'Локация: город, населенный пункт или место',
    placePlaceholder: 'Москва, Сочи, пустыня Сахара...',
    popular: 'Популярные города',
    suggestions: 'Подходящие города',
    find: 'Найти',
    useMyLocation: 'Моя геолокация',
    coordinates: 'Выбранная точка',
    latitude: 'Широта',
    longitude: 'Долгота',
    applyCoords: 'Показать',
    settings: 'Настройки',
    advancedSettings: 'Доп. настройки',
    hideAdvancedSettings: 'Скрыть доп. настройки',
    favorites: 'Избранные',
    saveFavorite: 'Сохранить текущую',
    noFavorites: 'Избранных локаций пока нет',
    temperature: 'Температура',
    timezone: 'Часовой пояс',
    language: 'Язык',
    today: 'Сегодня',
    current: 'Сейчас',
    hourly: 'Почасовой прогноз',
    weekly: 'Прогноз на 7 дней',
    monthButton: 'На месяц',
    monthForecast: 'Прогноз на месяц',
    monthForecastSubtitle: '30 дней от сегодняшней даты в выбранной локации',
    monthRange: 'Промежуток дней',
    fromDay: 'С дня',
    toDay: 'По день',
    exactForecast: 'прогноз',
    indicativeForecast: 'ориентир',
    monthHint: 'Дальние дни помечены как ориентир, если API не дает точный прогноз на эту дату.',
    selectDay: 'Открыть день',
    closeMonth: 'Закрыть прогноз на месяц',
    details: 'Подробно за день',
    max: 'Макс.',
    min: 'мин.',
    feelsLike: 'Ощущается как',
    precipitation: 'Осадки',
    rain: 'Дождь',
    humidity: 'Влажность',
    wind: 'Ветер',
    gusts: 'Порывы',
    directionLabel: 'Направление',
    pressure: 'Давление',
    visibility: 'Видимость',
    cloudCover: 'Облачность',
    uv: 'УФ-индекс',
    sunrise: 'Восход',
    sunset: 'Закат',
    daylight: 'Световой день',
    windUnit: 'м/с',
    pressureUnit: 'мм рт. ст.',
    km: 'км',
    mm: 'мм',
    loading: 'Загрузка...',
    searching: 'Ищем...',
    noCities: 'Населенный пункт не найден.',
    selectCityFirst: 'Введите название населенного пункта.',
    coordsNumberError: 'Введите широту и долготу числами.',
    latitudeRangeError: 'Широта должна быть в диапазоне от -90 до 90.',
    longitudeRangeError: 'Долгота должна быть в диапазоне от -180 до 180.',
    weatherError: 'Не удалось получить прогноз погоды.',
    geolocationUnsupported: 'Ваш браузер не поддерживает определение геолокации.',
    geolocationDenied: 'Не удалось определить геолокацию. Проверьте разрешение в браузере.',
    myLocation: 'Моя геолокация',
    countryUnknown: 'страна не указана',
    openControls: 'Открыть настройки',
    closeControls: 'Скрыть настройки',
    selectedDay: 'Выбранный день',
    clearError: 'Закрыть сообщение',
    chooseFromSuggestions: 'Выберите город из подсказок или нажмите «Найти» еще раз.',
    feelsCooler: 'По ощущениям прохладнее из-за ветра.',
    feelsWarmer: 'По ощущениям теплее фактической температуры.',
    uvLow: 'Низкий',
    uvModerate: 'Средний',
    uvHigh: 'Высокий',
    uvVeryHigh: 'Очень высокий',
    idealVisibility: 'Идеальная видимость.',
    normalVisibility: 'Нормальная видимость.',
    poorVisibility: 'Видимость снижена.',
    rainToday: 'Сегодня ожидаются осадки.',
    rainSelectedDay: 'В выбранный день ожидаются осадки.',
    noHeavyRain: 'Сильные осадки не ожидаются.',
    selectedNoon: 'Около середины дня',
    locationLabel: 'выбранная локация',
    precipitationMap: 'Карта осадков',
    mapPlace: 'Текущая точка',
    radarMoving: 'Осадки движутся по направлению ветра',
    noPrecipitationNearby: 'Заметных осадков рядом не ожидается',
    sunsetChip: 'Закат',
    dragToScroll: 'зажмите и тяните',
    openPrecipitationMap: 'Открыть карту',
    closeMap: 'Закрыть карту',
    zoomIn: 'Приблизить',
    zoomOut: 'Отдалить',
    interactiveMapHint: 'Колесо — масштаб, зажатая мышь — перемещение',
    radarUnavailable: 'Радар временно недоступен',
    loadingTitle: 'Загружаем прогноз',
    loadingSubtitle: 'Получаем данные с сервера и настраиваем фон'
  },
  en: {
    home: 'home',
    title: 'Weather',
    search: 'Search',
    place: 'Location: city, settlement or place',
    placePlaceholder: 'Moscow, Sochi, Sahara Desert...',
    popular: 'Popular cities',
    suggestions: 'Matching cities',
    find: 'Find',
    useMyLocation: 'My geolocation',
    coordinates: 'Selected point',
    latitude: 'Latitude',
    longitude: 'Longitude',
    applyCoords: 'Show',
    settings: 'Settings',
    advancedSettings: 'Extra settings',
    hideAdvancedSettings: 'Hide extra settings',
    favorites: 'Favorites',
    saveFavorite: 'Save current',
    noFavorites: 'No favorite locations yet',
    temperature: 'Temperature',
    timezone: 'Timezone',
    language: 'Language',
    today: 'Today',
    current: 'Now',
    hourly: 'Hourly forecast',
    weekly: '7-day forecast',
    monthButton: 'Month',
    monthForecast: 'Monthly forecast',
    monthForecastSubtitle: '30 days from today for the selected location',
    monthRange: 'Day range',
    fromDay: 'From day',
    toDay: 'To day',
    exactForecast: 'forecast',
    indicativeForecast: 'guide',
    monthHint: 'Later days are marked as a guide when the API has no exact forecast for that date.',
    selectDay: 'Open day',
    closeMonth: 'Close monthly forecast',
    details: 'Day details',
    max: 'Max',
    min: 'min',
    feelsLike: 'Feels like',
    precipitation: 'Precipitation',
    rain: 'Rain',
    humidity: 'Humidity',
    wind: 'Wind',
    gusts: 'Gusts',
    directionLabel: 'Direction',
    pressure: 'Pressure',
    visibility: 'Visibility',
    cloudCover: 'Cloud cover',
    uv: 'UV index',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    daylight: 'Daylight',
    windUnit: 'm/s',
    pressureUnit: 'mmHg',
    km: 'km',
    mm: 'mm',
    loading: 'Loading...',
    searching: 'Searching...',
    noCities: 'No matching place found.',
    selectCityFirst: 'Enter a city or place name.',
    coordsNumberError: 'Enter latitude and longitude as numbers.',
    latitudeRangeError: 'Latitude must be between -90 and 90.',
    longitudeRangeError: 'Longitude must be between -180 and 180.',
    weatherError: 'Could not load the weather forecast.',
    geolocationUnsupported: 'Your browser does not support geolocation.',
    geolocationDenied: 'Could not determine your location. Check browser permission.',
    myLocation: 'My geolocation',
    countryUnknown: 'country not specified',
    openControls: 'Open controls',
    closeControls: 'Hide controls',
    selectedDay: 'Selected day',
    clearError: 'Close message',
    chooseFromSuggestions: 'Choose a city from suggestions or press Find again.',
    feelsCooler: 'Feels cooler because of wind.',
    feelsWarmer: 'Feels warmer than the measured temperature.',
    uvLow: 'Low',
    uvModerate: 'Moderate',
    uvHigh: 'High',
    uvVeryHigh: 'Very high',
    idealVisibility: 'Perfect visibility.',
    normalVisibility: 'Normal visibility.',
    poorVisibility: 'Reduced visibility.',
    rainToday: 'Precipitation is expected today.',
    rainSelectedDay: 'Precipitation is expected for the selected day.',
    noHeavyRain: 'No heavy precipitation expected.',
    selectedNoon: 'Around midday',
    locationLabel: 'selected location',
    precipitationMap: 'Precipitation map',
    mapPlace: 'Current point',
    radarMoving: 'Precipitation moves with wind direction',
    noPrecipitationNearby: 'No notable precipitation nearby is expected',
    sunsetChip: 'Sunset',
    dragToScroll: 'hold and drag',
    openPrecipitationMap: 'Open map',
    closeMap: 'Close map',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    interactiveMapHint: 'Wheel to zoom, hold mouse to pan',
    radarUnavailable: 'Radar is temporarily unavailable',
    loadingTitle: 'Loading forecast',
    loadingSubtitle: 'Fetching server data and tuning the background'
  }
};

const FAVORITES_STORAGE_KEY = 'weather-app-favorite-locations-v1';

function normalizeNumber(value) {
  return Number(String(value).trim().replace(',', '.'));
}

function round(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return Math.round(Number(value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTemperatureGraphicStyle(value) {
  const temp = Number(value);
  const safeTemp = Number.isFinite(temp) ? temp : 0;
  // У шкалы намеренно сжатый диапазон: разница между +19 и +36 должна быть видна,
  // но экстремальные значения не ломают градусник. Цвет оставляем постоянным.
  const tempFillHeight = clamp(((safeTemp + 15) / 55) * 76, 8, 76);
  const tempLevel = clamp((tempFillHeight / 76) * 100, 10, 100);

  return {
    '--temp-level': `${tempLevel}%`,
    '--temp-fill-height': `${tempFillHeight}px`,
    '--temp-fill-color': '#ff9d58',
    '--temp-fill-glow': 'rgba(255, 157, 88, 0.42)'
  };
}

function formatCoordinate(value) {
  return Number(value).toFixed(4);
}

function getTemperatureUnitSymbol(unit) {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

function getLocalizedPlaceName(place, language) {
  if (!place) {
    return language === 'en' ? 'Coordinates' : 'Координаты';
  }

  if (place.customName) return place.customName;
  return language === 'en' ? (place.enName || place.name) : (place.name || place.enName);
}

function getLocalizedCountry(place, language) {
  if (!place) return '';
  return language === 'en' ? (place.enCountry || place.country || place.country_code) : (place.country || place.enCountry || place.country_code);
}

function getPlaceSubtitle(place, language) {
  if (!place) {
    return '';
  }

  return [place.admin1, getLocalizedCountry(place, language)].filter(Boolean).join(', ') ||
    (language === 'en' ? 'Selected coordinates' : 'Выбранные координаты');
}

function validateCoordinates(latitude, longitude, text) {
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return text.coordsNumberError;
  }

  if (latitude < -90 || latitude > 90) {
    return text.latitudeRangeError;
  }

  if (longitude < -180 || longitude > 180) {
    return text.longitudeRangeError;
  }

  return '';
}

function formatDayName(value, language, full = false) {
  const options = full
    ? { weekday: 'long', day: 'numeric', month: 'long' }
    : { weekday: 'short' };

  return new Date(value).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU', options);
}

function formatDate(value, language) {
  return new Date(value).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

function formatTime(value, language) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleTimeString(language === 'en' ? 'en-US' : 'ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatHour(value, language) {
  return new Date(value).toLocaleTimeString(language === 'en' ? 'en-US' : 'ru-RU', {
    hour: 'numeric'
  });
}

function minutesToHours(seconds, language) {
  if (seconds === null || seconds === undefined) {
    return '—';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  return language === 'en' ? `${hours}h ${minutes}m` : `${hours} ч ${minutes} мин`;
}

function toMmHg(value) {
  const pressure = Number(value);

  if (!Number.isFinite(pressure)) {
    return null;
  }

  return pressure * 0.75006157584566;
}

function windDirection(degrees, language) {
  if (degrees === null || degrees === undefined) {
    return '—';
  }

  const ru = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
  const en = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(Number(degrees) / 45) % 8;
  return `${round(degrees)}° ${language === 'en' ? en[index] : ru[index]}`;
}

function sameDate(left, right) {
  return String(left).slice(0, 10) === String(right).slice(0, 10);
}

function getNextHourIso(timeValue) {
  const date = new Date(timeValue);
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date.toISOString().slice(0, 13);
}

function getPrecipitationDrivenIcon(precipitationProbability, precipitationAmount, currentIconType) {
  const probability = Number(precipitationProbability);
  const amount = Number(precipitationAmount);
  const hasProbability = Number.isFinite(probability);
  const hasAmount = Number.isFinite(amount);
  const currentIcon = String(currentIconType || '');

  if (currentIcon === 'snow' || currentIcon === 'thunder') {
    return null;
  }

  // Не превращаем переменную облачность в дождь только из-за процента вероятности.
  // Иконку осадков добавляем только когда есть реальная сумма/текущий объем осадков.
  if (hasAmount && amount >= 1.2) {
    return 'rain';
  }

  if (hasAmount && amount >= 0.18) {
    return hasProbability && probability >= 60 ? 'rain' : 'drizzle';
  }

  return null;
}

function applyPrecipitationToWeather(weather, precipitationProbability, precipitationAmount) {
  const probability = Number(precipitationProbability);
  const amount = Number(precipitationAmount);
  const hasPrecipitation = (Number.isFinite(amount) && amount > 0.03) || (Number.isFinite(probability) && probability >= 35);
  const precipitationIcons = new Set(['drizzle', 'rain', 'thunder', 'snow']);

  if (precipitationIcons.has(weather.iconType) && !hasPrecipitation) {
    return { ...weather, iconType: weather.iconType === 'snow' ? 'cloudy' : 'cloudy' };
  }

  const precipitationIcon = getPrecipitationDrivenIcon(precipitationProbability, precipitationAmount, weather.iconType);

  if (precipitationIcon && !precipitationIcons.has(weather.iconType)) {
    return { ...weather, iconType: precipitationIcon };
  }

  return weather;
}


function isPrecipitationCode(code) {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(Number(code));
}

function isSnowCode(code) {
  return [71, 73, 75, 77, 85, 86].includes(Number(code));
}

function isThunderCode(code) {
  return [82, 95, 96, 99].includes(Number(code));
}


function isFogCode(code) {
  return [45, 48].includes(Number(code));
}

function isHeavyRainCode(code) {
  return [55, 57, 65, 67, 82, 96, 99].includes(Number(code));
}

function isRainCode(code) {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(Number(code));
}

function getSunPhaseForBackground(current, selectedDay, selectedDayIndex) {
  if (selectedDayIndex !== 0) {
    return 'day';
  }

  const now = current?.time ? new Date(current.time).getTime() : NaN;
  const sunrise = selectedDay?.sunrise ? new Date(selectedDay.sunrise).getTime() : NaN;
  const sunset = selectedDay?.sunset ? new Date(selectedDay.sunset).getTime() : NaN;

  if (!Number.isFinite(now) || !Number.isFinite(sunrise) || !Number.isFinite(sunset)) {
    return current?.is_day === 0 ? 'night' : 'day';
  }

  const transitionWindow = 75 * 60 * 1000;

  if (now >= sunrise - transitionWindow && now <= sunrise + transitionWindow) {
    return 'dawn';
  }

  if (now >= sunset - transitionWindow && now <= sunset + transitionWindow) {
    return 'sunset';
  }

  if (now < sunrise || now > sunset || current?.is_day === 0) {
    return 'night';
  }

  return 'day';
}

function getBackgroundCondition(meta, selectedDay, currentHour, selectedDayIndex) {
  const code = Number(selectedDayIndex === 0 ? (currentHour?.weatherCode ?? meta?.code) : selectedDay?.weatherCode);
  const icon = String(meta?.weather?.iconType || selectedDay?.iconType || currentHour?.iconType || 'cloudy').replace('-night', '');
  const precipitation = Number(selectedDayIndex === 0 ? (currentHour?.precipitation ?? meta?.current?.precipitation) : selectedDay?.precipitationSum);
  const cloudCover = Number(selectedDayIndex === 0 ? (currentHour?.cloudCover ?? meta?.current?.cloud_cover) : undefined);
  const hasMeasuredPrecipitation = Number.isFinite(precipitation) && precipitation >= (selectedDayIndex === 0 ? 0.08 : 0.35);
  const hasSignificantPrecipitation = Number.isFinite(precipitation) && precipitation >= (selectedDayIndex === 0 ? 1.4 : 2);

  if (icon === 'thunder' || (isThunderCode(code) && hasMeasuredPrecipitation)) {
    return 'thunder';
  }

  if (icon === 'snow' || (isSnowCode(code) && hasMeasuredPrecipitation)) {
    return 'snow';
  }

  if (isFogCode(code) || (Number.isFinite(currentHour?.visibility) && currentHour.visibility < 2000)) {
    return 'fog';
  }

  if ((icon === 'rain' && hasSignificantPrecipitation) || (isHeavyRainCode(code) && hasSignificantPrecipitation)) {
    return 'heavy-rain';
  }

  if (icon === 'rain' || (isRainCode(code) && hasMeasuredPrecipitation)) {
    return 'rain';
  }

  if (icon === 'drizzle' || (Number.isFinite(precipitation) && precipitation >= (selectedDayIndex === 0 ? 0.08 : 0.35))) {
    return 'drizzle';
  }

  if (Number.isFinite(cloudCover) && cloudCover >= 86) {
    return 'cloudy';
  }

  if (icon === 'cloudy') {
    return 'cloudy';
  }

  if (icon === 'partly' || (Number.isFinite(cloudCover) && cloudCover >= 32)) {
    return 'partly';
  }

  return 'clear';
}

function getRealisticBackgroundClass(meta, selectedDay, currentHour, selectedDayIndex) {
  const phase = getSunPhaseForBackground(meta?.current, selectedDay, selectedDayIndex);
  const condition = getBackgroundCondition(meta, selectedDay, currentHour, selectedDayIndex);
  const nightFlag = phase === 'night' ? 'bg-is-night' : 'bg-is-light';

  return `rich-bg bg-${phase} bg-${condition} ${nightFlag}`;
}

function getIconTitle(iconType, language) {
  const titles = {
    sunny: { ru: 'Ясно', en: 'Clear sky' },
    moon: { ru: 'Ясно', en: 'Clear sky' },
    partly: { ru: 'Переменная облачность', en: 'Partly cloudy' },
    'partly-night': { ru: 'Переменная облачность', en: 'Partly cloudy' },
    cloudy: { ru: 'Облачно', en: 'Cloudy' },
    drizzle: { ru: 'Небольшой дождь', en: 'Light rain' },
    rain: { ru: 'Дождь', en: 'Rain' },
    thunder: { ru: 'Гроза', en: 'Thunderstorm' },
    snow: { ru: 'Снег', en: 'Snow' }
  };

  return titles[iconType]?.[language] || titles[iconType]?.ru || (language === 'en' ? 'Weather' : 'Погода');
}

function getThemeClassFromIcon(iconType) {
  const icon = String(iconType || '').replace('-night', '');

  if (icon === 'sunny' || icon === 'moon') {
    return iconType === 'moon' ? 'theme-clear-night' : 'theme-clear-day';
  }

  if (icon === 'partly') {
    return iconType === 'partly-night' ? 'theme-cloudy-night' : 'theme-partly';
  }

  if (icon === 'drizzle' || icon === 'rain') {
    return 'theme-rain';
  }

  if (icon === 'thunder') {
    return 'theme-thunder';
  }

  if (icon === 'snow') {
    return 'theme-snow';
  }

  return 'theme-cloudy';
}

function getHourlyDayIndexes(data, date) {
  const times = data?.hourly?.time;

  if (!Array.isArray(times)) {
    return [];
  }

  return times
    .map((time, index) => ({ time, index }))
    .filter((item) => sameDate(item.time, date));
}

function summarizeDailyIconFromHourly(data, date, dailyCode, language, precipitationProbability, precipitationSum) {
  const baseWeather = getWeatherInfo(dailyCode, language, true);
  const dayItems = getHourlyDayIndexes(data, date);

  if (dayItems.length === 0) {
    return applyPrecipitationToWeather(baseWeather, precipitationProbability, precipitationSum);
  }

  const daytimeItems = dayItems.filter(({ time, index }) => {
    const isDayFlag = data.hourly.is_day?.[index];
    if (isDayFlag !== undefined && isDayFlag !== null) return isDayFlag !== 0;
    const hour = Number(String(time).slice(11, 13));
    return hour >= 7 && hour <= 20;
  });
  const visibleItems = daytimeItems.length >= 4 ? daytimeItems : dayItems;
  const totalHours = visibleItems.length || 1;
  let clearHours = 0;
  let partlyHours = 0;
  let cloudyHours = 0;
  let precipHours = 0;
  let thunderHours = 0;
  let snowHours = 0;
  let rainAmount = 0;
  let maxProbability = Number(precipitationProbability);

  for (const { index } of visibleItems) {
    const code = Number(data.hourly.weather_code?.[index]);
    const cloud = Number(data.hourly.cloud_cover?.[index]);
    const probability = Number(data.hourly.precipitation_probability?.[index]);
    const amount = Number(data.hourly.precipitation?.[index]);

    if (Number.isFinite(probability)) {
      maxProbability = Number.isFinite(maxProbability) ? Math.max(maxProbability, probability) : probability;
    }

    if (Number.isFinite(amount)) {
      rainAmount += Math.max(0, amount);
    }

    const hasHourlyPrecipitation =
      isPrecipitationCode(code) ||
      (Number.isFinite(amount) && amount >= 0.08) ||
      (Number.isFinite(probability) && probability >= 65 && Number.isFinite(amount) && amount > 0.01);

    if (hasHourlyPrecipitation) precipHours += 1;
    if (isThunderCode(code)) thunderHours += 1;
    if (isSnowCode(code)) snowHours += 1;

    if (Number.isFinite(cloud)) {
      if (cloud <= 22) clearHours += 1;
      else if (cloud <= 68) partlyHours += 1;
      else cloudyHours += 1;
    } else if (code === 0 || code === 1) {
      clearHours += 1;
    } else if (code === 2) {
      partlyHours += 1;
    } else {
      cloudyHours += 1;
    }
  }

  const dailySum = Number(precipitationSum);
  const effectiveRainAmount = Number.isFinite(dailySum) ? Math.max(dailySum, rainAmount) : rainAmount;
  const probability = Number.isFinite(maxProbability) ? maxProbability : 0;
  const precipShare = precipHours / totalHours;
  const clearShare = clearHours / totalHours;
  const partlyShare = partlyHours / totalHours;
  const cloudyShare = cloudyHours / totalHours;
  const sunScore = clearShare + partlyShare * 0.45;

  let iconType;

  // Дождь в дневной иконке рисуем только когда он реально занимает заметную часть дня
  // или есть нормальная сумма осадков. Пара часов с низкой вероятностью не портят ясный день.
  if ((thunderHours >= 1 && (effectiveRainAmount >= 0.8 || probability >= 45)) || (isThunderCode(dailyCode) && effectiveRainAmount >= 1.2)) {
    iconType = 'thunder';
  } else if ((snowHours >= 2 && (effectiveRainAmount >= 0.3 || probability >= 45)) || (isSnowCode(dailyCode) && effectiveRainAmount >= 0.6)) {
    iconType = 'snow';
  } else if (effectiveRainAmount >= 2 || (precipShare >= 0.25 && probability >= 60) || (effectiveRainAmount >= 0.8 && probability >= 55)) {
    iconType = 'rain';
  } else if (effectiveRainAmount >= 0.25 && (precipShare >= 0.12 || probability >= 45)) {
    iconType = 'drizzle';
  } else if (clearShare >= 0.62 || sunScore >= 0.80 || (clearShare >= 0.52 && partlyShare >= 0.24 && cloudyShare <= 0.18)) {
    iconType = 'sunny';
  } else if (clearShare + partlyShare >= 0.55 || sunScore >= 0.42) {
    iconType = 'partly';
  } else if (cloudyShare >= 0.55) {
    iconType = 'cloudy';
  } else {
    iconType = baseWeather.iconType === 'sunny' || baseWeather.iconType === 'partly' || baseWeather.iconType === 'cloudy'
      ? baseWeather.iconType
      : 'partly';
  }

  return {
    ...baseWeather,
    title: getIconTitle(iconType, language),
    iconType
  };
}

function getConsistentDailyWeatherInfo(code, language, precipitationProbability, precipitationSum, data, date) {
  if (data && date) {
    return summarizeDailyIconFromHourly(data, date, code, language, precipitationProbability, precipitationSum);
  }

  const weather = getWeatherInfo(code, language, true);
  return applyPrecipitationToWeather(weather, precipitationProbability, precipitationSum);
}

function buildForecast(data, language) {
  if (!data?.daily?.time) {
    return [];
  }

  return data.daily.time.map((date, index) => {
    const precipitationProbability = data.daily.precipitation_probability_max?.[index];
    const precipitationSum = data.daily.precipitation_sum?.[index];
    const weather = getConsistentDailyWeatherInfo(data.daily.weather_code[index], language, precipitationProbability, precipitationSum, data, date);

    return {
      date,
      weatherCode: data.daily.weather_code[index],
      weatherTitle: weather.title,
      iconType: weather.iconType,
      minTemp: data.daily.temperature_2m_min[index],
      maxTemp: data.daily.temperature_2m_max[index],
      apparentMin: data.daily.apparent_temperature_min?.[index],
      apparentMax: data.daily.apparent_temperature_max?.[index],
      precipitationProbability,
      precipitationSum,
      rainSum: data.daily.rain_sum?.[index],
      windMax: data.daily.wind_speed_10m_max?.[index],
      windGusts: data.daily.wind_gusts_10m_max?.[index],
      windDirection: data.daily.wind_direction_10m_dominant?.[index],
      sunrise: data.daily.sunrise?.[index],
      sunset: data.daily.sunset?.[index],
      daylight: data.daily.daylight_duration?.[index],
      uvIndex: data.daily.uv_index_max?.[index]
    };
  });
}


function dateToIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayIso() {
  return dateToIso(new Date());
}

function addDaysIso(startDate, offset) {
  const date = new Date(`${startDate}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return dateToIso(date);
}

function diffIsoDays(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function clampIsoDate(dateString, minDate, maxDate) {
  if (!dateString) return minDate;
  if (minDate && dateString < minDate) return minDate;
  if (maxDate && dateString > maxDate) return maxDate;
  return dateString;
}

function getMonthStartIso(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(1);
  return dateToIso(date);
}

function getMonthEndIso(dateString) {
  const date = new Date(`${getMonthStartIso(dateString)}T12:00:00`);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return dateToIso(date);
}

function addMonthsIso(dateString, offset) {
  const date = new Date(`${getMonthStartIso(dateString)}T12:00:00`);
  date.setMonth(date.getMonth() + offset);
  return dateToIso(date);
}

function getMondayWeekdayIndex(dateString) {
  return (new Date(`${dateString}T12:00:00`).getDay() + 6) % 7;
}

function formatPillDate(dateString, language) {
  if (!dateString) return '';

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ru-RU', {
    day: 'numeric',
    month: 'short'
  }).format(new Date(`${dateString}T12:00:00`));
}

function formatCalendarMonthTitle(dateString, language) {
  if (!dateString) return '';

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ru-RU', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(`${dateString}T12:00:00`));
}

function buildMonthForecast(forecast, language, startDate, totalDays = 30) {
  const baseDate = startDate || forecast[0]?.date || getTodayIso();

  if (!forecast.length) {
    return Array.from({ length: totalDays }, (_, index) => ({
      date: addDaysIso(baseDate, index),
      monthIndex: -1,
      isEstimated: true,
      minTemp: null,
      maxTemp: null,
      precipitationProbability: null,
      weatherTitle: language === 'en' ? 'Weather · guide' : 'Погода · ориентир',
      iconType: 'cloudy'
    }));
  }

  const firstForecastDate = forecast[0].date;
  const exactByDate = new Map(forecast.map((day, index) => [day.date, { ...day, monthIndex: index, isEstimated: false }]));
  const lastExact = forecast[forecast.length - 1];

  return Array.from({ length: totalDays }, (_, index) => {
    const date = addDaysIso(baseDate, index);
    const exactDay = exactByDate.get(date);

    if (exactDay) {
      return exactDay;
    }

    const offsetFromForecastStart = Math.abs(diffIsoDays(firstForecastDate, date));
    const reference = forecast[offsetFromForecastStart % forecast.length] || lastExact;
    const softShift = Math.sin((offsetFromForecastStart + index) * 0.72) * 1.2;
    const minTemp = Number(reference?.minTemp);
    const maxTemp = Number(reference?.maxTemp);
    const precipitation = Number(reference?.precipitationProbability);

    return {
      ...(reference || lastExact),
      date,
      monthIndex: -1,
      isEstimated: true,
      minTemp: Number.isFinite(minTemp) ? minTemp + softShift : reference?.minTemp,
      maxTemp: Number.isFinite(maxTemp) ? maxTemp + softShift : reference?.maxTemp,
      precipitationProbability: Number.isFinite(precipitation) ? clamp(precipitation + Math.sin((offsetFromForecastStart + index) * 1.18) * 8, 0, 100) : reference?.precipitationProbability,
      weatherTitle: language === 'en'
        ? `${reference?.weatherTitle || 'Weather'} · guide`
        : `${reference?.weatherTitle || 'Погода'} · ориентир`
    };
  });
}

function getDayByDate(forecast, selectedDate) {
  return forecast.find((day) => day.date === selectedDate);
}

function buildHourlyForDate(data, forecast, selectedDate, selectedDayIndex, language) {
  if (!data?.hourly?.time || !selectedDate) {
    return [];
  }

  const hourlyItems = data.hourly.time.map((time, index) => {
    const isDay = data.hourly.is_day?.[index] !== 0;
    const baseWeather = getWeatherInfo(data.hourly.weather_code[index], language, isDay);
    const weather = applyPrecipitationToWeather(
      baseWeather,
      data.hourly.precipitation_probability?.[index],
      data.hourly.precipitation?.[index]
    );

    return {
      type: 'weather',
      time,
      timestamp: new Date(time).getTime(),
      isCurrent: false,
      temp: data.hourly.temperature_2m[index],
      apparent: data.hourly.apparent_temperature?.[index],
      precipitationProbability: data.hourly.precipitation_probability?.[index],
      precipitation: data.hourly.precipitation?.[index],
      humidity: data.hourly.relative_humidity_2m?.[index],
      cloudCover: data.hourly.cloud_cover?.[index],
      visibility: data.hourly.visibility?.[index],
      uvIndex: data.hourly.uv_index?.[index],
      wind: data.hourly.wind_speed_10m?.[index],
      windDirection: data.hourly.wind_direction_10m?.[index],
      pressure: data.hourly.surface_pressure?.[index],
      weatherCode: data.hourly.weather_code?.[index],
      weatherTitle: weather.title,
      iconType: weather.iconType
    };
  });

  const selectedDay = getDayByDate(forecast, selectedDate);

  if (selectedDayIndex !== 0 || !data.current?.time) {
    const dayStart = new Date(`${selectedDate}T00:00`).getTime();
    const dayEnd = new Date(`${selectedDate}T23:59`).getTime();
    return withSunsetChip(
      hourlyItems.filter((item) => item.timestamp >= dayStart && item.timestamp <= dayEnd).slice(0, 24),
      selectedDay,
      language
    );
  }

  const currentTimestamp = new Date(data.current.time).getTime();
  const currentHourPrefix = data.current.time.slice(0, 13);
  const matchingCurrentHour = hourlyItems.find((item) => item.time.slice(0, 13) === currentHourPrefix);
  const currentWeatherCode = matchingCurrentHour?.weatherCode ?? data.current.weather_code;
  const baseNowWeather = getWeatherInfo(currentWeatherCode, language, data.current.is_day !== 0);
  const nowWeather = applyPrecipitationToWeather(
    baseNowWeather,
    matchingCurrentHour?.precipitationProbability,
    data.current.precipitation
  );
  const currentItem = {
    type: 'weather',
    time: data.current.time,
    timestamp: currentTimestamp,
    isCurrent: true,
    temp: data.current.temperature_2m,
    apparent: data.current.apparent_temperature,
    precipitationProbability: matchingCurrentHour?.precipitationProbability ?? 0,
    precipitation: data.current.precipitation,
    humidity: data.current.relative_humidity_2m,
    cloudCover: data.current.cloud_cover,
    visibility: matchingCurrentHour?.visibility,
    uvIndex: data.current.is_day === 0 ? 0 : (matchingCurrentHour?.uvIndex ?? selectedDay?.uvIndex),
    wind: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    pressure: data.current.pressure_msl,
    weatherCode: currentWeatherCode,
    weatherTitle: nowWeather.title,
    iconType: nowWeather.iconType
  };

  const nextHour = new Date(data.current.time);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  const endTime = new Date(data.current.time);
  endTime.setMinutes(0, 0, 0);
  endTime.setHours(endTime.getHours() + 23);

  const futureHours = hourlyItems.filter((item) => item.timestamp >= nextHour.getTime() && item.timestamp <= endTime.getTime());
  return withSunsetChip([currentItem, ...futureHours].slice(0, 24), selectedDay, language);
}

function withSunsetChip(items, selectedDay, language) {
  if (!selectedDay?.sunset || items.length === 0) {
    return items;
  }

  const sunsetTime = new Date(selectedDay.sunset).getTime();
  const firstTime = items[0].timestamp;
  const lastTime = items[items.length - 1].timestamp;

  if (sunsetTime < firstTime || sunsetTime > lastTime + 60 * 60 * 1000) {
    return items;
  }

  const sunsetItem = {
    type: 'sunset',
    time: selectedDay.sunset,
    timestamp: sunsetTime,
    label: language === 'en' ? 'Sunset' : 'Закат',
    temp: null,
    precipitationProbability: null,
    weatherTitle: language === 'en' ? 'Sunset' : 'Закат солнца',
    iconType: 'sunset'
  };

  return [...items, sunsetItem].sort((left, right) => left.timestamp - right.timestamp);
}

function getRangeStyle(day, allDays, currentTemp = null) {
  const values = allDays.flatMap((item) => [item.minTemp, item.maxTemp]).filter((value) => Number.isFinite(value));
  const globalMin = Math.min(...values);
  const globalMax = Math.max(...values);
  const total = globalMax - globalMin || 1;
  const start = ((day.minTemp - globalMin) / total) * 100;
  const end = ((day.maxTemp - globalMin) / total) * 100;
  const point = Number.isFinite(Number(currentTemp)) ? ((Number(currentTemp) - globalMin) / total) * 100 : null;

  return {
    '--range-start': `${clamp(start, 0, 100)}%`,
    '--range-end': `${clamp(end, 0, 100)}%`,
    '--current-point': point === null ? '-999px' : `${clamp(point, 0, 100)}%`
  };
}

function getUvLabel(value, text) {
  const uv = Number(value);

  if (!Number.isFinite(uv)) {
    return '—';
  }

  if (uv < 3) return text.uvLow;
  if (uv < 6) return text.uvModerate;
  if (uv < 8) return text.uvHigh;
  return text.uvVeryHigh;
}

function getUvAdvice(value, language, text) {
  const uv = Number(value);

  if (!Number.isFinite(uv)) {
    return language === 'en'
      ? 'No current UV data for this point.'
      : 'Актуальных данных по УФ для этой точки нет.';
  }

  const label = getUvLabel(uv, text);

  if (uv <= 0.5) {
    return language === 'en'
      ? `${label}. The sun is inactive now; UV protection is usually not needed.`
      : `${label}. Солнце сейчас не активно, защита от УФ обычно не нужна.`;
  }

  if (uv < 3) {
    return language === 'en'
      ? `${label}. You can stay outside comfortably; sunglasses help during long exposure.`
      : `${label}. Можно спокойно быть на улице, при долгой прогулке пригодятся очки.`;
  }

  if (uv < 6) {
    return language === 'en'
      ? `${label}. Use SPF and avoid sitting in direct sun for too long.`
      : `${label}. Лучше использовать SPF и не сидеть долго под прямым солнцем.`;
  }

  if (uv < 8) {
    return language === 'en'
      ? `${label}. SPF, sunglasses and shade are worth using, especially near midday.`
      : `${label}. Нужны SPF, очки и тень, особенно около середины дня.`;
  }

  if (uv < 11) {
    return language === 'en'
      ? `${label}. Limit direct sun, cover your skin and renew SPF regularly.`
      : `${label}. Лучше уходить в тень, закрывать кожу и обновлять SPF.`;
  }

  return language === 'en'
    ? `${label}. Extreme exposure: avoid direct sun without serious protection.`
    : `${label}. Экстремальный уровень: без хорошей защиты под прямое солнце лучше не выходить.`;
}

function getFeelsLikeNote(feels, measured, wind, humidity, language) {
  const apparent = Number(feels);
  const actual = Number(measured);
  const windSpeed = Number(wind);
  const humidityValue = Number(humidity);

  if (!Number.isFinite(apparent) || !Number.isFinite(actual)) {
    return language === 'en' ? 'Feels-like data is temporarily unavailable.' : 'Данных по ощущаемой температуре сейчас нет.';
  }

  const delta = apparent - actual;

  if (delta <= -7) {
    return language === 'en'
      ? 'Feels much colder: wind removes heat quickly.'
      : 'Ощущается заметно холоднее: ветер быстро забирает тепло.';
  }

  if (delta <= -3) {
    if (Number.isFinite(windSpeed) && windSpeed >= 5) {
      return language === 'en' ? 'Feels cooler because of wind.' : 'Ощущается прохладнее из-за ветра.';
    }

    return language === 'en' ? 'Feels cooler than the measured temperature.' : 'Ощущается прохладнее фактической температуры.';
  }

  if (delta < -0.5) {
    return language === 'en' ? 'Feels slightly cooler than the thermometer shows.' : 'Чуть прохладнее, чем показывает термометр.';
  }

  if (delta >= 7) {
    if (Number.isFinite(humidityValue) && humidityValue >= 65) {
      return language === 'en' ? 'Feels much hotter because of humidity.' : 'Ощущается намного жарче из-за влажности.';
    }

    return language === 'en' ? 'Feels much warmer in direct sun.' : 'Ощущается заметно теплее на солнце.';
  }

  if (delta >= 3) {
    return language === 'en' ? 'Feels warmer than the measured temperature.' : 'Ощущается теплее фактической температуры.';
  }

  if (actual <= -10) {
    return language === 'en' ? 'Hard frost; warmer clothes are needed.' : 'Сильный мороз, лучше одеться теплее.';
  }

  if (actual <= 5) {
    return language === 'en' ? 'Cool weather; an outer layer will help.' : 'Прохладно, верхний слой одежды не помешает.';
  }

  if (actual >= 30) {
    return language === 'en' ? 'Hot weather; drink water and avoid overheating.' : 'Жарко, лучше пить воду и избегать перегрева.';
  }

  return language === 'en' ? 'Almost the same as the measured temperature.' : 'Почти совпадает с фактической температурой.';
}

function formatOffsetClock(utcOffsetSeconds, nowMs = Date.now()) {
  const offset = Number(utcOffsetSeconds);

  if (!Number.isFinite(offset)) {
    return '';
  }

  const shifted = new Date(nowMs + offset * 1000);
  const hours = String(shifted.getUTCHours()).padStart(2, '0');
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function getVisibilityNote(value, text) {
  const kilometers = Number(value) / 1000;

  if (!Number.isFinite(kilometers)) return text.selectedNoon;
  if (kilometers >= 20) return text.idealVisibility;
  if (kilometers >= 8) return text.normalVisibility;
  return text.poorVisibility;
}

function calculateDewPoint(temperature, humidity) {
  const temp = Number(temperature);
  const relativeHumidity = Number(humidity);

  if (!Number.isFinite(temp) || !Number.isFinite(relativeHumidity) || relativeHumidity <= 0) {
    return null;
  }

  const safeHumidity = clamp(relativeHumidity, 1, 100);
  const a = 17.27;
  const b = 237.7;
  const gamma = ((a * temp) / (b + temp)) + Math.log(safeHumidity / 100);

  return (b * gamma) / (a - gamma);
}

function getDewPointNote(dewPoint, isToday, language) {
  if (!Number.isFinite(Number(dewPoint))) {
    return language === 'en' ? 'Dew point data is unavailable.' : 'Данных по точке росы сейчас нет.';
  }

  const label = language === 'en'
    ? (isToday ? 'Dew point now' : 'Daytime dew point')
    : (isToday ? 'Точка росы сейчас' : 'Точка росы днём');

  return `${label}: ${round(dewPoint)}°.`;
}

function getCurrentWeatherSummary(weatherData, language) {
  const current = weatherData?.current;

  if (!current || current.weather_code === undefined || current.weather_code === null) {
    return null;
  }

  const isDayNow = current.is_day !== 0;
  const baseWeather = getWeatherInfo(current.weather_code, language, isDayNow);
  const currentHourPrefix = current.time ? String(current.time).slice(0, 13) : '';
  const hourlyIndex = currentHourPrefix && Array.isArray(weatherData?.hourly?.time)
    ? weatherData.hourly.time.findIndex((time) => String(time).slice(0, 13) === currentHourPrefix)
    : -1;
  const hourlyCode = hourlyIndex >= 0 ? weatherData.hourly.weather_code?.[hourlyIndex] : undefined;
  const cloudCover = hourlyIndex >= 0 ? weatherData.hourly.cloud_cover?.[hourlyIndex] : current.cloud_cover;
  let summaryCode = hourlyCode ?? current.weather_code;

  if ((summaryCode === 2 || summaryCode === 3) && Number.isFinite(Number(cloudCover))) {
    if (Number(cloudCover) <= 24) {
      summaryCode = 0;
    } else if (summaryCode === 3 && Number(cloudCover) <= 70) {
      summaryCode = 2;
    }
  }

  const summaryBaseWeather = getWeatherInfo(summaryCode, language, isDayNow);
  const probability = hourlyIndex >= 0 ? weatherData.hourly.precipitation_probability?.[hourlyIndex] : 0;
  const precipitation = current.precipitation ?? (hourlyIndex >= 0 ? weatherData.hourly.precipitation?.[hourlyIndex] : 0);
  const weather = applyPrecipitationToWeather(summaryBaseWeather, probability, precipitation);

  return {
    ...weather,
    isDay: isDayNow,
    code: summaryCode
  };
}

function getSelectedMeta(weatherData, forecast, selectedDayIndex, language) {
  const selectedDay = forecast[selectedDayIndex] || forecast[0];
  const current = weatherData?.current;
  const isToday = selectedDayIndex === 0;
  const fallbackCode = isToday && current?.weather_code !== undefined ? current.weather_code : selectedDay?.weatherCode;
  const currentWeather = isToday ? getCurrentWeatherSummary(weatherData, language) : null;
  const fallbackWeather = getWeatherInfo(fallbackCode, language, currentWeather?.isDay ?? true);
  const weather = currentWeather
    ? { title: currentWeather.title, iconType: currentWeather.iconType }
    : {
        title: selectedDay?.weatherTitle || fallbackWeather.title,
        iconType: selectedDay?.iconType || fallbackWeather.iconType
      };
  const temp = isToday && current?.temperature_2m !== undefined ? current.temperature_2m : selectedDay?.maxTemp;

  return {
    selectedDay,
    current,
    code: isToday ? (currentWeather?.code ?? fallbackCode) : (selectedDay?.weatherCode ?? fallbackCode),
    weather,
    temp,
    isDay: currentWeather?.isDay ?? true
  };
}

function mapPopularCity(city, language) {
  return {
    ...city,
    displayName: language === 'en' ? city.enName : city.name,
    displayCountry: language === 'en' ? city.enCountry : city.country
  };
}

function normalizeCityResult(place) {
  return {
    ...place,
    id: place.id || `${place.name}-${place.latitude}-${place.longitude}`
  };
}

function RealisticWeatherBackground() {
  return (
    <div className="realistic-background" aria-hidden="true">
      <div className="bg-photo-base" />
    </div>
  );
}

function WeatherIcon({ type, code, isDay = true, size = 'md', title = '' }) {
  const info = type ? { iconType: type } : getWeatherInfo(code, 'ru', isDay);

  return (
    <span className={`weather-symbol weather-symbol-${size} icon-${info.iconType}`} title={title} aria-label={title || info.iconType}>
      <span className="sun" />
      <span className="moon" />
      <span className="cloud cloud-back" />
      <span className="cloud cloud-front" />
      <span className="rain rain-1" />
      <span className="rain rain-2" />
      <span className="rain rain-3" />
      <span className="bolt" />
      <span className="flake flake-1">✦</span>
      <span className="flake flake-2">✦</span>
      <span className="fog fog-1" />
      <span className="fog fog-2" />
    </span>
  );
}

function WeatherGraphic({ type, value, max = 100, direction = 0, sunrise, sunset, currentTime, isToday = false, unit = '' }) {
  const numericValue = Number(value);
  const hasValue = Number.isFinite(numericValue);
  const safeValue = hasValue ? numericValue : 0;
  const percent = clamp((safeValue / max) * 100, 0, 100);
  const pressurePercent = clamp(((safeValue || 760) - 720) / 80, 0, 1);
  const tempLevel = clamp(((safeValue + 30) / 75) * 100, 4, 100);

  if (type === 'uv') {
    return <div className="uv-graphic" style={{ '--level': `${percent}%` }}><i /></div>;
  }

  if (type === 'pressure') {
    return (
      <div className="pressure-graphic" style={{ '--angle': `${-130 + pressurePercent * 260}deg` }}>
        <i />
        <span className="pressure-equal">=</span>
        <b>{hasValue ? round(safeValue) : '—'}</b>
        <em>{unit}</em>
        <small className="pressure-down">↓</small>
        <small className="pressure-up">↑</small>
      </div>
    );
  }

  if (type === 'wind') {
    return (
      <div className="wind-graphic" style={{ '--direction': `${direction}deg` }}>
        <span>С</span><span>В</span><span>Ю</span><span>З</span><i />
      </div>
    );
  }

  if (type === 'sun') {
    const sunriseTime = sunrise ? new Date(sunrise).getTime() : NaN;
    const sunsetTime = sunset ? new Date(sunset).getTime() : NaN;
    const nowTime = currentTime ? new Date(currentTime).getTime() : NaN;
    const midpoint = Number.isFinite(sunriseTime) && Number.isFinite(sunsetTime) ? (sunriseTime + sunsetTime) / 2 : NaN;
    const activeTime = isToday && Number.isFinite(nowTime) ? nowTime : midpoint;
    const rawProgress = Number.isFinite(activeTime) && Number.isFinite(sunriseTime) && Number.isFinite(sunsetTime) && sunsetTime > sunriseTime
      ? (activeTime - sunriseTime) / (sunsetTime - sunriseTime)
      : 0.5;
    const sunProgress = clamp(rawProgress, -0.18, 1.18);
    const horizonY = 61;
    const sunriseX = 20;
    const sunsetX = 106;
    const sunLeft = sunriseX + sunProgress * (sunsetX - sunriseX);
    // Видимая дуга длиннее дневного промежутка: ее концы уходят ниже горизонта,
    // но ровно в моменты восхода/заката солнце находится на горизонтальной линии.
    const sunTop = horizonY - Math.sin(sunProgress * Math.PI) * 45;
    const isSunUp = Number.isFinite(activeTime) && Number.isFinite(sunriseTime) && Number.isFinite(sunsetTime) && activeTime >= sunriseTime && activeTime <= sunsetTime;

    return (
      <div
        className={`sun-graphic ${isSunUp ? 'sun-graphic-day' : 'sun-graphic-night'}`}
        style={{
          '--sun-left': `${sunLeft}px`,
          '--sun-top': `${sunTop}px`
        }}
      >
        <svg viewBox="0 0 126 86" aria-hidden="true" focusable="false">
          <path className="sun-arc" d="M5 75 C22 75 27 16 63 16 C99 16 104 75 121 75" />
          <path className="sun-horizon" d="M5 61 H121" />
        </svg>
        <i />
      </div>
    );
  }

  if (type === 'humidity') {
    const fillRatio = clamp(percent / 100, 0, 1);
    const waterFrontBottomY = 112;
    const waterBackBottomY = 100;
    const waterFrontY = waterFrontBottomY - fillRatio * 80;
    const waterBackY = waterFrontY - 10;
    const waterOpacity = safeValue > 0 ? 1 : 0;

    return (
      <div
        className="humidity-graphic humidity-graphic-cuboid"
        style={{
          '--level': `${percent}%`,
          '--humidity-water-opacity': waterOpacity
        }}
      >
        <svg className="humidity-cuboid" viewBox="0 0 140 130" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="humidityGlassFront" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
              <stop offset="26%" stopColor="rgba(255,255,255,0.07)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.16)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
            <linearGradient id="humidityGlassSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
            <linearGradient id="humidityWaterFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(190,252,255,0.96)" />
              <stop offset="55%" stopColor="rgba(91,214,255,0.9)" />
              <stop offset="100%" stopColor="rgba(39,139,255,0.88)" />
            </linearGradient>
            <linearGradient id="humidityWaterTop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(237,255,255,0.94)" />
              <stop offset="62%" stopColor="rgba(106,228,255,0.72)" />
              <stop offset="100%" stopColor="rgba(43,153,255,0.48)" />
            </linearGradient>
          </defs>

          <path className="humidity-cuboid-glass-back" d="M59 14 H110 V100 H59 Z" />
          <path className="humidity-cuboid-glass-side" d="M88 24 L110 14 V100 L88 112 Z" />
          <g className="humidity-water" opacity={waterOpacity}>
            <path className="humidity-cuboid-water-side" d={`M88 ${waterFrontY} L110 ${waterBackY} L110 ${waterBackBottomY} L88 ${waterFrontBottomY} Z`} />
            <path className="humidity-cuboid-water-front" d={`M38 ${waterFrontY} H88 V${waterFrontBottomY} H38 Z`} />
            <path className="humidity-cuboid-water-top" d={`M38 ${waterFrontY} L59 ${waterBackY} H110 L88 ${waterFrontY} Z`} />
          </g>
          <path className="humidity-cuboid-glass-top" d="M38 24 L59 14 H110 L88 24 Z" />
          <path className="humidity-cuboid-glass-front" d="M38 24 H88 V112 H38 Z" />
          <path className="humidity-cuboid-glass-edge" d="M38 24 L59 14 M88 24 L110 14 M88 112 L110 100 M110 14 V100" />
        </svg>
      </div>
    );
  }

  if (type === 'precip') {
    return <div className="precip-graphic"><i /><i /><i /></div>;
  }

  if (type === 'visibility') {
    return <div className="visibility-graphic"><i /><span /></div>;
  }

  return <div className="temp-graphic" style={getTemperatureGraphicStyle(safeValue)}><i /></div>;
}

function DetailCard({ card }) {
  return (
    <article className={`glass-card mini-card mini-card-${card.type}`}>
      <div className="mini-label">
        {card.iconClass ? <span className={`mini-line-icon mini-line-icon-${card.iconClass}`} aria-hidden="true" /> : <span>{card.icon}</span>}
        {card.label}
      </div>
      <div className="mini-content">
        <div>
          <strong>{card.value}</strong>
          <p>{card.note}</p>
        </div>
        <WeatherGraphic
          type={card.type}
          value={card.numericValue}
          max={card.max}
          direction={card.direction}
          sunrise={card.sunrise}
          sunset={card.sunset}
          currentTime={card.currentTime}
          isToday={card.isToday}
          unit={card.graphicUnit}
        />
      </div>
    </article>
  );
}

function latLonToTile(latitude, longitude, zoom = 9) {
  const latRad = (Number(latitude) * Math.PI) / 180;
  const n = 2 ** zoom;
  const x = Math.floor(((Number(longitude) + 180) / 360) * n);
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y, zoom };
}

function normalizeLongitude(value) {
  return ((((Number(value) + 180) % 360) + 360) % 360) - 180;
}

function latLonToWorld(latitude, longitude, zoom) {
  const safeLatitude = clamp(Number(latitude), -85.0511, 85.0511);
  const safeLongitude = normalizeLongitude(longitude);
  const latRad = (safeLatitude * Math.PI) / 180;
  const n = 2 ** zoom;
  const x = ((safeLongitude + 180) / 360) * n;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;

  return { x, y };
}

function worldToLatLon(x, y, zoom) {
  const n = 2 ** zoom;
  const normalizedX = ((x % n) + n) % n;
  const safeY = clamp(y, 0, n - 0.000001);
  const longitude = (normalizedX / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * safeY) / n)));
  const latitude = (latRad * 180) / Math.PI;

  return { latitude, longitude };
}

function buildSlippyTileGrid(latitude, longitude, zoom, radius = 3) {
  const world = latLonToWorld(latitude, longitude, zoom);
  const centerX = Math.floor(world.x);
  const centerY = Math.floor(world.y);
  const maxTile = 2 ** zoom;
  const tiles = [];

  for (let row = -radius; row <= radius; row += 1) {
    for (let column = -radius; column <= radius; column += 1) {
      const rawX = centerX + column;
      const rawY = centerY + row;

      if (rawY < 0 || rawY >= maxTile) {
        continue;
      }

      const x = ((rawX % maxTile) + maxTile) % maxTile;
      const y = rawY;
      const left = (rawX - world.x) * 256;
      const top = (rawY - world.y) * 256;

      tiles.push({
        key: `${zoom}-${rawX}-${rawY}`,
        x,
        y,
        zoom,
        style: {
          transform: `translate(${left}px, ${top}px)`
        }
      });
    }
  }

  return tiles;
}

function formatRadarTime(timestamp, language) {
  if (!timestamp) return '';

  return new Date(Number(timestamp) * 1000).toLocaleTimeString(language === 'en' ? 'en-US' : 'ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function AppLogo() {
  return (
    <span className="brand-app-icon static-app-logo" aria-hidden="true">
      <span className="app-logo-sun" />
      <span className="app-logo-cloud app-logo-cloud-back" />
      <span className="app-logo-cloud app-logo-cloud-front" />
      <span className="app-logo-gloss" />
    </span>
  );
}

function GeoPinIcon() {
  return <span className="geo-pin-icon" aria-hidden="true" />;
}

function SettingsIcon() {
  return (
    <span className="settings-gear-icon" aria-hidden="true">
      <span />
    </span>
  );
}

function LoadingState({ text }) {
  return (
    <section className="loading-state" aria-live="polite" aria-busy="true">
      <div className="liquid-loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h2>{text.loadingTitle}</h2>
      <p>{text.loadingSubtitle}</p>
    </section>
  );
}


function ScheduleIcon() {
  return (
    <span className="schedule-icon" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function MonthRangePicker({
  open,
  startDate,
  endDate,
  phase,
  language,
  onChange,
  onPhaseChange,
  onClose
}) {
  const [viewMonth, setViewMonth] = useState(() => getMonthStartIso(startDate || getTodayIso()));

  useEffect(() => {
    if (open) {
      setViewMonth(getMonthStartIso(startDate || getTodayIso()));
    }
  }, [open, startDate]);

  if (!open || !startDate || !endDate) {
    return null;
  }

  const todayIso = getTodayIso();
  const weekDays = language === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const monthStart = getMonthStartIso(viewMonth);
  const monthEnd = getMonthEndIso(viewMonth);
  const firstOffset = getMondayWeekdayIndex(monthStart);
  const startGridDate = addDaysIso(monthStart, -firstOffset);
  const activePhase = phase || 'start';
  const maxEndDate = addDaysIso(startDate, 29);
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = addDaysIso(startGridDate, index);
    const inRange = date >= startDate && date <= endDate;
    const isStart = date === startDate;
    const isEnd = date === endDate;
    const isToday = date === todayIso;
    const outside = date < monthStart || date > monthEnd;
    const tooFarEnd = activePhase === 'end' && date > maxEndDate;

    return {
      date,
      dayNumber: new Date(`${date}T12:00:00`).getDate(),
      outside,
      inRange,
      isStart,
      isEnd,
      isToday,
      disabled: tooFarEnd
    };
  });
  const previousMonth = addMonthsIso(viewMonth, -1);
  const nextMonth = addMonthsIso(viewMonth, 1);

  const selectDate = (date) => {
    if (activePhase === 'end') {
      if (date >= startDate && date <= maxEndDate) {
        onChange(startDate, date);
        onPhaseChange('start');
        return;
      }
    }

    const nextStart = date;
    const nextEnd = addDaysIso(nextStart, 29);
    onChange(nextStart, nextEnd);
    onPhaseChange('end');
  };

  return (
    <div className="date-picker-popover range-picker-popover" onMouseDown={(event) => event.stopPropagation()}>
      <div className="date-picker-head">
        <button className="date-picker-nav" type="button" onClick={() => setViewMonth(previousMonth)} aria-label={language === 'en' ? 'Previous month' : 'Предыдущий месяц'}>‹</button>
        <strong>{formatCalendarMonthTitle(viewMonth, language)}</strong>
        <button className="date-picker-nav" type="button" onClick={() => setViewMonth(nextMonth)} aria-label={language === 'en' ? 'Next month' : 'Следующий месяц'}>›</button>
        <button className="date-picker-close" type="button" onClick={onClose} aria-label={language === 'en' ? 'Close date picker' : 'Закрыть календарь'}>×</button>
      </div>
      <p className="range-picker-hint">
        {activePhase === 'end'
          ? (language === 'en' ? 'Choose the end date, up to 30 days from the start.' : 'Выбери конец интервала, максимум 30 дней от начала.')
          : (language === 'en' ? 'Choose the start date.' : 'Выбери начало интервала.')}
      </p>
      <div className="date-picker-weekdays">
        {weekDays.map((item) => <span key={item}>{item}</span>)}
      </div>
      <div className="date-picker-grid">
        {cells.map((cell) => (
          <button
            type="button"
            key={cell.date}
            className={`date-picker-day ${cell.inRange ? 'in-range' : ''} ${cell.isStart ? 'range-start selected' : ''} ${cell.isEnd ? 'range-end selected' : ''} ${cell.isToday ? 'today-marker' : ''} ${cell.outside ? 'outside' : ''} ${cell.disabled ? 'disabled' : ''}`}
            disabled={cell.disabled}
            onClick={() => selectDate(cell.date)}
          >
            <span>{cell.dayNumber}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MonthForecastModal({
  open,
  text,
  language,
  monthDays,
  visibleDays,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClose,
  onSelectDay
}) {
  const [rangePickerOpen, setRangePickerOpen] = useState(false);
  const [rangePickPhase, setRangePickPhase] = useState('start');

  useEffect(() => {
    if (!open) {
      setRangePickerOpen(false);
      setRangePickPhase('start');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const baseWeekDays = language === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const safeVisibleDays = visibleDays.length > 0 ? visibleDays : monthDays;
  const monthStartDate = startDate || monthDays[0]?.date || getTodayIso();
  const startWeekdayIndex = getMondayWeekdayIndex(monthStartDate);
  const weekDays = [...baseWeekDays.slice(startWeekdayIndex), ...baseWeekDays.slice(0, startWeekdayIndex)];
  const monthMaxEndDate = addDaysIso(monthStartDate, 29);
  const monthEndDate = clampIsoDate(endDate || monthMaxEndDate, monthStartDate, monthMaxEndDate);
  const rangeLength = Math.max(1, diffIsoDays(monthStartDate, monthEndDate) + 1);

  const openRangePicker = (phase) => {
    setRangePickPhase(phase);
    setRangePickerOpen(true);
  };

  const handleRangeChange = (nextStart, nextEnd) => {
    const safeStart = nextStart || monthStartDate;
    const safeEnd = clampIsoDate(nextEnd || safeStart, safeStart, addDaysIso(safeStart, 29));
    onStartDateChange(safeStart);
    onEndDateChange(safeEnd);
  };

  const stopScrollBubble = (event) => {
    event.stopPropagation();
  };

  return (
    <div className="month-modal month-calendar-modal" role="dialog" aria-modal="true" aria-label={text.monthForecast} onWheel={stopScrollBubble} onTouchMove={stopScrollBubble}>
      <button className="month-modal-backdrop" type="button" onClick={onClose} aria-label={text.closeMonth} />
      <section className="month-modal-card month-calendar-card glass-card" onWheel={stopScrollBubble} onTouchMove={stopScrollBubble}>
        <div className="month-calendar-header">
          <h3>{text.monthForecast}</h3>
          <button className="month-close-button" type="button" onClick={onClose} aria-label={text.closeMonth}>×</button>
        </div>

        <div className="month-calendar-controls month-range-controls month-single-range-controls">
          <div className="month-date-wrap month-range-picker-anchor">
            <button className="month-control-pill month-date-pill month-range-summary-pill" type="button" onClick={() => openRangePicker('start')}>
              <span className="mini-calendar-icon" aria-hidden="true" />
              <span>{formatPillDate(monthStartDate, language)} — {formatPillDate(monthEndDate, language)}</span>
            </button>
            <MonthRangePicker
              open={rangePickerOpen}
              startDate={monthStartDate}
              endDate={monthEndDate}
              phase={rangePickPhase}
              language={language}
              onChange={handleRangeChange}
              onPhaseChange={setRangePickPhase}
              onClose={() => setRangePickerOpen(false)}
            />
          </div>
          <div className="month-control-pill month-days-display month-days-summary" aria-label={language === 'en' ? `${rangeLength} days` : `${rangeLength} дней`}>
            <strong>{rangeLength}</strong>
            <span>{language === 'en' ? 'days' : 'дней'}</span>
          </div>
        </div>

        <div className="month-weekdays">
          {weekDays.map((item) => <span key={item}>{item}</span>)}
        </div>

        <div className="month-calendar-grid" onWheel={stopScrollBubble} onTouchMove={stopScrollBubble}>
          {safeVisibleDays.map((day) => (
            <button
              className={`month-day-cell ${day.isEstimated ? 'estimated' : ''}`}
              type="button"
              key={`${day.date}-${day.monthIndex}`}
              onClick={() => onSelectDay(day)}
              title={text.selectDay}
            >
              <b>{new Date(`${day.date}T12:00:00`).getDate()}</b>
              <WeatherIcon type={day.iconType} size="sm" title={day.weatherTitle} />
              <span className="month-day-temps"><em>{round(day.minTemp)}°</em><strong>{round(day.maxTemp)}°</strong></span>
            </button>
          ))}
        </div>

        <div className="month-calendar-legend">
          <span><WeatherIcon type="sunny" size="legend" title="" />{language === 'en' ? 'Sunny' : 'Солнечно'}</span>
          <span><WeatherIcon type="cloudy" size="legend" title="" />{language === 'en' ? 'Cloudy' : 'Облачно'}</span>
          <span><WeatherIcon type="rain" size="legend" title="" />{language === 'en' ? 'Rain' : 'Дождь'}</span>
          <span><WeatherIcon type="thunder" size="legend" title="" />{language === 'en' ? 'Storm' : 'Гроза'}</span>
        </div>
      </section>
    </div>
  );
}


function CustomSelect({ label, value, options, language, onChange }) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);
  const selected = options.find((item) => item.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsidePointerDown = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [open]);

  return (
    <label className="field select-field custom-select-field" ref={selectRef}>
      <span>{label}</span>
      <div className={`custom-select ${open ? 'open' : ''}`}>
        <button className="custom-select-button" type="button" onClick={() => setOpen((state) => !state)}>
          <span>{selected?.[language] || selected?.value}</span>
          <i aria-hidden="true" />
        </button>
        {open && (
          <div className="custom-select-menu">
            {options.map((item) => (
              <button
                type="button"
                key={item.value}
                className={item.value === value ? 'active' : ''}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                {item[language]}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

function PrecipitationMap({ latitude, longitude, selectedDay, selectedDayIndex = 0, current, text, language, onOpenMap }) {
  const coordinates = {
    latitude: Number(latitude),
    longitude: Number(longitude)
  };
  const previewZoom = 10;
  const tiles = buildSlippyTileGrid(coordinates.latitude, coordinates.longitude, previewZoom, 3);
  const precipitationChance = Number(selectedDay?.precipitationProbability || 0);
  const precipitationSum = Number(selectedDay?.precipitationSum || 0);
  const direction = Number(selectedDay?.windDirection ?? current?.wind_direction_10m ?? 235);
  const isCurrentDay = selectedDayIndex === 0;
  const displayTemp = isCurrentDay ? (current?.temperature_2m ?? selectedDay?.maxTemp) : selectedDay?.maxTemp;
  const hasPrecipitation = precipitationChance > 20 || precipitationSum > 0;

  return (
    <article className="glass-card forecast-card precip-map-card">
      <div className="card-title">
        <span>☔</span>
        <h3>{text.precipitationMap}</h3>
      </div>
      <button
        className="weather-map map-preview-button"
        type="button"
        onClick={onOpenMap}
        style={{ '--radar-direction': `${(direction + 180) % 360}deg`, '--radar-strength': `${clamp(precipitationChance, 12, 100)}%`, '--radar-opacity': hasPrecipitation ? 0.82 : 0.18 }}
        aria-label={text.openPrecipitationMap}
      >
        <div className="map-tiles" aria-hidden="true">
          {tiles.map((tile) => (
            <img
              key={`preview-${tile.key}`}
              src={`https://tile.openstreetmap.org/${tile.zoom}/${tile.x}/${tile.y}.png`}
              alt=""
              loading="lazy"
              draggable="false"
              style={tile.style}
            />
          ))}
        </div>
        <div className="map-shade" />
        <div className="radar-field" aria-hidden="true">
          <span className="radar-band radar-band-a" />
          <span className="radar-band radar-band-b" />
          <span className="radar-band radar-band-c" />
        </div>
        <div className="map-marker">
          <strong>{round(displayTemp)}°</strong>
          <span>{selectedDay?.date ? formatPillDate(selectedDay.date, language) : text.mapPlace}</span>
        </div>
        <span className="map-open-pill">{text.openPrecipitationMap}</span>
      </button>
      <p className="map-note">
        {hasPrecipitation ? text.radarMoving : text.noPrecipitationNearby}
      </p>
    </article>
  );
}

function InteractivePrecipitationMap({ open, onClose, latitude, longitude, selectedDay, selectedDayIndex = 0, current, text, language, radarFrame, temperatureUnit, utcOffsetSeconds }) {
  const [view, setView] = useState({
    latitude: Number(latitude),
    longitude: Number(longitude),
    zoom: 5
  });
  const [pointWeather, setPointWeather] = useState(null);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [pointLoading, setPointLoading] = useState(false);
  const mapDragRef = useRef({ active: false, pointerId: null, startX: 0, startY: 0, startView: null });
  const pointRequestRef = useRef(0);
  const fallbackPrecipitationChance = Number(selectedDay?.precipitationProbability || 0);
  const fallbackPrecipitationSum = Number(selectedDay?.precipitationSum || 0);
  const fallbackDirection = Number(selectedDay?.windDirection ?? current?.wind_direction_10m ?? 235);
  const isCurrentDay = selectedDayIndex === 0;
  const fallbackTemp = isCurrentDay ? (current?.temperature_2m ?? selectedDay?.maxTemp) : selectedDay?.maxTemp;
  const precipitationChance = Number(pointWeather?.precipitationChance ?? fallbackPrecipitationChance);
  const precipitationSum = Number(pointWeather?.precipitationSum ?? fallbackPrecipitationSum);
  const direction = Number(pointWeather?.direction ?? fallbackDirection);
  const displayTemp = pointWeather?.temp ?? fallbackTemp;
  const hasPrecipitation = precipitationChance > 20 || precipitationSum > 0;
  const showLiveRadar = isCurrentDay && Boolean(radarFrame?.path) && view.zoom <= 10;
  const mapStatusLabel = hasPrecipitation ? text.radarMoving : text.noPrecipitationNearby;
  const mapDateLabel = formatPillDate(pointWeather?.date || selectedDay?.date, language);
  const cornerLabel = isCurrentDay
    ? (formatOffsetClock(pointWeather?.utcOffsetSeconds ?? utcOffsetSeconds, clockTick) || (pointLoading ? '…' : '—'))
    : (mapDateLabel || (pointLoading ? '…' : '—'));
  const radarMotionDirection = (direction + 180) % 360;
  const tiles = useMemo(
    () => buildSlippyTileGrid(view.latitude, view.longitude, view.zoom, view.zoom >= 9 ? 4 : 3),
    [view.latitude, view.longitude, view.zoom]
  );

  useEffect(() => {
    if (!open) return;

    setPointWeather(null);
    setClockTick(Date.now());
    setView({
      latitude: Number(latitude),
      longitude: Number(longitude),
      zoom: 5
    });
  }, [open, latitude, longitude]);

  useEffect(() => {
    if (!open) return undefined;

    const intervalId = window.setInterval(() => setClockTick(Date.now()), 15000);
    return () => window.clearInterval(intervalId);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const requestId = pointRequestRef.current + 1;
    pointRequestRef.current = requestId;
    const timeoutId = window.setTimeout(async () => {
      setPointLoading(true);

      try {
        const data = await getWeather(view.latitude, view.longitude, {
          temperatureUnit,
          timezone: 'auto'
        });
        const forecastAtPoint = buildForecast(data, language);
        const selectedDate = selectedDay?.date;
        const matchedDay = forecastAtPoint.find((day) => sameDate(day.date, selectedDate)) || forecastAtPoint[0];
        const temp = isCurrentDay
          ? (data.current?.temperature_2m ?? matchedDay?.maxTemp)
          : matchedDay?.maxTemp;

        if (pointRequestRef.current !== requestId) return;

        setPointWeather({
          temp,
          precipitationChance: matchedDay?.precipitationProbability,
          precipitationSum: matchedDay?.precipitationSum,
          direction: matchedDay?.windDirection ?? data.current?.wind_direction_10m,
          date: matchedDay?.date || selectedDate,
          localTime: data.current?.time,
          utcOffsetSeconds: data.utc_offset_seconds,
          timezone: data.timezone,
          weatherTitle: matchedDay?.weatherTitle
        });
      } catch {
        if (pointRequestRef.current === requestId) {
          setPointWeather(null);
        }
      } finally {
        if (pointRequestRef.current === requestId) {
          setPointLoading(false);
        }
      }
    }, 460);

    return () => window.clearTimeout(timeoutId);
  }, [open, view.latitude, view.longitude, selectedDay?.date, selectedDayIndex, language, temperatureUnit, isCurrentDay]);

  if (!open) {
    return null;
  }

  function updateZoom(delta) {
    setView((currentView) => ({
      ...currentView,
      zoom: clamp(currentView.zoom + delta, 2, 18)
    }));
  }

  function handleMapWheel(event) {
    event.preventDefault();
    event.stopPropagation();
    updateZoom(event.deltaY < 0 ? 1 : -1);
  }

  function handleMapPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const element = event.currentTarget;
    mapDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startView: view
    };
    element.classList.add('dragging');
    element.setPointerCapture?.(event.pointerId);
  }

  function handleMapPointerMove(event) {
    const drag = mapDragRef.current;
    if (!drag.active || !drag.startView) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const startWorld = latLonToWorld(drag.startView.latitude, drag.startView.longitude, drag.startView.zoom);
    const nextWorld = {
      x: startWorld.x - dx / 256,
      y: startWorld.y - dy / 256
    };
    const nextCoordinates = worldToLatLon(nextWorld.x, nextWorld.y, drag.startView.zoom);

    setView({
      latitude: nextCoordinates.latitude,
      longitude: normalizeLongitude(nextCoordinates.longitude),
      zoom: drag.startView.zoom
    });
    event.preventDefault();
  }

  function finishMapDrag(event) {
    const drag = mapDragRef.current;
    if (!drag.active) return;

    event.currentTarget.classList.remove('dragging');
    event.currentTarget.releasePointerCapture?.(drag.pointerId);
    mapDragRef.current = { active: false, pointerId: null, startX: 0, startY: 0, startView: null };
  }

  return (
    <div className="map-modal" role="dialog" aria-modal="true" aria-label={text.precipitationMap} onWheel={(event) => event.stopPropagation()}>
      <div className="map-modal-backdrop" onClick={onClose} />
      <section className="glass-card map-modal-card" onWheel={(event) => event.stopPropagation()}>
        <div className="map-modal-header">
          <div>
            <p>{text.precipitationMap}</p>
            <h3>{mapStatusLabel}</h3>
          </div>
          <button className="icon-button map-close-button" type="button" onClick={onClose} aria-label={text.closeMap}>×</button>
        </div>

        <div
          className="interactive-map-canvas"
          onWheel={handleMapWheel}
          onPointerDown={handleMapPointerDown}
          onPointerMove={handleMapPointerMove}
          onPointerUp={finishMapDrag}
          onPointerCancel={finishMapDrag}
          onPointerLeave={finishMapDrag}
        >
          <div className="interactive-map-layer base-layer" aria-hidden="true">
            {tiles.map((tile) => (
              <img
                key={`base-${tile.key}`}
                src={`https://tile.openstreetmap.org/${tile.zoom}/${tile.x}/${tile.y}.png`}
                alt=""
                draggable="false"
                style={tile.style}
              />
            ))}
          </div>

          {showLiveRadar && (
            <div className="interactive-map-layer radar-layer" aria-hidden="true">
              {tiles.map((tile) => (
                <img
                  key={`radar-${tile.key}`}
                  src={buildRadarTileUrl(radarFrame, tile.zoom, tile.x, tile.y)}
                  alt=""
                  draggable="false"
                  style={tile.style}
                />
              ))}
            </div>
          )}

          <div
            className={`interactive-forecast-radar ${showLiveRadar ? 'with-live-radar' : ''} ${hasPrecipitation ? 'active' : 'quiet'}`}
            aria-hidden="true"
            style={{ '--radar-direction': `${radarMotionDirection}deg`, '--radar-strength': `${clamp(precipitationChance, 12, 100)}%`, '--radar-opacity': hasPrecipitation ? 0.78 : 0.10 }}
          >
            <span className="forecast-radar-band forecast-radar-band-a" />
            <span className="forecast-radar-band forecast-radar-band-b" />
            <span className="forecast-radar-band forecast-radar-band-c" />
            <span className="forecast-radar-band forecast-radar-band-d" />
          </div>

          <div className={`interactive-map-marker ${pointLoading ? 'loading' : ''}`}>
            <strong>{pointLoading && pointWeather === null ? '…' : `${round(displayTemp)}°`}</strong>
          </div>

          <div className="map-corner-time">
            <span>{cornerLabel}</span>
          </div>

          <div className="map-center-coordinates">
            {formatCoordinate(view.latitude)}, {formatCoordinate(view.longitude)}
          </div>

          <div className="map-zoom-controls">
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => updateZoom(1)} aria-label={text.zoomIn}>+</button>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => updateZoom(-1)} aria-label={text.zoomOut}>−</button>
          </div>
        </div>

        <div className="map-modal-footer">
          <span>{text.interactiveMapHint}</span>
          <span>{pointLoading ? text.loading : (pointWeather?.weatherTitle || mapStatusLabel)}</span>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = useState('ru');
  const [temperatureUnit, setTemperatureUnit] = useState('celsius');
  const [timezone, setTimezone] = useState('auto');
  const [latitudeInput, setLatitudeInput] = useState(MOSCOW_COORDS.latitude);
  const [longitudeInput, setLongitudeInput] = useState(MOSCOW_COORDS.longitude);
  const [cityInput, setCityInput] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [activeCityChoice, setActiveCityChoice] = useState(null);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState({
    name: 'Москва',
    enName: 'Moscow',
    country: 'Россия',
    enCountry: 'Russia',
    admin1: 'Москва',
    timezone: 'Europe/Moscow'
  });
  const [weatherData, setWeatherData] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [monthStartDate, setMonthStartDate] = useState('');
  const [monthEndDate, setMonthEndDate] = useState('');
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoritePlaces, setFavoritePlaces] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [radarFrame, setRadarFrame] = useState(null);
  const searchRequestId = useRef(0);
  const cityFieldRef = useRef(null);
  const favoriteMenuRef = useRef(null);
  const hourlyDragRef = useRef({ active: false, pointerId: null, startX: 0, scrollLeft: 0 });
  const hourlyStripRef = useRef(null);

  const text = TEXT[language];
  const unitSymbol = getTemperatureUnitSymbol(temperatureUnit);
  const forecast = useMemo(() => buildForecast(weatherData, language), [weatherData, language]);
  const weekForecast = useMemo(() => forecast.slice(0, 7), [forecast]);
  const defaultMonthStartDate = forecast[0]?.date || getTodayIso();
  const resolvedMonthStartDate = monthStartDate || defaultMonthStartDate;
  const resolvedMonthMaxEndDate = addDaysIso(resolvedMonthStartDate, 29);
  const resolvedMonthEndDate = clampIsoDate(monthEndDate || resolvedMonthMaxEndDate, resolvedMonthStartDate, resolvedMonthMaxEndDate);
  const monthForecast = useMemo(() => buildMonthForecast(forecast, language, resolvedMonthStartDate, 30), [forecast, language, resolvedMonthStartDate]);
  const monthRangeLength = Math.max(1, diffIsoDays(resolvedMonthStartDate, resolvedMonthEndDate) + 1);
  const visibleMonthForecast = monthForecast.slice(0, monthRangeLength);
  const meta = useMemo(
    () => getSelectedMeta(weatherData, forecast, selectedDayIndex, language),
    [weatherData, forecast, selectedDayIndex, language]
  );
  const hourly = useMemo(
    () => buildHourlyForDate(weatherData, forecast, meta.selectedDay?.date, selectedDayIndex, language),
    [weatherData, forecast, meta.selectedDay?.date, selectedDayIndex, language]
  );

  useEffect(() => {
    let frame = null;

    const updateScrollDepth = () => {
      frame = null;
      const scrollDepth = clamp(window.scrollY / 760, 0, 1);
      document.documentElement.style.setProperty('--weather-scroll-depth', scrollDepth.toFixed(3));
    };

    const requestUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(updateScrollDepth);
    };

    updateScrollDepth();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      document.documentElement.style.removeProperty('--weather-scroll-depth');
    };
  }, []);

  useEffect(() => {
    const strip = hourlyStripRef.current;
    if (!strip || !hourly.length) return;

    const frame = window.requestAnimationFrame(() => {
      if (selectedDayIndex === 0) {
        strip.scrollLeft = 0;
        return;
      }

      const tenAmChip = strip.querySelector('[data-hour="10"]');
      if (tenAmChip) {
        strip.scrollLeft = tenAmChip.offsetLeft - 18;
      } else {
        strip.scrollLeft = 0;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hourly, selectedDayIndex]);

  const themeClass = getThemeClassFromIcon(meta.weather.iconType);

  const popularSuggestions = useMemo(() => {
    const query = cityInput.trim().toLowerCase();
    return POPULAR_CITIES
      .map((city) => mapPopularCity(city, language))
      .filter((city) => {
        if (query.length < 2) return true;
        return `${city.name} ${city.enName} ${city.country} ${city.enCountry}`.toLowerCase().includes(query);
      })
      .slice(0, 8);
  }, [cityInput, language]);

  const citySuggestions = cityInput.trim().length >= 2 ? cityResults.map(normalizeCityResult) : popularSuggestions;

  function persistFavorites(nextFavorites) {
    setFavoritePlaces(nextFavorites);
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
    } catch {
      // Избранное просто не сохранится, если браузер запретил localStorage.
    }
  }

  function saveCurrentFavorite() {
    const latitude = normalizeNumber(latitudeInput);
    const longitude = normalizeNumber(longitudeInput);
    const name = getLocalizedPlaceName(selectedPlace, language) || cityInput || text.locationLabel;
    const favorite = {
      id: `${name}-${formatCoordinate(latitude)}-${formatCoordinate(longitude)}`,
      name,
      enName: selectedPlace?.enName,
      country: selectedPlace?.country,
      enCountry: selectedPlace?.enCountry,
      admin1: selectedPlace?.admin1,
      timezone: selectedPlace?.timezone,
      latitude,
      longitude
    };

    const withoutDuplicate = favoritePlaces.filter((item) => item.id !== favorite.id);
    persistFavorites([favorite, ...withoutDuplicate].slice(0, 8));
    setFavoritesOpen(true);
  }

  function openFavorite(place) {
    const normalizedPlace = normalizeCityResult(place);
    setFavoritesOpen(false);
    setAdvancedSettingsOpen(false);
    setSelectedDayIndex(0);
    setActiveCityChoice(normalizedPlace);
    setCityInput(getLocalizedPlaceName(normalizedPlace, language));
    setLatitudeInput(String(normalizedPlace.latitude));
    setLongitudeInput(String(normalizedPlace.longitude));
    loadWeather(normalizedPlace.latitude, normalizedPlace.longitude, normalizedPlace);
  }

  function removeFavorite(event, id) {
    event.stopPropagation();
    persistFavorites(favoritePlaces.filter((item) => item.id !== id));
  }

  async function loadWeather(latitudeValue, longitudeValue, place = selectedPlace, overrides = {}) {
    const latitude = normalizeNumber(latitudeValue);
    const longitude = normalizeNumber(longitudeValue);
    const validationError = validateCoordinates(latitude, longitude, text);

    if (validationError) {
      setError(validationError);
      return;
    }

    const nextTemperatureUnit = overrides.temperatureUnit || temperatureUnit;
    const nextTimezone = overrides.timezone || timezone;

    if (!overrides.keepLoading) {
      setLoading(true);
      setError('');
    }

    try {
      const data = await getWeather(latitude, longitude, {
        temperatureUnit: nextTemperatureUnit,
        timezone: nextTimezone
      });

      const nextPlace = place || { customName: text.coordinates, latitude, longitude };

      setLatitudeInput(String(latitude));
      setLongitudeInput(String(longitude));
      setSelectedPlace(nextPlace);
      setCityInput(getLocalizedPlaceName(nextPlace, language));
      setWeatherData(data);
      setSelectedDayIndex((currentIndex) => Math.min(currentIndex, data.daily.time.length - 1));
    } catch (requestError) {
      setError(requestError.message || text.weatherError);
    } finally {
      setLoading(false);
    }
  }

  async function handleCoordinatesSubmit(event) {
    event.preventDefault();
    const latitude = normalizeNumber(latitudeInput);
    const longitude = normalizeNumber(longitudeInput);
    const validationError = validateCoordinates(latitude, longitude, text);

    if (validationError) {
      setError(validationError);
      return;
    }

    setShowCitySuggestions(false);
    setLoading(true);
    setError('');

    const place = await resolveCoordinatesPlace(latitude, longitude);
    await loadWeather(latitude, longitude, place, { keepLoading: true });
  }

  async function findBestCityChoice() {
    const trimmed = cityInput.trim();

    if (!trimmed) {
      setError(text.selectCityFirst);
      return null;
    }

    if (activeCityChoice && getLocalizedPlaceName(activeCityChoice, language).toLowerCase() === trimmed.toLowerCase()) {
      return activeCityChoice;
    }

    const localMatch = citySuggestions.find((place) => {
      const name = getLocalizedPlaceName(place, language).toLowerCase();
      const secondName = String(place.enName || place.name || '').toLowerCase();
      return name === trimmed.toLowerCase() || secondName === trimmed.toLowerCase();
    });

    if (localMatch) {
      return localMatch;
    }

    setCityLoading(true);
    setError('');

    try {
      const results = await searchCities(trimmed, language, 8);
      setCityResults(results);

      if (results.length === 0) {
        setError(text.noCities);
        return null;
      }

      return normalizeCityResult(results[0]);
    } catch (requestError) {
      setError(requestError.message || text.noCities);
      return null;
    } finally {
      setCityLoading(false);
    }
  }

  async function handleCitySearch(event) {
    event.preventDefault();
    const place = await findBestCityChoice();

    if (!place) {
      setShowCitySuggestions(true);
      return;
    }

    setActiveCityChoice(place);
    setCityInput(getLocalizedPlaceName(place, language));
    setLatitudeInput(String(place.latitude));
    setLongitudeInput(String(place.longitude));
    setShowCitySuggestions(false);
    setSelectedDayIndex(0);
    loadWeather(place.latitude, place.longitude, place);
  }

  function handleCitySelect(place) {
    const normalizedPlace = normalizeCityResult(place);
    setActiveCityChoice(normalizedPlace);
    setLatitudeInput(String(normalizedPlace.latitude));
    setLongitudeInput(String(normalizedPlace.longitude));
    setCityInput(getLocalizedPlaceName(normalizedPlace, language));
    setShowCitySuggestions(false);
    setSelectedDayIndex(0);
    loadWeather(normalizedPlace.latitude, normalizedPlace.longitude, normalizedPlace);
  }

  function handleCityInputChange(event) {
    setCityInput(event.target.value);
    setActiveCityChoice(null);
    setShowCitySuggestions(true);
  }

  async function resolveCoordinatesPlace(latitude, longitude) {
    const resolvedPlace = await reverseGeocode(latitude, longitude, language);
    const resolvedName = getLocalizedPlaceName(resolvedPlace, language);

    setActiveCityChoice(resolvedPlace);
    setSelectedPlace(resolvedPlace);
    setCityInput(resolvedName);

    return resolvedPlace;
  }

  function handleGeolocation() {
    if (!navigator.geolocation) {
      setError(text.geolocationUnsupported);
      return;
    }

    setGeoLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setSelectedDayIndex(0);
        setLoading(true);
        setError('');

        const place = await resolveCoordinatesPlace(latitude, longitude);
        setGeoLoading(false);
        await loadWeather(latitude, longitude, place, { keepLoading: true });
      },
      () => {
        setGeoLoading(false);
        setError(text.geolocationDenied);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  function handleTemperatureUnitChange(unit) {
    setTemperatureUnit(unit);

    if (weatherData) {
      loadWeather(latitudeInput, longitudeInput, selectedPlace, { temperatureUnit: unit });
    }
  }

  function handleTimezoneChange(value) {
    setTimezone(value);

    if (weatherData) {
      loadWeather(latitudeInput, longitudeInput, selectedPlace, { timezone: value });
    }
  }

  function handleHorizontalWheel(event) {
    const element = event.currentTarget;
    if (!element) return;

    const hasHorizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    const usesShiftWheel = event.shiftKey && Math.abs(event.deltaY) > 0;

    if (!hasHorizontalIntent && !usesShiftWheel) {
      return;
    }

    element.scrollLeft += hasHorizontalIntent ? event.deltaX : event.deltaY;
    event.preventDefault();
  }

  function handleHourlyPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const element = event.currentTarget;
    hourlyDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: element.scrollLeft
    };
    element.classList.add('dragging');
    element.setPointerCapture?.(event.pointerId);
  }

  function handleHourlyPointerMove(event) {
    const drag = hourlyDragRef.current;
    if (!drag.active) return;

    const element = event.currentTarget;
    element.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
    event.preventDefault();
  }

  function finishHourlyPointerDrag(event) {
    const drag = hourlyDragRef.current;
    if (!drag.active) return;

    event.currentTarget.classList.remove('dragging');
    event.currentTarget.releasePointerCapture?.(drag.pointerId);
    hourlyDragRef.current = { active: false, pointerId: null, startX: 0, scrollLeft: 0 };
  }

  function openMonthForecast() {
    const start = defaultMonthStartDate;
    setMonthStartDate(start);
    setMonthEndDate(addDaysIso(start, 29));
    setMonthOpen(true);
  }

  function closeMonthForecast() {
    setMonthOpen(false);
    setMonthStartDate('');
    setMonthEndDate('');
  }

  function handleMonthDaySelect(day) {
    if (!day?.isEstimated && Number.isInteger(day.monthIndex)) {
      setSelectedDayIndex(day.monthIndex);
      closeMonthForecast();
    }
  }

  useEffect(() => {
    const handleOutsidePointerDown = (event) => {
      if (showCitySuggestions && cityFieldRef.current && !cityFieldRef.current.contains(event.target)) {
        setShowCitySuggestions(false);
      }

      if (favoritesOpen && favoriteMenuRef.current && !favoriteMenuRef.current.contains(event.target)) {
        setFavoritesOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [showCitySuggestions, favoritesOpen]);

  useEffect(() => {
    loadWeather(MOSCOW_COORDS.latitude, MOSCOW_COORDS.longitude, selectedPlace);
    // Первый запрос нужен только при открытии приложения.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRadarFrame() {
      try {
        const frame = await getLatestRadarFrame();
        if (!cancelled) {
          setRadarFrame(frame);
        }
      } catch {
        if (!cancelled) {
          setRadarFrame(null);
        }
      }
    }

    loadRadarFrame();
    const intervalId = window.setInterval(loadRadarFrame, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!monthOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [monthOpen]);

  useEffect(() => {
    const trimmed = cityInput.trim();

    if (trimmed.length < 2) {
      setCityResults([]);
      setCityLoading(false);
      return undefined;
    }

    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    setCityLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchCities(trimmed, language, 8);
        if (searchRequestId.current === requestId) {
          setCityResults(results);
        }
      } catch {
        if (searchRequestId.current === requestId) {
          setCityResults([]);
        }
      } finally {
        if (searchRequestId.current === requestId) {
          setCityLoading(false);
        }
      }
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [cityInput, language]);

  const placeName = getLocalizedPlaceName(selectedPlace, language);
  const placeSubtitle = getPlaceSubtitle(selectedPlace, language);
  const selectedDay = meta.selectedDay;
  const current = meta.current;
  const noonHour = hourly.find((item) => Number(String(item.time).slice(11, 13)) >= 12) || hourly[Math.floor(hourly.length / 2)] || {};
  const currentHour = hourly[0] || {};
  const realisticBackgroundClass = getRealisticBackgroundClass(meta, selectedDay, currentHour, selectedDayIndex);
  const feels = selectedDayIndex === 0 ? current?.apparent_temperature : selectedDay?.apparentMax;
  const measured = selectedDayIndex === 0 ? current?.temperature_2m : selectedDay?.maxTemp;
  const selectedWindSpeed = selectedDayIndex === 0 ? current?.wind_speed_10m : selectedDay?.windMax;
  const selectedHumidity = selectedDayIndex === 0 ? current?.relative_humidity_2m : noonHour.humidity;
  const selectedHumidityTemperature = selectedDayIndex === 0 ? current?.temperature_2m : noonHour.temp;
  const selectedDewPoint = calculateDewPoint(selectedHumidityTemperature, selectedHumidity);
  const selectedVisibility = selectedDayIndex === 0 ? currentHour.visibility : noonHour.visibility;
  const selectedUvIndex = selectedDayIndex === 0
    ? (current?.is_day === 0 ? 0 : (currentHour.uvIndex ?? selectedDay?.uvIndex))
    : selectedDay?.uvIndex;
  const selectedPressureMmHg = toMmHg(selectedDayIndex === 0 ? current?.pressure_msl : noonHour.pressure);
  const detailCards = selectedDay
    ? [
        {
          type: 'temp',
          label: text.feelsLike,
          value: `${round(feels)}°`,
          note: getFeelsLikeNote(feels, measured, selectedWindSpeed, selectedHumidity, language),
          iconClass: 'thermometer',
          numericValue: feels,
          max: 50
        },
        {
          type: 'uv',
          label: text.uv,
          value: round(selectedUvIndex),
          note: getUvAdvice(selectedUvIndex, language, text),
          icon: '☀︎',
          numericValue: selectedUvIndex,
          max: 12
        },
        {
          type: 'wind',
          label: text.wind,
          value: `${round(selectedDayIndex === 0 ? current?.wind_speed_10m : selectedDay.windMax)} ${text.windUnit}`,
          note: `${text.gusts}: ${round(selectedDayIndex === 0 ? current?.wind_gusts_10m : selectedDay.windGusts)} ${text.windUnit}
${text.directionLabel}: ${windDirection(selectedDayIndex === 0 ? current?.wind_direction_10m : selectedDay.windDirection, language)}`,
          icon: '≋',
          numericValue: selectedDayIndex === 0 ? current?.wind_speed_10m : selectedDay.windMax,
          max: 20,
          direction: selectedDayIndex === 0 ? current?.wind_direction_10m : selectedDay.windDirection
        },
        {
          type: 'precip',
          label: text.precipitation,
          value: `${round(selectedDay.precipitationSum)} ${text.mm}`,
          note: `${round(selectedDay.precipitationProbability)}%
${Number(selectedDay.precipitationSum) > 0 || Number(selectedDay.precipitationProbability) > 20 ? (selectedDayIndex === 0 ? text.rainToday : text.rainSelectedDay) : text.noHeavyRain}`,
          iconClass: 'drop',
          numericValue: selectedDay.precipitationProbability,
          max: 100
        },
        {
          type: 'sun',
          label: language === 'en' ? 'Sunrise/Sunset' : 'Восход/закат солнца',
          value: `${formatTime(selectedDay.sunrise, language)}`,
          note: `${text.sunset}: ${formatTime(selectedDay.sunset, language)}\n${text.daylight}: ${minutesToHours(selectedDay.daylight, language)}`,
          iconClass: 'sunset',
          numericValue: 50,
          max: 100,
          sunrise: selectedDay.sunrise,
          sunset: selectedDay.sunset,
          currentTime: selectedDayIndex === 0 ? current?.time : null,
          isToday: selectedDayIndex === 0
        },
        {
          type: 'pressure',
          label: text.pressure,
          value: `${selectedPressureMmHg === null ? '—' : round(selectedPressureMmHg)} ${text.pressureUnit}`,
          note: selectedDayIndex === 0 ? text.current : text.selectedNoon,
          iconClass: 'pressure',
          numericValue: selectedPressureMmHg,
          graphicUnit: text.pressureUnit,
          max: 800
        },
        {
          type: 'visibility',
          label: text.visibility,
          value: `${selectedVisibility ? Math.round(selectedVisibility / 1000) : '—'} ${text.km}`,
          note: getVisibilityNote(selectedVisibility, text),
          iconClass: 'visibility',
          numericValue: selectedVisibility ? selectedVisibility / 1000 : 0,
          max: 25
        },
        {
          type: 'humidity',
          label: text.humidity,
          value: `${round(selectedDayIndex === 0 ? current?.relative_humidity_2m : noonHour.humidity)}%`,
          note: getDewPointNote(selectedDewPoint, selectedDayIndex === 0, language),
          iconClass: 'humidity',
          numericValue: selectedDayIndex === 0 ? current?.relative_humidity_2m : noonHour.humidity,
          max: 100
        }
      ]
    : [];

  return (
    <main className={`weather-app ${themeClass} ${realisticBackgroundClass}`}>
      <RealisticWeatherBackground />
      <div className="sky-layer" aria-hidden="true" />
      <div className="weather-shell">
        <header className="top-panel brand-hero">
          <div className="brand-block">
            <AppLogo />
            <div>
              <p className="brand-caption"><span className="caption-open">Open-Meteo</span> <span className="caption-api">API</span></p>
              <h1 className="brand-title"><span>{text.title}</span></h1>
            </div>
          </div>
        </header>

        <section className={`controls-panel glass-card ${advancedSettingsOpen ? 'advanced-open' : ''}`} aria-label={text.settings}>
          <form className="search-line" onSubmit={handleCitySearch}>
            <label className="field field-wide city-field" ref={cityFieldRef}>
              <span>{text.place}</span>
              <div className="search-input-wrap">
                <input
                  type="text"
                  value={cityInput}
                  onChange={handleCityInputChange}
                  onFocus={() => setShowCitySuggestions(true)}
                  placeholder={text.placePlaceholder}
                  autoComplete="off"
                />
                {cityLoading && <i className="input-spinner" aria-hidden="true" />}
              </div>
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="city-suggestions">
                  <p>{cityInput.trim().length < 2 ? text.popular : text.suggestions}</p>
                  <div>
                    {citySuggestions.map((place) => {
                      const displayName = place.displayName || getLocalizedPlaceName(place, language);
                      const displayCountry = place.displayCountry || getLocalizedCountry(place, language) || text.countryUnknown;

                      return (
                        <button
                          type="button"
                          className="city-suggestion"
                          key={`${place.id}-${place.latitude}-${place.longitude}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleCitySelect(place)}
                        >
                          <span>
                            <strong>{displayName}</strong>
                            <small>{[place.admin1, displayCountry].filter(Boolean).join(', ')}</small>
                          </span>
                          <em>{formatCoordinate(place.latitude)}, {formatCoordinate(place.longitude)}</em>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </label>
            <button className="primary-button" type="submit" disabled={cityLoading || loading}>
              {cityLoading ? text.searching : text.find}
            </button>
            <button className="ghost-button location-button" type="button" onClick={handleGeolocation} disabled={geoLoading || loading}>
              {geoLoading ? text.loading : <><GeoPinIcon />{text.useMyLocation}</>}
            </button>
            <div className="favorite-menu-wrap" ref={favoriteMenuRef}>
              <button className="ghost-button favorite-toggle" type="button" onClick={() => setFavoritesOpen((value) => !value)}>
                <span aria-hidden="true">★</span>{text.favorites}
              </button>
              {favoritesOpen && (
                <div className="favorites-popover glass-card">
                  <button className="favorites-close-button" type="button" onClick={() => setFavoritesOpen(false)} aria-label={language === 'en' ? 'Close favorites' : 'Закрыть избранное'}>×</button>
                  <button className="save-favorite-button" type="button" onClick={saveCurrentFavorite}>＋ {text.saveFavorite}</button>
                  {favoritePlaces.length === 0 ? (
                    <p>{text.noFavorites}</p>
                  ) : (
                    <div className="favorite-list">
                      {favoritePlaces.map((place) => (
                        <button className="favorite-place" type="button" key={place.id} onClick={() => openFavorite(place)}>
                          <span>
                            <strong>{getLocalizedPlaceName(place, language)}</strong>
                            <small>{[place.admin1, getLocalizedCountry(place, language)].filter(Boolean).join(', ')}</small>
                          </span>
                          <em>{formatCoordinate(place.latitude)}, {formatCoordinate(place.longitude)}</em>
                          <i role="button" tabIndex="0" onClick={(event) => removeFavorite(event, place.id)}>×</i>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="ghost-button advanced-toggle" type="button" onClick={() => setAdvancedSettingsOpen((value) => !value)}>
              <SettingsIcon />{advancedSettingsOpen ? text.hideAdvancedSettings : text.advancedSettings}
            </button>
          </form>

          {advancedSettingsOpen && (
            <form className="coords-line" onSubmit={handleCoordinatesSubmit}>
              <label className="field">
                <span>{text.latitude}</span>
                <input
                  type="number"
                  min="-90"
                  max="90"
                  step="0.0001"
                  value={latitudeInput}
                  onChange={(event) => setLatitudeInput(event.target.value)}
                />
              </label>
              <label className="field">
                <span>{text.longitude}</span>
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="0.0001"
                  value={longitudeInput}
                  onChange={(event) => setLongitudeInput(event.target.value)}
                />
              </label>
              <button className="ghost-button" type="submit" disabled={loading}>
                {loading ? text.loading : text.applyCoords}
              </button>

              <div className="segmented" aria-label={text.temperature}>
                <button type="button" className={temperatureUnit === 'celsius' ? 'active' : ''} onClick={() => handleTemperatureUnitChange('celsius')}>°C</button>
                <button type="button" className={temperatureUnit === 'fahrenheit' ? 'active' : ''} onClick={() => handleTemperatureUnitChange('fahrenheit')}>°F</button>
              </div>

              <CustomSelect
                label={text.timezone}
                value={timezone}
                options={TIMEZONE_OPTIONS}
                language={language}
                onChange={handleTimezoneChange}
              />

              <div className="segmented" aria-label={text.language}>
                <button type="button" className={language === 'ru' ? 'active' : ''} onClick={() => setLanguage('ru')}>RU</button>
                <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
              </div>
            </form>
          )}
        </section>

        {error && (
          <div className="error-card glass-card" role="alert">
            <span>!</span>
            <p>{error}</p>
            <button type="button" onClick={() => setError('')} aria-label={text.clearError}>×</button>
          </div>
        )}

        {loading && <LoadingState text={text} />}

        {!loading && weatherData && selectedDay && (
          <section className="hero-section">
            <h2>{placeName}</h2>
            <p className="place-subtitle">{round(meta.temp)}° | {meta.weather.title}</p>
            <div className="hero-temp-wrap">
              <WeatherIcon type={meta.weather.iconType} size="hero" title={meta.weather.title} />
              <div className="hero-temp">
                <span>{round(meta.temp)}</span><sup>°</sup>
              </div>
            </div>
            <p className="minmax-line">
              {text.max}: {round(selectedDay.maxTemp)}°, {text.min}: {round(selectedDay.minTemp)}° · {placeSubtitle}
            </p>
          </section>
        )}

        {weatherData && !loading && selectedDay && (
          <section className="dashboard-grid">
            <article className="glass-card forecast-card hourly-card">
              <div className="card-title">
                <span>◷</span>
                <h3>{text.hourly}</h3>
                <small className="scroll-hint">↔ {text.dragToScroll}</small>
              </div>
              <div className="hourly-strip-shell">
                <div
                  ref={hourlyStripRef}
                  className="hourly-strip"
                  onWheel={handleHorizontalWheel}
                  onPointerDown={handleHourlyPointerDown}
                  onPointerMove={handleHourlyPointerMove}
                  onPointerUp={finishHourlyPointerDrag}
                  onPointerCancel={finishHourlyPointerDrag}
                  onPointerLeave={finishHourlyPointerDrag}
                  tabIndex={0}
                >
                  {hourly.map((hour) => (
                    <div
                      className={`hour-chip ${hour.type === 'sunset' ? 'sunset-chip' : ''}`}
                      key={`${hour.time}-${hour.isCurrent ? 'now' : hour.type}`}
                      title={hour.weatherTitle}
                      data-hour={hour.type === 'sunset' ? '' : String(new Date(hour.time).getHours()).padStart(2, '0')}
                    >
                      <span>{hour.isCurrent ? text.current : hour.type === 'sunset' ? formatTime(hour.time, language) : formatHour(hour.time, language)}</span>
                      <WeatherIcon type={hour.iconType} size="sm" title={hour.weatherTitle} />
                      <b>{hour.type === 'sunset' ? text.sunsetChip : `${round(hour.temp)}°`}</b>
                      <small>{hour.type === 'sunset' ? '' : `${round(hour.precipitationProbability)}%`}</small>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="glass-card forecast-card daily-card">
              <div className="card-title daily-title">
                <ScheduleIcon />
                <h3>{text.weekly}</h3>
                <button className="month-forecast-button" type="button" onClick={openMonthForecast}>
                  <span className="mini-calendar-icon" aria-hidden="true" />{text.monthButton}
                </button>
              </div>
              <div className="daily-list">
                {weekForecast.map((day, index) => (
                  <button
                    type="button"
                    className={`daily-row ${index === selectedDayIndex ? 'selected' : ''}`}
                    key={day.date}
                    onClick={() => setSelectedDayIndex(index)}
                  >
                    <span className="day-name">{index === 0 ? text.today : formatDayName(day.date, language)}</span>
                    <WeatherIcon type={day.iconType} size="sm" title={day.weatherTitle} />
                    <span className="rain-chance">{round(day.precipitationProbability)}%</span>
                    <span className="low-temp">{round(day.minTemp)}°</span>
                    <span className="range-track" style={getRangeStyle(day, weekForecast, index === 0 ? current?.temperature_2m : null)}>
                      <i />
                      {index === 0 && Number.isFinite(Number(current?.temperature_2m)) ? <b className="current-point" /> : null}
                    </span>
                    <span className="high-temp">{round(day.maxTemp)}°</span>
                  </button>
                ))}
              </div>
            </article>

            <PrecipitationMap
              latitude={latitudeInput}
              longitude={longitudeInput}
              selectedDay={selectedDay}
              selectedDayIndex={selectedDayIndex}
              current={current}
              text={text}
              language={language}
              onOpenMap={() => setMapOpen(true)}
            />

            <section className="details-grid">
              {detailCards.map((card) => (
                <DetailCard card={card} key={card.label} />
              ))}
            </section>
          </section>
        )}
      </div>
      {selectedDay && (
        <InteractivePrecipitationMap
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          latitude={latitudeInput}
          longitude={longitudeInput}
          selectedDay={selectedDay}
          selectedDayIndex={selectedDayIndex}
          current={current}
          text={text}
          language={language}
          radarFrame={radarFrame}
          temperatureUnit={temperatureUnit}
          utcOffsetSeconds={weatherData?.utc_offset_seconds}
        />
      )}
      <MonthForecastModal
        open={monthOpen}
        text={text}
        language={language}
        monthDays={monthForecast}
        visibleDays={visibleMonthForecast}
        startDate={resolvedMonthStartDate}
        endDate={resolvedMonthEndDate}
        onStartDateChange={setMonthStartDate}
        onEndDateChange={setMonthEndDate}
        onClose={closeMonthForecast}
        onSelectDay={handleMonthDaySelect}
      />
    </main>
  );
}
