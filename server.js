// server.js - Updated token generation
const RtcTokenBuilder = require('./RtcTokenBuilder').RtcTokenBuilder;

// In server.js, update the generateToken function
function generateToken(channelName, uid, role, isAdmin) {
    const expirationInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationInSeconds;
    
    // Convert string UID to number if needed
    const numericUid = typeof uid === 'string' ? parseInt(uid) : uid;
    
    // Determine role (1 for publisher, 0 for subscriber)
    const agoraRole = (role === 'publisher' || isAdmin) ? 
      RtcTokenBuilder.Role.PUBLISHER : 
      RtcTokenBuilder.Role.ATTENDEE;
  
    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      numericUid,
      agoraRole,
      privilegeExpiredTs
    );
  
    console.log('Generated token for:', {
      channelName,
      uid: numericUid,
      role: agoraRole,
      privilegeExpiredTs
    });
  
    return token;
  }
