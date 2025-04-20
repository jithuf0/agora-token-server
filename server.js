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

// Define token builder roles
const Role = {
  PUBLISHER: 1,
  SUBSCRIBER: 2
};

// Token generation function
function buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + 3600;
  // Version 006 tokens
  const tokenVersion = "006";
  
  // Create message content
  const tokenContent = {
    appID: appId,
    appCertificate: appCertificate,
    channelName: channelName,
    uid: parseInt(uid),
    
    privilegeExpiredTs: privilegeExpiredTs
  };

  // Serialize content
  const content = JSON.stringify(tokenContent);
  
  // Generate signature
  const sign = crypto.createHmac('sha256', appCertificate)
    .update(`${appId}${channelName}${uid}${privilegeExpiredTs}`)
    .digest('hex');
  
  // Combine components
  return `${tokenVersion}${content}${sign}`;
}

// Token endpoint with enhanced error handling
app.post('/token', async (req, res) => {
  try {
    const { channelName, uid, isPublisher } = req.body;
    
    // Validate inputs
    if (!channelName || !uid) {
      return res.status(400).json({ error: 'Missing channelName or uid' });
    }

    // Convert UID to number and validate
    const numericUid = parseInt(uid, 10);
    if (isNaN(numericUid)) {
      return res.status(400).json({ error: 'Invalid UID format' });
    }

    // Set token expiration (24 hours)
    const expirationInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationInSeconds;

    // Generate token with proper role
    const role = isPublisher ? Role.PUBLISHER : Role.SUBSCRIBER;
    const token = buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      numericUid,
      role,
      privilegeExpiredTs
    );

    console.log(`Generated token for channel ${channelName}, UID ${numericUid}, expires at ${new Date(privilegeExpiredTs * 1000)}`);
    
    res.json({ 
      token,
      uid: numericUid,
      expiresAt: privilegeExpiredTs
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
