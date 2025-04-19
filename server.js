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
function generateToken(channelName, uid, role, isAdmin) {
  const expirationInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationInSeconds;
  
  // Convert UID to number if it's a string
  const numericUid = typeof uid === 'string' ? parseInt(uid) : uid;
  const stringUid = numericUid.toString();
  
  // Determine role
  const agoraRole = (role === 'publisher' || isAdmin) ? 
    RtcTokenBuilder.Role.PUBLISHER : 
    RtcTokenBuilder.Role.ATTENDEE;
    if (typeof agoraRole !== 'number') {
        throw new Error('Invalid role specified for token generation');
    }

  // Generate token
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    stringUid, 
    numericUid,
    agoraRole,
    privilegeExpiredTs
  );
  console.log('Generating token with role:', agoraRole);
console.log('Token content before signing:', {
  appID: AGORA_APP_ID,
  channel: channelName,
  uid: stringUid,
  role: agoraRole,
  expires: new Date(privilegeExpiredTs * 1000).toISOString()
});
  console.log('Token generated with:', {
    appId: AGORA_APP_ID,
    certificate: AGORA_APP_CERTIFICATE?.substring(0, 6) + '...',
    channel: channelName,
    uid: stringUid,
    role: agoraRole,
    expires: new Date(privilegeExpiredTs * 1000).toISOString()
  });
  console.log('Token content:', tokenContent);
console.log('Full token:', token);

  console.log('Generated token:', token.substring(0, 50) + '...'); // Log first part of token
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
