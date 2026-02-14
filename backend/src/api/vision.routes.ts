import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { encodeImageToBase64, analyzeImage } from '../services/vision.service';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const prompt = req.body.prompt || 'What\'s in this image?';
    const imageBase64 = encodeImageToBase64(req.file.path);
    const analysis = await analyzeImage(imageBase64, prompt);

    // Clean up temp file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    res.json({ 
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vision route error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

export default router;