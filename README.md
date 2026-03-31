# 🌿 CropCare AI

**CropCare AI** is a precision agriculture platform designed to empower Indian and Kerala farmers with expert-level crop diagnostics and treatment advice. By leveraging the power of **Google Gemini AI** and real-time **weather data**, the app provides highly localized and context-aware solutions for farm management.

---

## 🚀 Key Features

### 📸 AI-Powered Diagnostics
- **Instant Analysis**: Snap or upload photos of crop leaves for immediate disease identification.
- **Expert Knowledge**: Specialized in Indian and Kerala crops (Paddy, Coconut, Rubber, Spices, Plantains, etc.).
- **Treatment Protocols**: Get both organic and chemical treatment recommendations tailored to the specific disease.

### ☁️ Weather-Integrated Advice
- **Local Context**: Automatically fetches current weather data (Temperature, Humidity, Conditions) for your location.
- **Smart Recommendations**: Treatment advice adjusts based on weather (e.g., "Avoid spraying fungicide if rain is expected in the next 2 hours").

### 🤝 Community Forum
- **Real-time Discussion**: Share your findings with other farmers and seek advice from the community.
- **Image Sharing**: Post images of your plants to get peer feedback and expert opinions.
- **Engagement**: Like and comment on posts to build a supportive farming network.

### 📂 Personal History & Profile
- **Secure Sign-In**: Powered by Google Authentication.
- **Analysis History**: Keep a digital record of all your past diagnoses, complete with images and results.
- **Search & Filter**: Easily find past analyses by crop name or disease.

### 🌓 Modern & Responsive UI
- **Adaptive Theme**: Full support for Light and Dark modes with a nature-inspired aesthetic.
- **Mobile-First**: Designed for field use with large touch targets and a clean, intuitive layout.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion (Animations)
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore, Authentication)
- **AI Engine**: Google Gemini 1.5 Flash
- **Weather API**: OpenWeather API
- **Date Utilities**: date-fns

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/cropcare-ai.git
   cd cropcare-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key
   ```

4. **Firebase Configuration**:
   Place your `firebase-applet-config.json` in the `src/` directory.

5. **Start the development server**:
   ```bash
   npm run dev
   ```

---

## 🔒 Security & Data

CropCare AI implements robust **Firebase Security Rules** to ensure:
- **Data Privacy**: Users can only access their own analysis history.
- **PII Protection**: Sensitive user data (emails) is strictly locked down.
- **Schema Validation**: All Firestore writes are validated for type, length, and required fields.

---

## 📄 License

This project is licensed under the **Apache-2.0 License**.

---

## 👨‍🌾 Contributing

We welcome contributions to help improve CropCare AI! Whether it's adding support for more crops, improving the AI prompts, or enhancing the UI, feel free to open an issue or submit a pull request.

---

*Developed with ❤️ for the farming community.*
