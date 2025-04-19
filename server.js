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
function generateToken(channelName, uid, isPublisher) {
  // Increased expiration to 24 hours to account for clock skew
  const expirationInSeconds = 86400; 
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationInSeconds;
  
  // Ensure UID is numeric
  const numericUid = typeof uid === 'string' ? parseInt(uid, 10) : uid;
  if (isNaN(numericUid)) {
    throw new Error('Invalid UID format');
  }

  // Create token content
  const tokenContent = {
    appID: AGORA_APP_ID,
    appCertificate: AGORA_APP_CERTIFICATE,
    channelName: channelName,
    uid: numericUid,
    privilegeExpiredTs: privilegeExpiredTs
  };

  // Generate signature with additional validation
  const sign = crypto.createHmac('sha256', AGORA_APP_CERTIFICATE)
    .update(`${AGORA_APP_ID}${channelName}${numericUid}${privilegeExpiredTs}`)
    .digest('hex');
  
  if (!sign || sign.length !== 64) {
    throw new Error('Invalid signature generated');
  }

  const token = `006${JSON.stringify(tokenContent)}${sign}`;
  
  if (!token.startsWith('006')) {
    throw new Error('Token generation failed - invalid format');
  }

  console.log(`Generated token for channel ${channelName}, UID ${numericUid}, expires at ${new Date(privilegeExpiredTs * 1000)}`);
  return token;
}

// Token endpoint with enhanced error handling
app.post('/token', async (req, res) => {
  try {
    const { channelName, uid, isPublisher = false } = req.body;
    
    // Validate inputs
    if (!channelName || typeof channelName !== 'string') {
      return res.status(400).json({ error: 'Invalid channel name' });
    }
    
    if (uid === undefined || uid === null) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const token = generateToken(channelName, uid, isPublisher);
    
    res.json({ 
      token,
      uid: typeof uid === 'string' ? parseInt(uid, 10) : uid,
      expiresAt: Math.floor(Date.now() / 1000) + 86400
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error.message
    });
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
