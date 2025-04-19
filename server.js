// server.js - Updated token generation
const RtcTokenBuilder = require('./RtcTokenBuilder').RtcTokenBuilder;

function generateToken(channelName, uid, role, isAdmin) {
  const expirationInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationInSeconds;
  
  // Determine role based on parameters
  const agoraRole = (role === 'publisher' || isAdmin) ? 
    RtcTokenBuilder.Role.PUBLISHER : 
    RtcTokenBuilder.Role.ATTENDEE;

  // Generate token using Agora's recommended method
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    agoraRole,
    privilegeExpiredTs
  );

  return token;
}
