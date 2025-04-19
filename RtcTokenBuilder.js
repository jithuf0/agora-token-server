const crypto = require('crypto');
const msgpack = require('msgpack-lite');

const RtcTokenBuilder = {
    Role: {
        PUBLISHER: 1,
        SUBSCRIBER: 2
    },

    buildTokenWithUid: function(appId, appCertificate, channelName, uid, role, privilegeExpiredTs) {
        return this.buildTokenWithAccount(appId, appCertificate, channelName, uid.toString(), role, privilegeExpiredTs);
    },

    buildTokenWithAccount: function(appId, appCertificate, channelName, account, role, privilegeExpiredTs) {
        const token = new AccessToken2(appId, appCertificate, privilegeExpiredTs);
        token.addPrivilege(Privileges.kJoinChannel, privilegeExpiredTs);
        
        if (role === this.Role.PUBLISHER) {
            token.addPrivilege(Privileges.kPublishAudioStream, privilegeExpiredTs);
            token.addPrivilege(Privileges.kPublishVideoStream, privilegeExpiredTs);
            token.addPrivilege(Privileges.kPublishDataStream, privilegeExpiredTs);
        }
        
        return token.build();
    }
};

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
        return crypto.createHmac('sha256', this.appCertificate).update(content).digest('hex');
    }

    getContent() {
        const data = {
            signature: crypto.createHmac('sha256', this.appCertificate).update(this.appId).digest('hex'),
            salt: this.salt,
            ts: this.issueTs,
            services: this.services
        };
        return Buffer.from(msgpack.encode(data)).toString('base64');
    }
}

const Privileges = {
    kJoinChannel: 1,
    kPublishAudioStream: 2,
    kPublishVideoStream: 3,
    kPublishDataStream: 4
};

module.exports = { RtcTokenBuilder };
