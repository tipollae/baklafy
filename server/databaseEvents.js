
function databaseEventsHandler(socket, serverDataHandler){

    socket.on("check-existing-account", async (givenAccountID)=>{

        if (!serverDataHandler){

            console.error("Err: Database is not ready yet");
            return;

        }

        const { existingLocalUser, existingDatabaseUser } = await serverDataHandler.checkExistingAccount(givenAccountID);

        if (!existingDatabaseUser){

            socket.emit("invalid-account");
            return;

        }

        if (!existingLocalUser){
            const generatedToken = serverDataHandler.createToken(givenAccountID);
            socket.data.token = generatedToken;
        }

        else{

            const foundTokenID = serverDataHandler.searchAttributeInTokens("accountID", givenAccountID);
            if (!foundTokenID) return;

            serverDataHandler.changeTokenAttribute(foundTokenID, "lastLoggedIn", null);
            socket.data.token = foundTokenID

        }

        serverDataHandler.addSocketToToken(socket)

        socket.emit("valid-account")

    });

    socket.on("log-user-in", (givenUsername, givenPassword)=>{

        givenUsername = String(givenUsername);
        givenPassword = String(givenPassword);

        console.log(givenUsername, givenPassword)

    })

    socket.on("create-account", async (givenUsername, givenPassword, givenEmail)=>{

        const validUsername = await serverDataHandler.verifyUsername(givenUsername);
        const validPassword = serverDataHandler.verifyPassword(givenPassword); //not async function
        let validEmail;

        if (!validUsername.success && validPassword.success){
            validEmail = {
                success: false,
                message: ""
            }
        }
        else validEmail = await serverDataHandler.addToVerificationProcess(givenEmail, givenUsername, givenPassword);

        console.log(validUsername);
        console.log(validPassword);
        console.log(validEmail)

        socket.emit("account-creation-status", {
            validUsername: validUsername,
            validPassword: validPassword,
            validEmail: validEmail,
        });

    })

}
 
function wait (waitTime){

    return new Promise(resolve => setTimeout(resolve, waitTime))

}

module.exports = {databaseEventsHandler}