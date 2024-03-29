var usernameCallbackID = 0;
var passwordCallbackID = 0;

function onUsernameInput(inputElement, notifyID)
{
    if (usernameCallbackID !== 0)
    {
        window.clearTimeout(usernameCallbackID);
    }

    var username = inputElement.value;
    var notifyElement = document.getElementById(notifyID);

    if (notifyElement)
    {
        notifyElement.innerHTML = "";
        usernameCallbackID = window.setTimeout(function() { checkUsername(username, notifyElement) }, 333);
    }
}


function onPasswordInput()
{
    if (passwordCallbackID !== 0)
    {
        window.clearTimeout(passwordCallbackID);
    }

    var notifyElement = document.getElementById("passwordnote");

    if (notifyElement)
    {
        notifyElement.innerHTML = "";
        passwordCallbackID = window.setTimeout(checkPassword, 333);
    }
}


function checkPassword()
{
    var passwordElement = document.getElementById("passwordInput");
    var confirmElement  = document.getElementById("confirmInput");
    var notifyElement   = document.getElementById("passwordnote");

    if (passwordElement.value === "")
    {
        notifyElement.innerHTML = "Password is mandatory";
        return;
    }

    if (confirmElement.value === "")
    {
        notifyElement.innerHTML = "Confirm your password";
        return;
    }

    if (passwordElement.value !== confirmElement.value)
    {
        notifyElement.innerHTML = "Passwords don't match";
        return;
    }

    notifyElement.innerHTML = "👌";
}


function checkUsername(username, notifyElement)
{
    if (username === "")
    {
        notifyElement.innerHTML = "Username is mandatory";
        return;
    }

    if (username.toLowerCase() === "anonymous")
    {
        notifyElement.innerHTML = "Can't be anonymous";
        return;
    }

    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (this.readyState != 4 || this.status != 200) { return; }

        var jsonResponse = JSON.parse(this.responseText);

        if      (jsonResponse.tooShort)   { notifyElement.innerHTML = "Username too short"; }
        else if (jsonResponse.tooLong)    { notifyElement.innerHTML = "Username too long"; }
        else if (!jsonResponse.valid)     { notifyElement.innerHTML = "Only A-Z, a-z, 0-9, _, and - allowed"; }
        else if (!jsonResponse.available) { notifyElement.innerHTML = "Already taken"; }
        else                              { notifyElement.innerHTML = "Available"; }
    };

    request.open("GET", "/api/checkUsername?username=" + encodeURIComponent(username));
    request.send();
}


function jsonRegister()
{
    console.log("benis");
}