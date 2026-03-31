export interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  precipitation: number;
  location: string;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    // Using wttr.in for a simple, keyless weather fetch
    const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
    if (!response.ok) throw new Error('Weather fetch failed');
    const data = await response.json();
    
    const current = data.current_condition[0];
    const nearest = data.nearest_area[0];
    
    return {
      temp: parseInt(current.temp_C),
      humidity: parseInt(current.humidity),
      condition: current.weatherDesc[0].value,
      precipitation: parseFloat(current.precipMM),
      location: `${nearest.areaName[0].value}, ${nearest.region[0].value}`
    };
  } catch (error) {
    console.error('Weather error:', error);
    // Fallback mock data if API fails
    return {
      temp: 28,
      humidity: 80,
      condition: 'Partly Cloudy',
      precipitation: 0,
      location: 'Kerala, India'
    };
  }
}

export function getWeatherAdvice(weather: WeatherData): string {
  if (weather.precipitation > 5) {
    return "Heavy rain expected. Avoid foliar sprays or fertilizer application as they may wash away.";
  }
  if (weather.humidity > 85 && weather.temp > 25) {
    return "High humidity and temperature detected. Fungal growth risk is high. Ensure proper ventilation.";
  }
  if (weather.temp > 35) {
    return "Extreme heat detected. Increase irrigation frequency to prevent heat stress.";
  }
  return "Weather conditions are stable for standard treatment protocols.";
}
