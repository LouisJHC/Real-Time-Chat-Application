const socket = io();
let currentUser;
socket.on('welcome-message', (message) => {
    appendWelcomeMessage(message);
})

socket.on('welcome-notification-to-all-others', (message) => {
    appendWelcomeMessageToAllOthers(message);
})


// with the user information, when the user wants to view all the messages he/she has sent so far, it will send the get request to the server, and query the db.
socket.on('current-user', (user) => {
    currentUser = user;
})

socket.on('send-back-user-typed-message-to-self', (message) => {
    appendMessageToSelf(message);
})
socket.on('send-back-user-typed-message', (message) => {
    appendMessage(message);
})

socket.on('send-back-removed-message', (removedMessageId) => {
    removeMessageFromOtherClients(removedMessageId);
})

socket.on('user-disconnected', (userInfo) => {
    appendDisconnectMessage(userInfo)
})

const joinedUsers = document.querySelector('#joined-users');

socket.on('list-of-users-in-the-room', (listOfUsers) => {
    // only allow the user with the unique name. Thus, when the page is refreshed, it will prevent from adding the same client name to the user list of the chat room multiple times.
    const uniqueListOfUsers = [...new Set(listOfUsers.map(listOfUser => listOfUser.userName))]
    for(let i=0;i<uniqueListOfUsers.length;i++) {
        ul = document.createElement('ul');
        ul.classList.add('user-name');
        ul.innerText = uniqueListOfUsers[i];
        joinedUsers.appendChild(ul);
    }
})

const appForm = document.querySelector('#app-form');
const appMessages = document.querySelector('.app-messages')


appForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = event.target.elements.messageText.value;
    socket.emit('user-typed-message', message);
    event.target.elements.messageText.value = '';
})


function appendWelcomeMessage(message) {
    div = document.createElement('div');
    div.classList.add('message');

    div.innerHTML = `<p class="meta"> ChatBot <span> ${message.time}</span></p>
    <p class="text"></p> Welcome to the ${message.roomType} chat room!`

    appMessages.appendChild(div);
}

function appendWelcomeMessageToAllOthers(message) {
    div = document.createElement('div');
    div.classList.add('message');

    div.innerHTML = `<p class="meta"> ChatBot <span>${message.time}</span></p>
                    <p class="text"></p> ${message.userName} ${message.message} [${message.roomType}].`

    
    appMessages.appendChild(div);               
}

// handling messages that client him/herself sent to the other people.
function appendMessageToSelf(message) {
        let div = document.createElement('div');
        div.classList.add('message');

        let deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
    
        div.innerHTML = `<p class="meta"><span></span>Me: ${message.time}</p>
        <p class="text"></p> ${message.message}`

        deleteBtn.setAttribute('value', message.messageId);
        deleteBtn.setAttribute('type', 'submit');
        deleteBtn.innerHTML = 'Delete';

        appMessages.appendChild(div);
        appMessages.appendChild(deleteBtn);
    
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
                let messageId = deleteBtn.getAttribute('value');
                fetch('/message/delete/' + messageId, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
 
        
        socket.emit('removed-message', message.messageId);
            // after deleting the corresponding message from the db, remove the message and delete button from the chat UI of the sender.
            // if i do div.innerHTML = '', deleteBtn.innerHTML = '', the white space will be there in the UI, and the subsequent messages
            // sent will appear after this white space.
            appMessages.removeChild(div);
            appMessages.removeChild(deleteBtn);
        })

    }


function appendMessage(message) {
        div = document.createElement('div');
        div.classList.add('message');
        // messages that have been broadcasted from the server.
        div.innerHTML = `<p class="meta">${message.userName} <span>${message.time}</span></p>
        <p class="text"></p> ${message.message}`

        // save the messageId in the div tag for later, so if the sender deletes the messages he/she sents (from their chat UI and db), I can find it in other clients' side,
        // and also delete it from the other connected clients' chat UI. 
        div.setAttribute('value', message.messageId);
        
        appMessages.appendChild(div);
    }

function removeMessageFromOtherClients(removedMessageId) {
    // get the list of all div tags that were appended to their main div tag appMessages.
    const subDivs = appMessages.getElementsByTagName('div');

    for(let i=0;i<subDivs.length;i++) {
        if(subDivs[i].getAttribute('value') === removedMessageId) {
            appMessages.removeChild(subDivs[i]);
        }
    }
}


function appendDisconnectMessage(userInfo) {
    div = document.createElement('div');
    div.classList.add('message');

    div.innerHTML = `<p class="meta"> ChatBot <span> ${userInfo.time}</span></p>
    <p class="text"></p> ${userInfo.userName} disconnected!`

    // removes disconnected user's name in the user list.
    const subDivs = joinedUsers.getElementsByTagName('ul');
    for(let i=0;i<subDivs.length;i++) {
        if(subDivs[i].innerText === userInfo.userName) {
            joinedUsers.removeChild(subDivs[i]);
        }
    }
    appMessages.appendChild(div);
}


const currentURL = window.location.href;
const { userName, roomType } = customURLParser(currentURL);

// parse the URL and get the userName and the roomType he/she joined
function customURLParser(currentURL) {
    let userName = [];
    let roomType = [];
    currentURL = currentURL.split('?')[1].split('&');
    for(let i=0;i<currentURL.length;i++) {
        for(let j=currentURL[i].length-1;j>=0;j--) {
            if(currentURL[i][j] === '=') break;
            // + is to take care of the space entered for the user name.
            if(i === 0) {
                if(currentURL[i][j] === '+') {
                    userName.push(' ');
                } else {
                    userName.push(currentURL[i][j]);
                }
            } else {
                if(currentURL[i][j] === '+') {
                    roomType.push(currentURL[i][j]);
                } else {
                roomType.push(currentURL[i][j])
                }
            }
        }
    }

    userName = userName.reverse().join("");
    roomType = roomType.reverse().join("");
    return { userName: userName, roomType: roomType};
} 

const roomName = document.querySelector('#room-name');
roomName.innerText = roomType;
socket.emit('send-username-and-roomtype', { userName: userName, roomType: roomType });

const chatLog = document.querySelector('#chatlog-btn');
    chatLog.addEventListener('click', (e) => {
        e.preventDefault();
        getUserMessage(currentUser.userName, currentUser.roomType);
});


async function getUserMessage(userName, roomType) {
    const response = await fetch(`/message/${userName}/${roomType}`, {
        Method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const json = await response.json();
    if(JSON.stringify(json) === JSON.stringify([])) {
        // first clear localStorage from the previous session, if there was any. I could have used sessionStorage instead, in which the data persist over page reloads, and
        // each new window opened initiates a new session.
       localStorage.clear();
        const div = document.createElement('div');
        div.classList.add('chatlog');
        div.innerText = "You Have No Messages To Show!";
        setTimeout(() => {
            div.innerText = '';
        }, 3000);
        document.querySelector('.chatlog-container').appendChild(div);
    } else {
        let showAllMessages = [];
        json.forEach(i => {
            showAllMessages.push(i.message);
        })
        // localStorage only handles strings, so I need to turn the array into string format, and then parse it later.
        localStorage.setItem('key', JSON.stringify(showAllMessages));

        // after storing the user messages, redirect user to the page.
        window.location='user-messages.html'
    }
}


