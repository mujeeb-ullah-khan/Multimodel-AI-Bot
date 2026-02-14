import { Router } from 'express';
import { generateGroqResponse } from '../services/groq.service'; // ← change this

const router = Router();

router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const reply = await generateGroqResponse(message); // ← use Groq
    res.json({ 
      reply,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process your message' });
  }
});

export default router;