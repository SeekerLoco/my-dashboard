// Maps Open-Meteo weather codes to a label and emoji icon.
export function getWeatherInfo(code: number) {
  if (code === 0) return { label: 'Clear', icon: '☀️' };
  if (code >= 1 && code <= 3) return { label: 'Partly cloudy', icon: '⛅' };
  if (code >= 45 && code <= 48) return { label: 'Fog', icon: '🌫️' };
  if (code >= 51 && code <= 67) return { label: 'Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: '❄️' };
  if (code >= 80 && code <= 82) return { label: 'Rain showers', icon: '🌦️' };
  if (code >= 85 && code <= 86) return { label: 'Snow showers', icon: '🌨️' };
  if (code >= 95) return { label: 'Thunderstorm', icon: '⛈️' };
  return { label: 'Unknown', icon: '❓' };
}
