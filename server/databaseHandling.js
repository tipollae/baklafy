
const crypto = require("crypto");

class databaseHandler{

    constructor(clientReference){

        this.localTokens = {};
        this.database = clientReference.db("public");
        this.usersCollection = this.database.collection("users");
        this.playlistCollection = this.database.collection("playlists");

    }

    async checkExistingAccount(givenAccountID){

        const foundTokenID = this.searchAttributeInTokens("accountID", givenAccountID);

        if (foundTokenID){
            return {
                existingLocalUser: true,
                existingDatabaseUser: true
            };
        }

        const existingDatabaseUser = await this.usersCollection.findOne({
            accountID: givenAccountID
        });

        return {
            existingLocalUser: false,
            existingDatabaseUser: !!existingDatabaseUser
        };
    }

    createToken(givenAccountID){

        var generatedTokenID;

        do generatedTokenID = crypto.randomBytes(32).toString("base64url");
        while (this.localTokens[generatedTokenID]);

        this.localTokens[generatedTokenID] = {

            accountID: givenAccountID,
            lastLoggedIn: null,
            sockets: []

        }

        return generatedTokenID;

    }

    async clearExpiredTokensLoop(intervalTime){

        const hours = 0.00833333; //roughly 30 secs, made it short just for testing
        const expiryTime = hours * 3600000; // converting hours to miliseconds
        const currentTime = Date.now();

        for (let tokenID in this.localTokens){

            if (!this.localTokens[tokenID].lastLoggedIn) continue;
            if (currentTime - this.localTokens[tokenID].lastLoggedIn >= expiryTime) delete this.localTokens[tokenID];

        }

        console.log("expired tokens loop");
        console.log(this.localTokens);

        await wait(intervalTime);

        this.clearExpiredTokensLoop(intervalTime);

    }

    searchAttributeInTokens(givenAttribute, target){

        const foundTokenID = Object.keys(this.localTokens).find(tokenID =>
            this.localTokens[tokenID][givenAttribute] == target
        )

        return foundTokenID;

    }

    changeTokenAttribute(givenTokenID, givenAttribute, givenValue){

        if (!this.localTokens[givenTokenID]){
            console.error("Err: Invalid token ID");
            return;
        }

        const existingAttribute = Object.hasOwn(this.localTokens[givenTokenID], givenAttribute);

        if (existingAttribute){

            this.localTokens[givenTokenID][givenAttribute] = givenValue;

        }

        else{

            console.trace("Err: Invalid attribute");

        }

    }

    handleDisconnectedSocket(socket){

        if (!socket.data.token) return;
        if (!this.localTokens[socket.data.token]) return;

        const tokenSockets = this.localTokens[socket.data.token].sockets;
        const foundSocketIndex = tokenSockets.indexOf(socket.id);

        if (foundSocketIndex === -1) return;

        tokenSockets.splice(foundSocketIndex, 1);

        if (tokenSockets.length === 0){

            this.changeTokenAttribute(socket.data.token, "lastLoggedIn", Date.now());
            console.log("This token is on track for expiry");

        }

    }

    addSocketToToken(socket){

        if (!socket.data.token) return;
        if (!this.localTokens[socket.data.token]) return;
        
        let sockets = this.localTokens[socket.data.token].sockets;

        if (sockets.includes(socket.id)) return;

        sockets.push(socket.id);

    }

    async extractPlaylistIDS(){



    }

    async extractPlaylistData(givenAccountID) {


    }

}

function wait (waitTime){

    return new Promise(resolve => setTimeout(resolve, waitTime))

}


module.exports = {
    databaseHandler
}