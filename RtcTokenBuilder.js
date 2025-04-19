// In your Node.js token server
const crypto = require('crypto');

const RtcTokenBuilder = {
    Role: {
        PUBLISHER: 1,
        SUBSCRIBER: 2
    },

    buildTokenWithUid: function(appId, appCertificate, channelName, uid, role, privilegeExpiredTs) {
        // Ensure all required parameters are present
        if (!appId || !appCertificate || !channelName || uid === undefined || !role) {
            throw new Error('Missing required parameters for token generation');
        }
        
        // Validate privilegeExpiredTs is in the future
        const currentTs = Math.floor(Date.now() / 1000);
        if (privilegeExpiredTs <= currentTs) {
            throw new Error('Token expiration must be in the future');
        }

        return this.buildTokenWithAccount(appId, appCertificate, channelName, uid.toString(), role, privilegeExpiredTs);
    },

    buildTokenWithAccount: function(appId, appCertificate, channelName, account, role, privilegeExpiredTs) {
        const token = new AccessToken2(appId, appCertificate, privilegeExpiredTs);
        
        // Always add join channel privilege
        token.addPrivilege(Privileges.kJoinChannel, privilegeExpiredTs);
        
        if (role === this.Role.PUBLISHER) {
            token.addPrivilege(Privileges.kPublishAudioStream, privilegeExpiredTs);
            token.addPrivilege(Privileges.kPublishVideoStream, privilegeExpiredTs);
            token.addPrivilege(Privileges.kPublishDataStream, privilegeExpiredTs);
        }
        
        return token.build();
    }
};
