const express = require('express');
const RtcTokenBuilder = require('./RtcTokenBuilder').RtcTokenBuilder;
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Token endpoint
app.post('/token', async (req, res) => {
  try {
    const { channelName, uid, role = 'subscriber', isAdmin = false } = req.body;
    
    if (!channelName || uid === undefined) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const expirationInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationInSeconds;
    
    const agoraRole = (role === 'publisher' || isAdmin) ? 
      RtcTokenBuilder.Role.PUBLISHER : 
      RtcTokenBuilder.Role.ATTENDEE;

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

// Start server
app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
});
