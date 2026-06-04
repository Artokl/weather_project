const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

function fetchWithTimeout(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

function buildForecastUrl(latitude, longitude, options = {}) {
  const { temperatureUnit = 'celsius', timezone = 'auto' } = options;

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    forecast_days: '16',
    timezone,
    temperature_unit: temperatureUnit,
    wind_speed_unit: 'ms',
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m'
    ].join(','),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'relative_humidity_2m',
      'cloud_cover',
      'visibility',
      'uv_index',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
      'is_day'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'daylight_duration',
      'uv_index_max',
      'precipitation_sum',
      'rain_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant'
    ].join(',')
  });

  return `${FORECAST_API_URL}?${params.toString()}`;
}

function buildGeocodingUrl(cityName, language = 'ru', count = 8) {
  const params = new URLSearchParams({
    name: cityName,
    count: String(count),
    language,
    format: 'json'
  });

  return `${GEOCODING_API_URL}?${params.toString()}`;
}

function buildReverseGeocodingUrl(latitude, longitude, language = 'ru') {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '10',
    addressdetails: '1',
    'accept-language': language
  });

  return `${NOMINATIM_REVERSE_URL}?${params.toString()}`;
}

function pickAddressValue(address = {}, keys = []) {
  for (const key of keys) {
    if (address[key]) {
      return address[key];
    }
  }

  return '';
}

function classifyRemoteArea(latitude, longitude, language = 'ru') {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return language === 'en' ? 'Selected coordinates' : 'Выбранные координаты';
  }

  if (lat <= -60) return language === 'en' ? 'Antarctica' : 'Антарктида';
  if (lat >= 66.5) return language === 'en' ? 'Arctic region' : 'Арктический регион';
  if (lat >= 15 && lat <= 32 && lon >= -17 && lon <= 35) return language === 'en' ? 'Sahara Desert' : 'Пустыня Сахара';
  if (lat >= 58 && lat <= 84 && lon >= -75 && lon <= -12) return language === 'en' ? 'Greenland' : 'Гренландия';
  if (lat >= -45 && lat <= -10 && lon >= 110 && lon <= 155) return language === 'en' ? 'Australia' : 'Австралия';
  if (lon > -70 && lon < 20 && lat > -60 && lat < 65) return language === 'en' ? 'Atlantic Ocean' : 'Атлантический океан';
  if ((lon >= 120 || lon <= -70) && lat > -60 && lat < 65) return language === 'en' ? 'Pacific Ocean' : 'Тихий океан';
  if (lon > 20 && lon < 120 && lat > -60 && lat < 30) return language === 'en' ? 'Indian Ocean' : 'Индийский океан';

  return language === 'en' ? 'Selected coordinates' : 'Выбранные координаты';
}

function buildPlaceFromReverse(data, latitude, longitude, language = 'ru') {
  const address = data?.address || {};
  const settlement = pickAddressValue(address, [
    'city',
    'town',
    'village',
    'hamlet',
    'municipality',
    'suburb',
    'neighbourhood',
    'isolated_dwelling'
  ]);
  const naturalPlace = pickAddressValue(address, [
    'desert',
    'island',
    'archipelago',
    'nature_reserve',
    'national_park',
    'state_district',
    'county',
    'region',
    'state'
  ]);
  const displayFirstPart = String(data?.display_name || '').split(',').map((part) => part.trim()).find(Boolean);
  const fallbackArea = classifyRemoteArea(latitude, longitude, language);
  const name = settlement || naturalPlace || displayFirstPart || fallbackArea;
  const admin1 = address.state || address.region || address.county || address.state_district || '';
  const country = address.country || '';

  return {
    id: `coords-${latitude}-${longitude}`,
    customName: name,
    name,
    enName: name,
    country,
    enCountry: country,
    admin1,
    latitude: Number(latitude),
    longitude: Number(longitude),
    timezone: 'auto'
  };
}

export async function getWeather(latitude, longitude, options = {}) {
  try {
    const response = await fetchWithTimeout(buildForecastUrl(latitude, longitude, options));

    if (!response.ok) {
      throw new Error(`Ошибка сервера погоды: ${response.status}`);
    }

    const data = await response.json();

    if (!data.daily?.time || !data.hourly?.time) {
      throw new Error('Сервер погоды вернул данные в неожиданном формате.');
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Сервер погоды слишком долго не отвечает. Попробуйте еще раз.');
    }

    throw error;
  }
}

export async function searchCities(cityName, language = 'ru', count = 8) {
  try {
    const response = await fetchWithTimeout(buildGeocodingUrl(cityName, language, count));

    if (!response.ok) {
      throw new Error(`Ошибка сервера поиска города: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Сервер поиска города слишком долго не отвечает. Попробуйте еще раз.');
    }

    throw error;
  }
}


export async function reverseGeocode(latitude, longitude, language = 'ru') {
  try {
    const response = await fetchWithTimeout(buildReverseGeocodingUrl(latitude, longitude, language), 10000);

    if (!response.ok) {
      throw new Error(`Ошибка сервера поиска места: ${response.status}`);
    }

    const data = await response.json();
    return buildPlaceFromReverse(data, latitude, longitude, language);
  } catch {
    return buildPlaceFromReverse(null, latitude, longitude, language);
  }
}
