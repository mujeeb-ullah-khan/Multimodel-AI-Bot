import Groq from 'groq-sdk';
import fs from 'fs';

// Ensure the API key is provided via environment
if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not set');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Encode image file to base64
export const encodeImageToBase64 = (filePath: string): string => {
  const imageFile = fs.readFileSync(filePath);
  return imageFile.toString('base64');
};

// Analyze image with text prompt
export const analyzeImage = async (
  imageBase64: string,
  prompt: string = "What's in this image?"
): Promise<string> => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || 'No analysis generated.';
  } catch (error) {
    console.error('❌ Vision API Error:', error);
    throw new Error('Failed to analyze image');
  }
};