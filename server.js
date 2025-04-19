// In your Node.js token server (server.js)
const express = require('express');
const { RtcTokenBuilder } = require('./RtcTokenBuilder');
const app = express();
const PORT = process.env.PORT || 3000;

// Add proper middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Token endpoint with better error handling
app.post('/token', async (req, res) => {
  try {
    console.log('Token request received:', req.body);
    
    const { channelName, uid, role = 'subscriber', isAdmin = false } = req.body;
    
    if (!channelName || uid === undefined) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        required: ['channelName', 'uid'],
        received: req.body
      });
    }

    const expirationInSeconds = 3600;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expirationInSeconds;
    
    const agoraRole = (role === 'publisher' || isAdmin) ? 
      RtcTokenBuilder.Role.PUBLISHER : 
      RtcTokenBuilder.Role.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    );
    
    console.log('Token generated successfully for channel:', channelName);
    res.json({ token });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
  console.log(`AGORA_APP_ID: ${process.env.AGORA_APP_ID ? 'set' : 'not set'}`);
});
