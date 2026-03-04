import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const GOOGLE_API_KEY = "AIzaSyDYBaQGOcspVCImvBb7l76MNd6xovrOIEg";
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function testMultimodalGen() {
    try {
        const modelName = "gemini-2.5-flash-image";
        console.log(`Testing multimodal generation with ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Simulating parent photos (placeholder or actual if I had them, but I'll use a prompt first)
        // In a real test, I'd use a base64 of a face.
        const prompt = "Generate a portrait of this person. Return the image directly.";

        // Testing if sending a part with text + a part with inlineData (image) works for generation
        const result = await model.generateContent([
            prompt,
            // Sending a generic small base64 pixel as a test for the "parts" interface
            { inlineData: { data: "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", mimeType: "image/gif" } }
        ]);
        const response = await result.response;

        const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (imagePart) {
            console.log("✅ Multimodal generation SUCCESS!");
            console.log("MimeType:", imagePart.inlineData.mimeType);
        } else {
            console.log("❌ No image generated. Text response:", response.text());
        }
    } catch (error) {
        console.error("Multimodal gen error:", error);
    }
}

testMultimodalGen();
