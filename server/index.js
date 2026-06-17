
//environment variables
require('dotenv').config();

const dns = require("dns");
if (process.env.USE_CUSTOM_DNS === "true") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}
dns.setDefaultResultOrder("ipv4first");

//importing express
const express = require("express");
const path = require("path");

const { clearInterval } = require("timers");

//new express instance
const app = express();

//creates an http server using the created express app
const server = require("http").Server(app);

//attaching socket io to http server
const io = require("socket.io")(server);
const port = 3000;
// importing youtube downloader function
const { downloadYoutubeAudio } = require('./downloadYoutubeAudio');

const { MongoClient, ServerApiVersion } = require("mongodb")
const uri = process.env.MONGO_DB_AUTH;
const { databaseHandler } = require("./databaseHandling");
const { start } = require('repl');
let serverDataHandler = null;

const databaseCommunications = require("./databaseEvents")

if (!uri) {
    console.error("MONGO_DB_AUTH is missing from .env");
    process.exit(1);
}

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectToMongoDB(){

    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        serverDataHandler = new databaseHandler(client);
        serverDataHandler.clearExpiredTokensLoop(3000); //3 sec loop (will extend longer, but short for now cuz testing)
        serverDataHandler.verificationCodesLoop(3000); //3 sec loop

        await serverDataHandler.usersCollection.createIndex(
            { username: 1 },
            { unique: true }
        );

        await serverDataHandler.usersCollection.createIndex(
            { email: 1 },
            { unique: true }
        );

        await serverDataHandler.usersCollection.createIndex(
            { accountID: 1 },
            { unique: true }
        );

    } catch (error) {
        console.error("Err: MongoDB connection failed:", error);
    }

}

async function startServer() {

    await connectToMongoDB();

    server.listen(port, "0.0.0.0", ()=>{

        console.log(`Server has been initiated at http://localhost:${port}`)

    })

}
startServer();

//on connection tasks
io.on("connection", async (socket)=>{

    //put all socket protocol events here
    protocolFunctions(socket);

    socket.on("downloadmp3", async(data) => {
        const {url} = data;
        console.log('request to download')
        try {
            console.log('attempting download')
            await downloadYoutubeAudio(url, socket);
            
            socket.emit('download-status', {
                success: true,
                message: 'Download complete!'
            })
        } 
        catch (error) {
            console.error("Download failed:", error)
            socket.emit('download-status', {
                success: false,
                message: 'Download failed. Check console'
            })
        }
    });

    socket.on("disconnect", ()=>{

        serverDataHandler.handleDisconnectedSocket(socket);

    })

    databaseCommunications.databaseEventsHandler(socket, serverDataHandler);

})

function wait (waitTime){

    return new Promise(resolve => setTimeout(resolve, waitTime))

}


function protocolFunctions(socket){

    socket.emit("check-existing-account");

}