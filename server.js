const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment variables
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// Validate required environment variables
if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Token generation with enhanced validation
function generateToken(channelName, uid, isPublisher, expireTimestamp) {
    const role = isPublisher ? 1 : 0; // 1=Publisher, 0=Subscriber
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      role,
      expireTimestamp || currentTimestamp + 3600 // Default 1 hour
    );
  
    // Validate token format
    if (!token.startsWith('006') || token.length < 32) {
      throw new Error('Invalid token generated');
    }
  
    return token;
  }
  
  app.post('/token', (req, res) => {
    try {
      const { channelName, uid, isPublisher = false, expireTimestamp } = req.body;
      
      if (!channelName || typeof uid === 'undefined') {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
  
      const token = generateToken(channelName, uid, isPublisher, expireTimestamp);
      
      res.json({ 
        token,
        uid: parseInt(uid, 10),
        expiresAt: expireTimestamp || Math.floor(Date.now() / 1000) + 3600
      });
    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    agoraAppId: AGORA_APP_ID ? 'configured' : 'missing',
    agoraCert: AGORA_APP_CERTIFICATE ? 'configured' : 'missing'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
  console.log(`Agora App ID: ${AGORA_APP_ID ? 'configured' : 'MISSING'}`);
});
