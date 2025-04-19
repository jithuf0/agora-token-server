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

// Generate Agora token
// Update your token generation function
function generateToken(channelName, uid, role, isAdmin) {
    const appID = AGORA_APP_ID;
    const appCertificate = AGORA_APP_CERTIFICATE;
    const expirationInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationInSeconds;
  
    // Convert UID to number if it's a string
    const numericUid = typeof uid === 'string' ? parseInt(uid, 10) : uid;
    
    // Important: Use proper role values
    const agoraRole = (role === 'publisher' || isAdmin) ? 
      RtcTokenBuilder.Role.PUBLISHER : 
      RtcTokenBuilder.Role.SUBSCRIBER;
  
    // Generate token with proper parameters
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      numericUid,
      agoraRole,
      privilegeExpiredTs
    );
  
    console.log('Generated token for channel:', channelName, 'UID:', numericUid, 'Role:', agoraRole);
    return token;
  }

// Token endpoint
app.post('/token', async (req, res) => {
  try {
    const { channelName, uid, role = 'subscriber', isAdmin = false } = req.body;
    
    if (!channelName || uid === undefined) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const token = generateToken(channelName, uid, role, isAdmin);
    
    // Verify token starts with 006 before sending
    if (!token.startsWith('006')) {
      throw new Error('Token generation failed - invalid format');
    }
    
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
