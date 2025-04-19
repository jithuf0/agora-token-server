const RtcTokenBuilder = {
    Role: {
        PUBLISHER: 1,
        SUBSCRIBER: 2
    },

    buildTokenWithUid: function(appId, appCertificate, channelName, uid, role, privilegeExpiredTs) {
        const token = this.buildTokenWithAccount(appId, appCertificate, channelName, uid.toString(), role, privilegeExpiredTs);
        return token;
    },

    buildTokenWithAccount: function(appId, appCertificate, channelName, account, role, privilegeExpiredTs) {
        const token = new AccessToken2(appId, appCertificate, 3600);
        token.addPrivilege(Privileges.kJoinChannel, privilegeExpiredTs);
        
        if (role === this.Role.PUBLISHER) {
            token.addPrivilege(Privileges.kPublishAudioStream, privilegeExpiredTs);
            token.addPrivilege(Privileges.kPublishVideoStream, privilegeExpiredTs);
            token.addPrivilege(Privileges.kPublishDataStream, privilegeExpiredTs);
        }
        
        return token.build();
    }
};

// Add these helper classes
class AccessToken2 {
    constructor(appId, appCertificate, expire) {
        this.appId = appId;
        this.appCertificate = appCertificate;
        this.expire = expire;
        this.issueTs = Math.floor(Date.now() / 1000);
        this.salt = Math.floor(Math.random() * 99999999);
        this.services = {};
    }

    addPrivilege(privilege, expireTs) {
        this.services[privilege] = expireTs;
    }

    build() {
        const signing = this.getSign();
        const content = this.getContent();
        return `${this.appId}:${content}:${signing}`;
    }

    getSign() {
        const content = this.getContent();
        return this.hmacsha256(this.appCertificate, content);
    }

    getContent() {
        const m = MessagePack.pack({
            signature: this.hmacsha256(this.appCertificate, this.appId),
            salt: this.salt,
            ts: this.issueTs,
            services: this.services
        });
        return Buffer.from(m).toString('base64');
    }

    hmacsha256(key, str) {
        return crypto.createHmac('sha256', key).update(str).digest('hex');
    }
}

const Privileges = {
    kJoinChannel: 1,
    kPublishAudioStream: 2,
    kPublishVideoStream: 3,
    kPublishDataStream: 4
};
