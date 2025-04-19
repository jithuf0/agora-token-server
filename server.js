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
  console.error('Missing required environment variables: AGORA_APP_ID and AGORA_APP_CERTIFICATE');
  process.exit(1);
}

// Generate Agora token
function generateToken(channelName, uid, role, isAdmin) {
  const expirationInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationInSeconds;
  
  // Determine if user is publisher (streamer or admin)
  const isPublisher = role === 'publisher' || isAdmin;

  // Generate signature
  const message = `${AGORA_APP_ID}:${channelName}:${uid}:${privilegeExpiredTs}`;
  const key = AGORA_APP_CERTIFICATE;
  const signature = crypto.createHmac('sha256', key).update(message).digest('hex');

  // Build token string
  return `${AGORA_APP_ID}:${uid}:${privilegeExpiredTs}:${signature}:${isPublisher ? 1 : 0}`;
}

// Token endpoint
app.post('/token', async (req, res) => {
  try {
    const { channelName, uid, role = 'subscriber', isAdmin = false } = req.body;
    
    // Validate required parameters
    if (!channelName || !uid) {
      return res.status(400).json({ 
        error: 'channelName and uid are required' 
      });
    }

    // Generate token
    const token = generateToken(channelName, uid, role, isAdmin);
    
    res.json({ token });
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
  res.status(200).json({ status: 'healthy' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Agora Token Server running on port ${PORT}`);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});