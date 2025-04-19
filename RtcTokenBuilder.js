const crypto = require('crypto');

const RtcTokenBuilder = {
    Role: {
        ATTENDEE: 0,
        PUBLISHER: 1,
        ADMIN: 2
    },

    buildTokenWithUid: function(appID, appCertificate, channelName, uid, role, privilegeExpiredTs) {
        return this.buildTokenWithAccount(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
    },

    buildTokenWithAccount: function(appID, appCertificate, channelName, account, role, privilegeExpiredTs) {
        const token = this.createToken(appID, appCertificate, channelName, account, role, privilegeExpiredTs);
        return token;
    },

    createToken: function(appID, appCertificate, channelName, uid, role, privilegeExpiredTs) {
        // Version 006 tokens
        const tokenVersion = "006";
        const expiredTs = privilegeExpiredTs || 0;
        
        // Create message content - FIXED: Use the actual role parameter, not the uid
        const tokenContent = {
            appID: appID,
            appCertificate: appCertificate,
            channelName: channelName,
            uid: uid.toString(),
            role: role,  // Use the role parameter directly
            privilegeExpiredTs: expiredTs
        };

        // Serialize content
        const content = JSON.stringify(tokenContent, null, 0);
        
        // Generate signature
        const sign = this.hmacsha256(appID, appCertificate, channelName, uid.toString(), expiredTs);
        
        // Combine components
        return `${tokenVersion}${content}${sign}`;
    },

    hmacsha256: function(appID, appCertificate, channelName, uid, expiredTs) {
        // Create HMAC-SHA256 signature
        const key = appCertificate;
        const message = `${appID}${channelName}${uid}${expiredTs}`;
        const sign = crypto.createHmac('sha256', key).update(message).digest('hex');
        return sign;
    }
};

module.exports.RtcTokenBuilder = RtcTokenBuilder;
