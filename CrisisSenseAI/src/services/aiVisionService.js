// Placeholder for your Google Gemini API Key
const GEMINI_API_KEY = 'AIzaSyA4sQKfuSlT5LsFRImaL2Feh2kjx2aVS0M';

/**
 * Analyzes an image using Google Gemini Vision model and returns structured emergency data.
 * @param {string} base64Image - The raw base64 string of the image
 * @returns {Promise<{incidentType: string, riskLevel: string, summary: string}>}
 */
export const analyzeIncidentImage = async (base64Image) => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { 
                text: `You are an emergency response AI. You analyze incident photos to determine the severity and nature of the emergency.
                Respond ONLY with a valid JSON object matching this exact structure:
                {
                  "incidentType": "medical" | "fire" | "accident",
                  "riskLevel": "low" | "medium" | "high" | "critical",
                  "summary": "A brief 2-sentence description of the crisis shown in the photo."
                }`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API request failed');
    }

    const aiResponse = data.candidates[0].content.parts[0].text.trim();
    // Safely parse JSON
    const parsedData = JSON.parse(aiResponse);

    return parsedData;

  } catch (error) {
    console.error('[AI Vision] Analysis Error:', error);
    return null;
  }
};
