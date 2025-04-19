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

// Token generation
function generateToken(channelName, uid, isPublisher) {
  const expirationInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationInSeconds;
  
  // Convert UID to number if it's a string
  const numericUid = typeof uid === 'string' ? parseInt(uid, 10) : uid;
  
  // Create token content
  const tokenContent = {
    appID: AGORA_APP_ID,
    appCertificate: AGORA_APP_CERTIFICATE,
    channelName: channelName,
    uid: numericUid,
    privilegeExpiredTs: privilegeExpiredTs
  };

  // Serialize content
  const content = JSON.stringify(tokenContent);
  
  // Generate signature
  const sign = crypto.createHmac('sha256', AGORA_APP_CERTIFICATE)
    .update(`${AGORA_APP_ID}${channelName}${numericUid}${privilegeExpiredTs}`)
    .digest('hex');
  
  // Combine components
  const token = `006${content}${sign}`;
  
  console.log(`Generated token for channel ${channelName}, UID ${numericUid}`);
  return token;
}

// Token endpoint
app.post('/token', async (req, res) => {
  try {
    const { channelName, uid, isPublisher = false, isAdmin = false } = req.body;
    
    if (!channelName || uid === undefined) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const token = generateToken(channelName, uid, isPublisher || isAdmin);
    
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
