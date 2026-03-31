# CropCare AI

## Problem Statement
Farmers, particularly in regions like Kerala, India, face significant challenges in identifying crop diseases and pests in a timely manner. Traditional methods of diagnosis are often slow, inaccessible, or inaccurate, leading to substantial crop losses and reduced agricultural productivity.

## Project Description
**CropCare AI** is a precision diagnostics application designed to empower farmers with instant, expert-level agricultural advice. By leveraging advanced computer vision and artificial intelligence, the app allows users to upload or take photos of affected plants to receive an immediate diagnosis. 

Key features include:
- **AI-Powered Diagnosis:** Instant identification of plant diseases and pests.
- **Weather-Aware Recommendations:** Integrates real-time local weather data to provide treatment advice that is effective for current environmental conditions.
- **Comprehensive Treatment Plans:** Offers both organic and chemical treatment options for every diagnosis.
- **Community Forum:** A space for farmers to discuss plant health, share experiences, and support each other.
- **History Tracking:** Logged-in users can save their analysis history for future reference.

## Google AI Usage
### Tools / Models Used
- **Gemini 3 Flash** (`gemini-3-flash-preview`)

### How Google AI Was Used
The **Gemini 3 Flash** model is the core engine of CropCare AI. It is used in a multimodal capacity to analyze plant images. When a farmer uploads a photo, the app sends the image data along with a detailed system instruction and real-time weather context (temperature, humidity, condition) to the Gemini model. 

The model performs the following:
1. **Image Recognition:** Identifies the specific crop and the part of the plant shown.
2. **Disease Detection:** Analyzes visual symptoms to detect diseases or pest infestations.
3. **Contextual Reasoning:** Uses the provided weather data to determine the severity and the most appropriate "Immediate Action" for the farmer.
4. **Structured Output:** Returns a structured JSON response that the app parses to display actionable treatment protocols (organic and chemical).

## Proof of Google AI Usage
Attach screenshots in a `/proof` folder:
- [AI Proof](./proof/Ai_proof.jpeg)

## Screenshots
Add project screenshots:
- **Dashboard:** [Screenshot1](./screenshots/proof1.jpeg)
- **AI Analysis:** [Screenshot2](./screenshots/proof2.jpeg)

## Demo Video
Upload your demo video to Google Drive and paste the shareable link here (max 3 minutes). [Watch Demo](https://drive.google.com/file/d/your-video-id/view)

## Installation Steps
```bash
# Clone the repository
git clone <your-repo-link>

# Go to project folder
cd cropcare-ai

# Install dependencies
npm install

# Run the project
npm start
```
