# CropCare AI 🌿

CropCare AI is a precision diagnostics tool designed to help farmers, particularly in India and Kerala, identify plant diseases and get instant, context-aware treatment protocols. By leveraging Google's Gemini AI and real-time weather data, it provides expert-level agricultural advice to minimize crop loss and improve yields.

## 🚀 Features

- **AI-Powered Disease Detection:** Analyze crop leaf images using Gemini 3 Flash to identify diseases, pests, and nutrient deficiencies.
- **Context-Aware Advice:** Integrates real-time weather data (via wttr.in) to provide localized treatment recommendations.
- **Community Forum:** A real-time discussion platform for farmers to share knowledge and get help from the community.
- **Analysis History:** Securely save and manage your crop analysis history with Firebase.
- **Responsive Design:** A modern, mobile-first interface with dark mode support, built with Tailwind CSS 4.

## 🧠 Google AI Usage

### Tools / Models Used
- **Gemini 3 Flash (`gemini-3-flash-preview`)**

### How Google AI Was Used
The Gemini 3 Flash model is the core engine of CropCare AI. When a user uploads a crop image, the model:
1.  **Identifies the Plant:** Recognizes the crop species (e.g., Coconut, Rubber, Paddy, Pepper).
2.  **Detects Issues:** Analyzes the leaf for signs of disease, pests, or nutrient stress.
3.  **Assesses Severity:** Provides a severity rating (Low, Medium, High).
4.  **Recommends Treatment:** Generates detailed organic and chemical treatment protocols, including specific products and application methods.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, Motion (Animations)
- **Backend:** Firebase (Authentication, Firestore)
- **AI Integration:** Google GenAI SDK (@google/genai)
- **Icons:** Lucide React

## 📸 Screenshots
- [AI Proof](./proof/AI_Proof.png)

  
- [Dashboard](./screenshots/proof1.jpeg)
- [AI Analysis](./screenshots/proof2.jpeg)

## 🎥 Demo Video

Upload your demo video to Google Drive and paste the shareable link here (max 3 minutes). [Watch Demo](https://drive.google.com/file/d/1oWzp67bFK2KpLCVqQNZdhE78JYR4EuVf/view?usp=drive_link)

## ⚙️ Installation Steps

```bash
# Clone the repository
git clone https://github.com/nozarash1/CropCare-AI

# Go to project folder
cd cropcare-ai

# Install dependencies
npm install

# Run the development server
npm run dev
```

## 📄 License
This project is licensed under the Apache-2.0 License.
