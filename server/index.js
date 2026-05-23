
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

if (!server.listening){

    server.listen(port, "0.0.0.0", ()=>{

        console.log(`Server has been initiated at http://localhost:${port}`)

    })

}

else console.log("Server has already been initiated");

const { MongoClient, ServerApiVersion } = require("mongodb")
const uri = process.env.MONGO_DB_AUTH;
const { databaseHandler } = require("./databaseHandling");
let serverDataHandler = null;

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

        serverDataHandler = new databaseHandler(client)

    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }

}
connectToMongoDB().catch(console.dir);

//on connection tasks
io.on("connection", (socket)=>{

    //put all socket protocol events here
    protocolFunctions(socket);

    socket.on("downloadmp3", async(data) => {
        const {url, folder} = data;

        try {
            await downloadYoutubeAudio(url, folder);
            
            socket.emit('download-status', {
                success: true,
                message: 'Download complete!'
            })
        } catch (error) {
            console.error("Download failed:", error)
            socket.emit('download-status', {
                success: false,
                message: 'Download failed. Check console'
            })
        }
    })

    socket.on("disconnect", ()=>{

        console.log("someone has disconnected")

    })

    socket.on("check-existing-account", async (givenAccountID)=>{

        console.log(givenAccountID);

        if (!serverDataHandler){

            socket.emit("account-check-result", {
                success: false,
                message: "Database not ready yet"
            })
            return;

        }

        const existingAccount = await serverDataHandler.checkExistingAccount(givenAccountID);
        console.log(existingAccount);

        socket.emit("account-check-result", {
            success: true,
            foundAccount: existingAccount
        })

    })

})

function protocolFunctions(socket){

    socket.emit("check-existing-account");

}