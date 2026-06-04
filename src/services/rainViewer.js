const RAIN_VIEWER_API_URL = 'https://api.rainviewer.com/public/weather-maps.json';

function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

export async function getLatestRadarFrame() {
  const response = await fetchWithTimeout(RAIN_VIEWER_API_URL);

  if (!response.ok) {
    throw new Error(`RainViewer radar error: ${response.status}`);
  }

  const data = await response.json();
  const pastFrames = Array.isArray(data?.radar?.past) ? data.radar.past : [];
  const nowcastFrames = Array.isArray(data?.radar?.nowcast) ? data.radar.nowcast : [];
  const frames = [...pastFrames, ...nowcastFrames];
  const latestFrame = frames[frames.length - 1];

  if (!data?.host || !latestFrame?.path) {
    throw new Error('RainViewer radar data is unavailable.');
  }

  return {
    host: data.host,
    path: latestFrame.path,
    time: latestFrame.time || null
  };
}

export function buildRadarTileUrl(frame, zoom, x, y) {
  if (!frame?.host || !frame?.path) {
    return '';
  }

  return `${frame.host}${frame.path}/256/${zoom}/${x}/${y}/2/1_1.png`;
}
