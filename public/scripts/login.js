
const username = document.getElementById("username");
const password = document.getElementById("password");

function logUserIn(){

    console.log("logging in user");

    var givenUsername = username.value;
    var givenPassword = password.value;

    socket.emit("log-user-in", givenUsername, givenPassword)

}