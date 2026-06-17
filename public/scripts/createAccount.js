
const form = document.getElementById("form");
const submitButton = document.getElementById("submitButton");

const usernameError = document.getElementById("usernameError");
const createPasswordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");
const emailError = document.getElementById("emailError");

form.addEventListener("submit", function(event) {
    event.preventDefault();

    sendFormData();

});

socket.on("account-creation-status", (data)=>{

    console.log(data);

    clearForm();

    submitButton.style.pointerEvents = "auto";
    submitButton.style.filter = "brightness(100%)";

    usernameError.innerHTML = data.validUsername.message;
    createPasswordError.innerHTML = data.validPassword.message;
    emailError.innerHTML = data.validEmail.message;

    if (data.validUsername.success && data.validPassword.success && data.validEmail.success){
        alert('Verification code sent to ur email cuhh');
    }
    
})

function sendFormData(){

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    console.log(data.createPassword, data.confirmPassword)
    if (data.createPassword !== data.confirmPassword){
        confirmPasswordError.innerHTML = "Passwords are not the same";
        confirmPasswordError.style.color = "red";
        return;
    }
    else{

        submitButton.style.pointerEvents = "none";
        submitButton.style.filter = "brightness(60%)";
        socket.emit("create-account", data.username, data.createPassword, data.email);

    }

}

function clearForm(){

    usernameError.innerHTML = "";
    createPasswordError.innerHTML = "";
    confirmPasswordError.innerHTML = "";
    emailError.innerHTML = "";

}