
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

if (!server.listening){

    server.listen(port, "0.0.0.0", ()=>{

        console.log(`Server has been initiated at http://localhost:${port}`)

    })

}

else console.log("Server has already been initiated");

const localTokens = {};

//on connection tasks
io.on("connection", (socket)=>{

    console.log("someone has connected");

    socket.on("disconnect", ()=>{

        console.log("someone has disconnected")

    })

})