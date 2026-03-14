# Future Prophet App 🔮✨

This repository contains the source code for the **Future Prophet App**, an entertaining, AI-powered web application that uses Google's Gemini LLM to "predict" users' futures.

## 🔗 Live Application
- **Live Demo:** [Click Here to Visit](https://future-prophet-app.netlify.app/)

## 🛠 Tech Stack
- **Framework:** React 19, Vite
- **AI Integration:** `@google/generative-ai` (Gemini API)
- **Styling:** Tailwind CSS v4
- **Icons & Media:** `lucide-react`, `react-player`
- **Animations:** `canvas-confetti`

---

## 🏗 Key Features & Architecture

### 1. AI-Powered Predictions
Leverages the official **Google Generative AI SDK** to intelligently and humorously generate customized fortunes or predictions based on user inputs. The prompts are fine-tuned to deliver engaging, "mystical" responses.

### 2. Modern React 19 + Vite Setup
Built on the bleeding edge of React and Vite, ensuring lightning-fast Hot Module Replacement (HMR) during development and a highly optimized, minified bundle for production.

### 3. Interactive & Engaging UI
- Beautifully styled using the latest **Tailwind CSS**.
- Employs **Lucide React** for crisp, scalable SVG iconography.
- Integrates immersive video or audio elements via **React Player** and celebrates user interactions with **Canvas Confetti**.

### 4. Direct API Integration
Scripts like `debug_models.js` and `debug_single_call.js` are included in the repository to standalone test the Gemini API connections, ensuring seamless debugging without running the full React application overhead.

---

## ⚙️ Running Locally
To run this application locally:

1. Clone the repository to your machine.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. The application will be available at `http://localhost:5173`.

*Designed and Developed by [Shaked Liloz](https://github.com/shakedgoren)*
