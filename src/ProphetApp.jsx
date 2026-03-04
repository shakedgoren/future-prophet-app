import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Wand2, RefreshCw, Download } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import confetti from 'canvas-confetti';

const GOOGLE_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

export default function ProphetApp() {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const audioRef = useRef(null);

  const [parent1, setParent1] = useState({ url: null, file: null });
  const [parent2, setParent2] = useState({ url: null, file: null });

  const [formData, setFormData] = useState({
    habit: '', job: '', location: '', kidsCount: '', pet: ''
  });

  useEffect(() => {
    if (loading) {
      // Confetti loop
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const interval = setInterval(function () {
        confetti({ ...defaults, particleCount: 30, origin: { x: Math.random(), y: Math.random() - 0.2 } });
      }, 300);

      // Play music
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => { });
      }

      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && prediction && audioRef.current) {
      let currentVolume = audioRef.current.volume;
      const fadeAudio = setInterval(() => {
        if (audioRef.current && currentVolume > 0.05) {
          currentVolume = Math.max(0, currentVolume - 0.05);
          audioRef.current.volume = currentVolume;
        } else {
          clearInterval(fadeAudio);
          if (audioRef.current) {
            audioRef.current.pause();
          }
        }
      }, 400); // 0.05 every 400ms = 8 seconds total fade out

      return () => clearInterval(fadeAudio);
    }
  }, [loading, prediction]);

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePredict = async () => {
    if (!parent1.file || !parent2.file) {
      alert("חובה להעלות שתי תמונות!");
      return;
    }

    setLoading(true);
    setPrediction(null);

    try {
      const [img1DataUrl, img2DataUrl] = await Promise.all([
        fileToDataUrl(parent1.file),
        fileToDataUrl(parent2.file),
      ]);

      const img1Base64 = img1DataUrl.split(',')[1];
      const img2Base64 = img2DataUrl.split(',')[1];

      const analysisModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      const analysisPrompt = `Return ONLY a JSON object. No markdown preamble or postscript.
      Inputs: Job: ${formData.job}, Location: ${formData.location}, Kids Count: ${formData.kidsCount}, Pet: ${formData.pet}, Habit: ${formData.habit}.
      
      Task: 
      1. Perform a "deep facial scan" of the two parent photos. Extract specific details for Parent 1 (Right) and Parent 2 (Left).
      2. Write a professional English-only "Master Prompt" for a photorealistic image generator. 
         The prompt MUST describe a COHESIVE FAMILY PORTRAIT. 
         - The parents MUST be EXACT photorealistic replicas of the people in the provided photos. 
         - RENDER EXACTLY AND PRECISELY the number of requested children. Determine the requested number of children from "${formData.kidsCount}".
         - Describe the children as having a realistic genetic mix of the two parents' features, and describe each individually.
         - Set the scene in a ${formData.location} reflecting a ${formData.job} lifestyle with a ${formData.pet}.
         - Use keywords: "highly detailed facial features", "consistent identity", "photorealistic", "8k resolution".
      3. Write a funny Hebrew prophecy about their future with exactly ${formData.kidsCount} kids.
      4. Extract the exact numeric integer value of how many children are requested based on "${formData.kidsCount}". If it is 0, return 0.
      Format: {"prophecy": "...", "image_prompt": "...", "numeric_kids_count": integer}`;

      const analysisResult = await analysisModel.generateContent([
        analysisPrompt,
        { inlineData: { data: img1Base64, mimeType: parent1.file.type } },
        { inlineData: { data: img2Base64, mimeType: parent2.file.type } },
      ]);

      const responseText = analysisResult.response.text();
      let data;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("נכשלנו בפענוח תשובת ה-AI.");
      }

      const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

      const generationPrompt = `
      ROLE: High-Fidelity Face Reconstruction Engine.
      TASK: Generate a photorealistic family portrait based on the prompt below.
      
      IDENTITY GROUND TRUTH (CRITICAL):
      - Image 1 is the Father.
      - Image 2 is the Mother.
      - RECONSTRUCT their faces with 100% visual fidelity from the reference images.
      
      ACCURACY:
      - THERE MUST BE EXACTLY 2 ADULTS and EXACTLY ${data.numeric_kids_count} CHILDREN.
      - THE TOTAL NUMBER OF PEOPLE IN THE IMAGE MUST BE EXACTLY THE SUM OF 2 ADULTS PLUS ${data.numeric_kids_count} CHILDREN.
      - RENDER EXACTLY ${data.numeric_kids_count} CHILDREN.
      - IT IS ABSOLUTELY CRITICAL THAT THERE ARE EXACTLY ${data.numeric_kids_count} CHILDREN VISIBLE. DO NOT GENERATE ${data.numeric_kids_count - 1} OR ${data.numeric_kids_count + 1} CHILDREN.
      - THE CHILDREN MUST BE DISTINCT INDIVIDUALS.
      
      SCENE PROMPT: ${data.image_prompt}
      
      STRICT VISUAL ADHERENCE AND MATHEMATICALLY EXACT CHILDREN COUNT (${data.numeric_kids_count}) IS MANDATORY.`;

      const imageResult = await imageModel.generateContent([
        generationPrompt,
        { inlineData: { data: img1Base64, mimeType: parent1.file.type } },
        { inlineData: { data: img2Base64, mimeType: parent2.file.type } },
      ]);

      const imagePart = imageResult.response.candidates[0].content.parts.find(p => p.inlineData);

      if (!imagePart) {
        throw new Error("ה-AI לא הצליח ליצור תמונה הפעם.");
      }

      const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

      setPrediction({
        text: data.prophecy,
        image: imageUrl
      });

    } catch (error) {
      console.error("Prediction error:", error);
      alert("שגיאה ביצירת הנבואה. נסו שוב בעוד דקה.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!prediction?.image) return;
    const link = document.createElement('a');
    link.href = prediction.image;
    link.download = 'future-family.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload1 = useCallback((url, file) => setParent1({ url, file }), []);
  const handleUpload2 = useCallback((url, file) => setParent2({ url, file }), []);

  return (
    <div className="min-h-screen bg-[#06060a] text-white p-4 md:p-8 flex flex-col items-center overflow-x-hidden font-['Varela_Round']" dir="rtl">
      <audio ref={audioRef} loop src="/bg-music.m4a" />

      <div className="text-center mb-10 mt-4 animate-float">
        <h1 className="text-5xl md:text-8xl font-black mb-4 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 bg-clip-text text-transparent glow-text drop-shadow-[0_0_30px_rgba(192,38,211,0.5)]">
          מגדת העתידות
        </h1>
        <p className="text-zinc-500 font-large tracking-[0.3em] uppercase text-md md:text-lg">בינה מלאכותית חוזה את העתיד</p>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <PhotoUpload id="p1" label="תמונת הורה 1" preview={parent1.url} onUpload={handleUpload1} />
            <PhotoUpload id="p2" label="תמונת הורה 2" preview={parent2.url} onUpload={handleUpload2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-2xl shadow-2xl ">
            {[
              { id: 'job', label: 'במה אתם עובדים?', color: 'text-fuchsia-400' },
              { id: 'location', label: 'איפה תרצו לגור?', color: 'text-sky-400' },
              { id: 'kidsCount', label: 'כמה ילדים תרצו?', color: 'text-purple-400' },
              { id: 'pet', label: 'חיית מחמד ?', color: 'text-emerald-400' }
            ].map(field => (
              <div key={field.id} className="text-right group">
                <label className={`text-lg font-black uppercase ${field.color}/40 mb-2 block px-3 tracking-widest transition-colors group-focus-within:text-white`}>{field.label}</label>
                <div className="relative input-glow rounded-[22px] overflow-hidden">
                  <input
                    type="text"
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full h-[64px] bg-white/5 border border-white/10 rounded-[22px] px-6 outline-none text-xl text-right text-white/60 placeholder-fade shadow-inner"
                  />
                </div>
              </div>
            ))}
            <div className="col-span-full text-right group">
              <label className="text-lg font-black uppercase text-amber-400/40 mb-2 block px-3 tracking-widest transition-colors group-focus-within:text-white">כוח העל הסודי המשפחתי שלנו?</label>
              <div className="relative input-glow rounded-[22px] overflow-hidden">
                <input
                  type="text"
                  onChange={(e) => setFormData(prev => ({ ...prev, habit: e.target.value }))}
                  className="w-full h-[64px] bg-white/5 border border-white/10 rounded-[22px] px-6 outline-none text-xl text-right text-white/60 placeholder-fade shadow-inner"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading || !parent1.file || !parent2.file}
            className="w-full py-6 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 rounded-[35px] font-black text-2xl hover:scale-[1.03] active:scale-[0.97] transition-all shadow-[0_0_50px_rgba(192,38,211,0.3)] disabled:opacity-20 flex items-center justify-center gap-4 group"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Sparkles className="fill-current group-hover:animate-pulse" />}
            {loading ? "קוראת בכוכבים..." : "גלה את העתיד"}
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[60px] p-6 md:p-10 backdrop-blur-3xl flex flex-col items-center justify-center min-h-[650px] relative overflow-hidden shadow-2xl glow-card">
          {!prediction && !loading && (
            <div className="text-center text-zinc-600">
              <div className="w-28 h-28 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Wand2 size={48} className="opacity-20" />
              </div>
              <p className="text-xl font-medium italic opacity-60">העלו תמונות והנבואה תופיע כאן</p>
            </div>
          )}

          {loading && (
            <div className="text-center">
              <div className="w-32 h-32 border-[6px] border-t-fuchsia-500 border-white/5 rounded-full animate-spin mx-auto mb-10 shadow-[0_0_30px_rgba(217,70,239,0.2)]"></div>
              <p className="text-fuchsia-400 animate-pulse font-black text-2xl tracking-widest uppercase">מגבשת גורלות...</p>
            </div>
          )}

          {prediction && (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-1000">
              <div className="relative group w-full max-w-[500px] aspect-square rounded-[50px] mb-10 border-8 border-white/5 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <img src={prediction.image} alt="העתיד שלכם" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <button
                  onClick={downloadImage}
                  className="absolute bottom-6 left-6 bg-white/20 hover:bg-white/30 backdrop-blur-md p-4 rounded-full transition-all hover:scale-110 border border-white/20 shadow-xl"
                  title="הורד תמונה"
                >
                  <Download size={24} />
                </button>
              </div>
              <div className="w-full space-y-4">
                <p className="text-2xl md:text-3xl font-bold leading-relaxed italic text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 text-center">
                  "<TypewriterText text={prediction.text} delay={40} />"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TypewriterText = ({ text, delay = 50 }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}</span>;
};

const PhotoUpload = React.memo(({ label, onUpload, id, preview }) => {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpload(url, file);
    }
  };

  return (
    <div className="relative text-center">
      <label
        htmlFor={id}
        className={`aspect-square rounded-[40px] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center overflow-hidden cursor-pointer ${preview ? 'border-fuchsia-500/50 bg-fuchsia-500/5 shadow-lg shadow-fuchsia-500/10' : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'}`}
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <>
            <div className="mb-3">
              <i className="bi bi-camera-fill text-5xl text-purple-500"></i>
            </div>
            <span className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">{label}</span>
          </>
        )}
      </label>
      <input id={id} type="file" onChange={handleChange} accept="image/*" className="hidden" />
    </div>
  );
});