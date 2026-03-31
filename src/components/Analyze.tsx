import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  Camera, 
  Upload, 
  Leaf, 
  AlertCircle, 
  CheckCircle2, 
  Droplets, 
  FlaskConical, 
  Zap,
  RefreshCw,
  ChevronRight,
  Info,
  CloudRain,
  Thermometer,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveAnalysis } from '../lib/api';
import { fetchWeather, WeatherData, getWeatherAdvice } from '../lib/weather';

interface AnalysisResult {
  crop_name: string;
  disease_detected: string;
  confidence_score: number;
  severity_level: 'Low' | 'Moderate' | 'High' | 'None';
  organic_treatments: string[];
  chemical_treatments: string[];
  immediate_action: string;
}

const SYSTEM_INSTRUCTION = (weatherContext: string) => `You are an expert, highly analytical agronomist specializing in crops native to India and Kerala (e.g., Paddy, Coconut, Rubber, Spices, Tomatoes, Plantains). 

Your task is to analyze an uploaded image of a plant or leaf, identify the crop, detect any visible diseases or pest infestations, and provide actionable treatment protocols.

${weatherContext}

You must respond STRICTLY in valid JSON format. Do not include markdown code blocks (like \`\`\`json) in your final output, just the raw JSON object. Use the following schema:

{
  "crop_name": "String (Name of the plant)",
  "disease_detected": "String (Name of the disease or 'Healthy')",
  "confidence_score": "Number (Between 0 and 100)",
  "severity_level": "String ('Low', 'Moderate', 'High', or 'None')",
  "organic_treatments": [
    "String (Actionable organic/natural treatment 1)",
    "String (Actionable organic/natural treatment 2)"
  ],
  "chemical_treatments": [
    "String (Specific chemical fungicide/pesticide recommendation 1)",
    "String (Specific chemical recommendation 2)"
  ],
  "immediate_action": "String (One sentence on what the farmer should do right now, considering weather context if provided)"
}

If the image is too blurry to diagnose, set "disease_detected" to "Unclear Image" and the "confidence_score" to 0.`;

export default function Analyze() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch weather on mount
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
      setWeather(data);
    }, (err) => {
      console.error("Geolocation error:", err);
      // Fallback to default weather
      fetchWeather(10.8505, 76.2711).then(setWeather);
    });
  }, []);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        analyzeImage(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImage(dataUrl);
        analyzeImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const base64Data = base64Image.split(',')[1];
      
      const weatherContext = weather 
        ? `Current weather at location ${weather.location}: Temperature ${weather.temp}°C, Humidity ${weather.humidity}%, Precipitation ${weather.precipitation}mm, Condition: ${weather.condition}. Consider these factors when recommending treatments.`
        : "Weather data is currently unavailable.";

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            { text: "Analyze this plant image for diseases and pests." },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION(weatherContext),
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
        const parsedResult = JSON.parse(text) as AnalysisResult;
        setResult(parsedResult);

        // Save to backend
        try {
          await saveAnalysis({
            ...parsedResult,
            imageUrl: base64Image,
            weather: weather,
          });
        } catch (err) {
          console.error("Failed to save analysis:", err);
        }
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze the image. Please try again with a clearer photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setIsCameraOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Weather Widget */}
      {weather && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
              <CloudRain size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local Weather</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{weather.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-amber-500" />
              <span className="text-sm font-bold dark:text-gray-300">{weather.temp}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets size={16} className="text-blue-500" />
              <span className="text-sm font-bold dark:text-gray-300">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind size={16} className="text-gray-400" />
              <span className="text-sm font-bold dark:text-gray-300">{weather.condition}</span>
            </div>
          </div>
          <div className="text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-3 py-1.5 rounded-full">
            {getWeatherAdvice(weather)}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!image && !isCameraOpen ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4 py-12">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Protect your harvest.</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Upload a photo of a leaf or plant to get an instant diagnosis and treatment plan from our AI agronomist.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={startCamera}
                className="group relative h-64 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all hover:border-green-500 hover:bg-green-50/30 dark:hover:bg-green-900/10 overflow-hidden"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-gray-900 dark:text-white">Take Photo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Use your camera in the field</p>
                </div>
              </button>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-64 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer overflow-hidden"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                />
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-gray-900 dark:text-white">Upload Image</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select from your gallery</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl p-6 flex gap-4">
              <div className="text-amber-600 shrink-0">
                <Info size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-amber-900 dark:text-amber-400">Tips for better results</p>
                <ul className="text-sm text-amber-800/80 dark:text-amber-400/80 list-disc list-inside space-y-1">
                  <li>Ensure the leaf is well-lit and in focus</li>
                  <li>Capture both the top and bottom of the leaf if possible</li>
                  <li>Avoid blurry or distant shots</li>
                </ul>
              </div>
            </div>
          </motion.div>
        ) : isCameraOpen ? (
          <motion.div 
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative rounded-3xl overflow-hidden bg-black aspect-[3/4] max-h-[70vh] mx-auto shadow-2xl"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
              <button 
                onClick={stopCamera}
                className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <RefreshCw size={24} />
              </button>
              <button 
                onClick={captureImage}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
              </button>
              <div className="w-14 h-14"></div> {/* Spacer */}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="analysis"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Image Preview */}
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 aspect-square">
                  <img src={image!} alt="Captured" className="w-full h-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mb-4"
                      >
                        <RefreshCw size={48} className="text-green-400" />
                      </motion.div>
                      <p className="text-xl font-bold">Analyzing Crop...</p>
                      <p className="text-sm text-white/70 mt-2">Identifying diseases and pests native to Kerala</p>
                      
                      <div className="w-full max-w-xs bg-white/20 h-1.5 rounded-full mt-6 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 3 }}
                          className="bg-green-400 h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={reset}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={18} />
                  Start New Analysis
                </button>
              </div>

              {/* Results Area */}
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl p-6 flex gap-4 text-red-700 dark:text-red-400">
                    <AlertCircle className="shrink-0" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                {result && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Main Diagnosis Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Diagnosis Result</span>
                          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{result.crop_name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confidence</span>
                          <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{result.confidence_score}%</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                        {result.disease_detected === 'Healthy' ? (
                          <CheckCircle2 className="text-green-600" size={24} />
                        ) : (
                          <AlertCircle className="text-amber-600" size={24} />
                        )}
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Condition Detected</p>
                          <p className="font-bold text-gray-900 dark:text-white">{result.disease_detected}</p>
                        </div>
                        <div className="ml-auto px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-[10px] font-bold uppercase tracking-wider dark:text-gray-300">
                          Severity: {result.severity_level}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold">
                          <Zap size={18} />
                          <span>Immediate Action</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-green-50/50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100/50 dark:border-green-800/50 italic">
                          "{result.immediate_action}"
                        </p>
                      </div>
                    </div>

                    {/* Treatment Protocols */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                          <Droplets size={20} />
                          <h4 className="uppercase tracking-wider text-sm">Organic Treatments</h4>
                        </div>
                        <ul className="space-y-3">
                          {result.organic_treatments.map((t, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <div className="w-5 h-5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                                <ChevronRight size={12} strokeWidth={3} />
                              </div>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold">
                          <FlaskConical size={20} />
                          <h4 className="uppercase tracking-wider text-sm">Chemical Treatments</h4>
                        </div>
                        <ul className="space-y-3">
                          {result.chemical_treatments.map((t, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                <ChevronRight size={12} strokeWidth={3} />
                              </div>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
