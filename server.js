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

// Token generator function
function generateToken(channelName, uid, role, privilegeExpiredTs) {
  // Version 006 tokens
  const tokenVersion = "006";
  
  // Create token content
  const tokenContent = {
    appID: AGORA_APP_ID,
    appCertificate: AGORA_APP_CERTIFICATE,
    channelName: channelName,
    uid: uid.toString(),
    role: role,
    privilegeExpiredTs: privilegeExpiredTs
  };

  // Serialize content
  const content = JSON.stringify(tokenContent);
  
  // Generate signature
  const sign = crypto.createHmac('sha256', AGORA_APP_CERTIFICATE)
    .update(`${AGORA_APP_ID}${channelName}${uid}${privilegeExpiredTs}`)
    .digest('hex');
  
  // Combine components
  return `${tokenVersion}${content}${sign}`;
}

// Token endpoint
app.post('/token', async (req, res) => {
  try {
    const { channelName, uid, isPublisher = false } = req.body;
    
    // Validate inputs
    if (!channelName || typeof uid === 'undefined') {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Calculate expiration (24 hours from now)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + 86400; // 24 hours
    
    // Role: 1 for publisher, 0 for subscriber
    const role = isPublisher ? 1 : 0;

    const token = generateToken(
      channelName, 
      uid, 
      role, 
      privilegeExpiredTs
    );

    // Validate token format
    if (!token.startsWith('006') || token.length < 32) {
      throw new Error('Invalid token format generated');
    }

    res.json({ 
      token,
      uid: parseInt(uid, 10),
      expiresAt: privilegeExpiredTs
    });

    console.log(`Generated token for channel ${channelName}, UID ${uid}, expires at ${new Date(privilegeExpiredTs * 1000)}`);
    
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
