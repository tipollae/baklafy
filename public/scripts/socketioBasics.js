const socket = io("http://localhost:3000/", {
    transports: ["websocket"],
    upgrade: false
});

socket.on("connect", () => {
    console.log("connected", socket.id);
});

socket.on("connect_error", (err) => {
    console.log("message:", err.message);
    console.log("description:", err.description);
    console.log("context:", err.context);
    console.log("full:", err);
});

socket.on("invalid-account", ()=>{

    console.log("inavlid account");
    window.location = "./login/index.html"

})

socket.on("valid-account", ()=>{

    console.log("logged in!");

})
