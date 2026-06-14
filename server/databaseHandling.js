
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
service: 'gmail',
auth: {
    user: 'baklafy@gmail.com',
    pass: process.env.MAIL_PASS,
}
});

/*
let plainPassword = "verysafepassword";
let saltRounds = 10;

async function test(){

    console.log("please hash");

    try {
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        console.log("Secure Hash:", hashedPassword);
        return hashedPassword;
    } catch (error) {
        console.error("Error hashing password:", error);
    }
}

test();
*/


class databaseHandler{

    constructor(clientReference){

        this.localTokens = {};
        this.database = clientReference.db("public");
        this.usersCollection = this.database.collection("users");
        this.playlistCollection = this.database.collection("playlists");

        this.verificationCodes = {};

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

    //creating accounts stuff

    verifyUsername(givenUsername){

        givenUsername = String(givenUsername);
        const existingUsername = await this.usersCollection.findOne({username: givenUsername});

        if (existingUsername){

            return{
                success: false,
                message: "Username already in use"
            }

        }

        else if (givenUsername.length <= 0){

            return {

                success: false,
                message: "Username too short"

            }

        }

        else if (givenUsername.length >= 13){

            return {

                success: false,
                message: "Username too long"

            }

        }

        else if (givenUsername.includes(" ")){

            return {

                success: false,
                message: "Username includes spaces"

            }

        }

        return {

            success: true,
            message: "Valid username"

        }

    }

    verifyPassword(givenPassword){

        givenPassword = String(givenPassword);
        if (givenPassword.length <= 4){

            return {
                success: false,
                message: "Username too short"
            }

        }

        return {
            success: true,
            message: "Valid password"
        }

    }

    verifyEmail(givenEmail){

        const existingEmail = await this.usersCollection.findOne({email: givenEmail});

        if (existingEmail){

            return{
                success: false,
                message: "Email already in use"
            }

        }

        const verificationCodeSuccess = createAccountVerificationCode(givenEmail);

        return verificationCodeSuccess;
        
    }

    createAccountVerificationCode(givenEmail){

        try{

            let mailOptions = {

                from: 'baklafy@gmail.com',
                to: givenEmail,
                subject: 'Verify your baklafy account',
                html: `<p>Your verification code: <strong>${verificationCode}</strong></p>
                <p>This code will expire around the next 1 hour. <br> <strong>Do not share this code with anyone else.</strong></p>`

            };

        }
        catch(error){

            return{
                success: false,
                message: "Invalid email format"
            }

        }

    }

}

function wait(waitTime){

    return new Promise(resolve => setTimeout(resolve, waitTime))

}


module.exports = {
    databaseHandler
}