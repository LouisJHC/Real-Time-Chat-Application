const socket = io();

socket.on('welcome-message', message => {
    appendWelcomeMessage(message);
})

socket.on('welcome-notification-to-all-others', message => {
    appendWelcomeMessageToAllOthers(message);
})

socket.on('send-back-user-typed-message-to-self', message => {
    appendMessageToSelf(message);
})
socket.on('send-back-user-typed-message', message => {
    appendMessage(message);
})

socket.on('user-disconnected', message => {
    appendDisconnectMessage(message)
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

    // // show the message in the sender's chat box as well.
    // appendMessage(message);
    socket.emit('user-typed-message-to-self', message);
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



const date = new Date();

// handling messages that client him/herself sent to the other people.
function appendMessageToSelf(message) {
        let div = document.createElement('div');
        div.classList.add('message');

        let deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
    
        div.innerHTML = `<p class="meta"><span></span>Me: ${date}</p>
        <p class="text"></p> ${message.message}`

        deleteBtn.setAttribute('value', message.messageId);
        deleteBtn.setAttribute('type', 'submit');
        deleteBtn.innerHTML = 'Delete';

        appMessages.appendChild(div);
        appMessages.appendChild(deleteBtn);
    
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            setTimeout(() => {
                let messageId = deleteBtn.getAttribute('value');
                console.log(messageId);
                fetch('/message/delete/' + messageId, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.json()).then(data => console.log(data));
            }, 3000);
            
            // after deleting the corresponding message from the db, remove the message and delete button from the UI.
            // if i do div.innerHTML = '', deleteBtn.innerHTML = '', the white space will be there in the UI, and the subsequent messages
            // sent appear after this white space.
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
        

        appMessages.appendChild(div);
    }



function appendDisconnectMessage(message) {
    div = document.createElement('div');
    div.classList.add('message');

    div.innerHTML = `<p class="meta"> ChatBot <span> ${message.time}</span></p>
    <p class="text"></p> ${message.userName} disconnected!`

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

    getUserMessage();

});

async function getUserMessage() {
    const response = await fetch('/messages');
    const json = await response.json();

    if(JSON.stringify(json) === JSON.stringify([])) {
        const div = document.createElement('div');
        div.classList.add('chatlog');
        div.textContent = "You Have No Messages To Show!";
        document.querySelector('.chatlog-container').appendChild(div);
    } else {
        json.forEach(i => {
            const div = document.createElement('div');
            div.classList.add('chatlog');
            div.textContent = i.message;
            document.querySelector('.chatlog-container').appendChild(div);
        })
    }

}


