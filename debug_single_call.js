import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_API_KEY = "AIzaSyDYBaQGOcspVCImvBb7l76MNd6xovrOIEg";
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function testSingleCall() {
    try {
        const modelName = "gemini-2.5-flash-image";
        console.log(`Testing single-call generation (JSON + Image) with ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Using a tiny placeholder for a reference image
        const facePlaceholder = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

        const prompt = `
      Reference Identity: [The first image provided is the Father, the second is the Mother].
      Task:
      1. Analyze the faces in the two images.
      2. Return a JSON object with a Hebrew prophecy: {"prophecy": "..."}.
      3. Generate a family portrait image where the parents MUST be identical to the provided images. 
         Directly return the generated image in the response parts.
    `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: facePlaceholder, mimeType: "image/gif" } },
            { inlineData: { data: facePlaceholder, mimeType: "image/gif" } }
        ]);
        const response = await result.response;

        console.log("Number of parts in response:", response.candidates[0].content.parts.length);

        response.candidates[0].content.parts.forEach((part, i) => {
            if (part.text) {
                console.log(`Part ${i} (Text):`, part.text.substring(0, 100));
            } else if (part.inlineData) {
                console.log(`Part ${i} (Image):`, part.inlineData.mimeType, "Length:", part.inlineData.data.length);
            }
        });

    } catch (error) {
        console.error("Single call error:", error);
    }
}

testSingleCall();
