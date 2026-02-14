import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not set');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const generateGroqResponse = async (prompt: string): Promise<string> => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024
    });
    return completion.choices[0]?.message?.content || 'No response generated.';
  } catch (error) {
    console.error('❌ Groq API Error:', error);
    throw new Error('Failed to generate AI response');
  }
};