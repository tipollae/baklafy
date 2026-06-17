
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');

const characters = [
"A","B","C","D","E","F",
"G","H","I","J","K","L",
"M","N","O","P","Q","R",
"S","T","U","V","W","X",
"Y","Z","1","2","3","4",
"5","6","7","8","9","0",
]

const transporter = nodemailer.createTransport({
service: 'gmail',
auth: {
    user: 'baklafy@gmail.com',
    pass: process.env.MAIL_PASS,
}
});


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

    async verifyUsername(givenUsername){

        if (typeof givenUsername !== "string") {
            return { 
                success: false, 
                message: "Invalid username" 
            };
        }

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
            message: ""

        }

    }

    verifyPassword(givenPassword){

        if (typeof givenPassword !== "string") {
            return { 
                success: false, 
                message: "Invalid password" 
            };
        }

        givenPassword = String(givenPassword);

        if (givenPassword.length <= 4){
            return {
                success: false,
                message: "Password too short"
            }
        }

        return {
            success: true,
            message: ""
        }

    }

    async verifyEmail(givenEmail){

        const existingEmail = await this.usersCollection.findOne({email: givenEmail});

        if (existingEmail){
            return{
                success: false,
                message: "Email already in use"
            }
        }

        return{
            success: true,
            message: ""
        }
        
    }

    async addToVerificationProcess(givenEmail, givenUsername, givenPassword){

        if (typeof givenEmail !== "string") {
            return { 
                success: false, 
                message: "Invalid email" 
            };
        }

        givenEmail = String(givenEmail);
        givenUsername = String(givenUsername);
        givenPassword = String(givenPassword);
        const hashedPassword = await this.hashString(givenPassword, 12); //password string, saltRounds
        if (!hashedPassword){
            return{
                success: false,
                message: "An error occured, please try again"
            }
        }

        const existingEmail = await this.verifyEmail(givenEmail);
        if (!existingEmail.success){
            return existingEmail;
        }
        console.log(`given email: ${givenEmail}`)

        let formedVerificationCode;
        do{
            const LENGTH = 6;
            formedVerificationCode = "";

            for (let i = 0; i < LENGTH; i++){
                const character = characters[Math.floor(Math.random()*characters.length)];
                formedVerificationCode += character;
            }
        }while(this.verificationCodes[formedVerificationCode]);

        for (let code in this.verificationCodes){
            if (this.verificationCodes[code].email == givenEmail){
                delete this.verificationCodes[code];
            }
        }

        this.verificationCodes[formedVerificationCode] = {
            username: givenUsername,
            password: hashedPassword,
            email: givenEmail,
            dateCreated: Date.now(),
        }
        console.log(this.verificationCodes[formedVerificationCode])

        try{
            let mailOptions = {
                from: 'baklafy@gmail.com',
                to: givenEmail,
                subject: 'Verify your baklafy account',
                html: `
                <p>Your verification code: <strong>${formedVerificationCode}</strong></p>
                <p>This code will expire around the next 30 minutes. <br> <strong>Do not share this code with anyone else.</strong></p>
                `
            };

            const info = await transporter.sendMail(mailOptions);

            return{
                success: true,
                message: ""
            }
        }
        catch(error){
            return{
                success: false,
                message: "Invalid email format"
            }
        }
    }

    async hashString(givenString, saltRounds){

        try {
            const hashedPassword = await bcrypt.hash(givenString, saltRounds);
            console.log("Secure Hash:", hashedPassword);
            return hashedPassword;
        } catch (error) {
            console.error("Error hashing password:", error);
            return false;
        }

    }

    //loop functions
    async clearExpiredTokensLoop(intervalTime){

        const hours = 0.00833333; //roughly 30 secs, made it short just for testing
        const expiryTime = hours * 3600000; // converting hours to miliseconds
        const currentTime = Date.now();

        for (let tokenID in this.localTokens){
            if (!this.localTokens[tokenID].lastLoggedIn) continue;
            if (currentTime - this.localTokens[tokenID].lastLoggedIn >= expiryTime) {
                delete this.localTokens[tokenID];
            }
        }

        await wait(intervalTime);
        this.clearExpiredTokensLoop(intervalTime);

    }

    async verificationCodesLoop(intervalTime){

        const hours = 0.5;
        const expiryTime = hours * 3600000; // converting hours to miliseconds
        const currentTime = Date.now();

        for (let code in this.verificationCodes){
            if (currentTime - this.verificationCodes[code].dateCreated >= expiryTime){
                delete this.verificationCodes[code]
            }
        }

        await wait(intervalTime)
        this.verificationCodesLoop(intervalTime);

        console.log('verification codes loop');
        console.log(this.verificationCodes);

    }

}

function wait(waitTime){

    return new Promise(resolve => setTimeout(resolve, waitTime))

}


module.exports = {
    databaseHandler
}