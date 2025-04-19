const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = 3000;

app.use(express.json());

// Replace with your actual Agora credentials
const APP_ID = "bac6e0aa43af4ba6848e9f64801a2e2e";
const APP_CERTIFICATE = "7dbffef62a1842c386f526946d2a73aa";

app.post('/token', (req, res) => {
  const { channelName, uid, role = 1 } = req.body; // 1=publisher, 0=subscriber
  
  const expiration = 3600; // 1 hour expiration
  const currentTime = Math.floor(Date.now() / 1000);
  const expireTime = currentTime + expiration;

  const token = generateToken(channelName, uid, role, expireTime);
  
  res.json({ token, uid, expiresAt: expireTime });
});

function generateToken(channelName, uid, role, expireTime) {
  const key = `${APP_ID}${channelName}${uid}${role}${expireTime}`;
  const signature = crypto.createHmac('sha256', APP_CERTIFICATE)
                         .update(key)
                         .digest('hex');
  
  return `006${JSON.stringify({
    appID: APP_ID,
    channelName,
    uid,
    role,
    privilegeExpiredTs: expireTime
  })}${signature}`;
}

app.listen(PORT, () => console.log(`Token server running on port ${PORT}`));
