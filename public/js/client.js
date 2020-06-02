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
    removeMessageFromThePopUp(removedMessageId);
    removeMessageFromOtherClients(removedMessageId);
})

socket.on('send-back-removed-message-from-the-pop-up-to-self', (removedMessageId) => {
    removeMessageFromSelf(removedMessageId);
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

        div.setAttribute('messageId', message.messageId);

        // add this message instantly to the pop-up window as well. This change will be noticeable only if the pop is already opened
        // and the user typed in a new message.
        getUserMessage(currentUser.userName, currentUser.roomType); 

        // This is for when the user deletes the messages from the pop-up, the corresponding delete buttons can be deleted as well.
        deleteBtn.setAttribute('messageId', message.messageId);
        deleteBtn.setAttribute('type', 'submit');
        deleteBtn.innerHTML = 'Delete';

        appMessages.appendChild(div);
        appMessages.appendChild(deleteBtn);
    
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
                let messageId = div.getAttribute('messageId');
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
        div.setAttribute('messageId', message.messageId);
        
        appMessages.appendChild(div);
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
function removeMessageFromOtherClients(removedMessageId) {
    // get the list of all div tags that were appended to their main div tag appMessages.
    const subDivs = appMessages.getElementsByTagName('div');
    for(let i=0;i<subDivs.length;i++) {
        if(subDivs[i].getAttribute('messageId') === removedMessageId) {
            appMessages.removeChild(subDivs[i]);
        }
    }
}


function removeMessageFromSelf(removedMessageId) {
    // get the list of all div tags that were appended to their main div tag appMessages.
    const subDivs = appMessages.getElementsByTagName('div');

    // this is from the sender's UI, so I need to delete the delete button as well.
    const subButtons = appMessages.getElementsByTagName('button');

    for(let i=0;i<subDivs.length;i++) {
        if(subDivs[i].getAttribute('messageId') === removedMessageId) {
            appMessages.removeChild(subDivs[i] );
        }
    }

    for(let i=0;i<subButtons.length;i++) {
        if(subButtons[i].getAttribute('messageId') === removedMessageId) {
            appMessages.removeChild(subButtons[i]);
        }
    }
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

const modal = document.querySelector('.modal');
const chatLog = document.querySelector('#chatlog-btn');
const modalCloseBtn = document.querySelector('.modal-close-btn');

chatLog.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
    getUserMessage(currentUser.userName, currentUser.roomType);
});


modalCloseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'none';
}) 


// when the user deletes the message from his/her chat, it should also be removed from the modal pop-up right away, 
// where it shows the list of messages sent.
function removeMessageFromThePopUp(removedMessageId) {
    // no need to call getUserMessage() here again, because this function is to take care of the case where the user
    // already opened up the pop-up, which means the pop-up will already be populated with list of all messages from that user.
    // Thus, while the pop-up is opened, if the user deletes the messages from the chat UI, the changes will be reflected in the
    // pop-up instantly.

    const chatLogContainer2 = document.querySelector('.modal-container-2');

    // get the list of all div tags that were appended to their main div tag appMessages.
    const subDivs = chatLogContainer2.getElementsByTagName('li');

    // this is from the sender's UI, so I need to delete the delete button as well.
    const subButtons = chatLogContainer2.getElementsByTagName('button');

    for(let i=0;i<subDivs.length;i++) {
        if(subDivs[i].getAttribute('messageId') === removedMessageId) {
            chatLogContainer2.removeChild(subDivs[i] );
        }
    }

    for(let i=0;i<subButtons.length;i++) {
        if(subButtons[i].getAttribute('messageId') === removedMessageId) {
            chatLogContainer2.removeChild(subButtons[i]);
        }
    }
}



async function getUserMessage(userName, roomType) {
    const response = await fetch(`/message/${userName}/${roomType}`, {
        Method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const json = await response.json();
    if(JSON.stringify(json) === JSON.stringify([])) {
        const chatLogContainer1 = document.querySelector('.modal-container-1');
        const li = document.createElement('li');
        li.classList.add('chatlog');
        li.innerText = "You Have No Messages To Show!";
        chatLogContainer1.appendChild(li);
        setTimeout(() => {
            chatLogContainer1.removeChild(li);
        }, 3000);
    } else {
        const chatLogContainer2 = document.querySelector('.modal-container-2');
        // reset the innerHTML of the chatLogContainer2, since below forEach loop fetches all messages that user has sent everytime
        // the modal pop-up is clicked, so the duplicate messages will be appended to the list if innerHTML is not reset.
        chatLogContainer2.innerHTML = '';
        json.forEach(i => {
            const li = document.createElement('li');
            li.classList.add('chatlog');
            li.innerText = i.message;

            // // set the unique id for the messageId attribute for li to delete it from the modal pop-up if the user deletes it from their own chat UI as well.
            li.setAttribute('messageId', i._id);
    
            let deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
    
            deleteBtn.setAttribute('messageId', i._id);
            deleteBtn.setAttribute('type', 'submit');
            deleteBtn.innerHTML = 'Delete';
            chatLogContainer2.appendChild(li);
            chatLogContainer2.appendChild(deleteBtn);

            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                    let messageId = deleteBtn.getAttribute('messageId');
                    fetch('/message/delete/' + messageId, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
     
                socket.emit('removed-message-from-the-pop-up', i._id);
                socket.emit('removed-message', i._id);
                chatLogContainer2.removeChild(li);
                chatLogContainer2.removeChild(deleteBtn);
            })
        })
    }
}
