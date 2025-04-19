const express = require('express');
const { RtcTokenBuilder } = require('./RtcTokenBuilder');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware and other setup remains the same...

// Token endpoint
app.post('/token', async (req, res) => {
  try {
    const { channelName, uid, role = 'subscriber', isAdmin = false } = req.body;
    
    if (!channelName || uid === undefined) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const expirationInSeconds = 3600;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expirationInSeconds;
    
    const agoraRole = (role === 'publisher' || isAdmin) ? 
      RtcTokenBuilder.Role.PUBLISHER : 
      RtcTokenBuilder.Role.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Rest of your server code...

// Start server
app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
});
