const socket = io('localhost:3000');

socket.on('welcome-message', message => {
    appendMessages(message);
})

socket.on('welcome-notification-to-all-others', message => {
    appendMessages(message);
})
socket.on('user-typed-message-send-back', message => {
    appendMessages(message);
})


const appForm = document.querySelector('#app-form');
const appMessages = document.querySelector('.app-messages')



appForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = event.target.elements.messageText.value;

    // show the message in the sender's chat box as well.
    appendMessages(message);
    socket.emit('user-typed-message', message);

    event.target.elements.messageText.value = '';
})
const date = new Date();
function appendMessages(message) {
    div = document.createElement('div');
    div.classList.add('message');

    // handling messages that client him/herself sent to the other people.
    if(message.userName === undefined && message.name === undefined && message.time === undefined) {
        div.innerHTML = `<p class="meta"><span></span>Me: ${date}</p>
        <p class="text"></p> ${message}`
    // messages that have been broadcasted from the server.
    } else {
        div.innerHTML = `<p class="meta">${message.userName} <span>${message.time}</span></p>
        <p class="text"></p> ${message.message}`
    }

    appMessages.appendChild(div);
}


const currentURL = window.location.href;
const userNameAndRoomType = customURLParser(currentURL); 
// parse the URL and get the userName and the roomType he/she joined
function customURLParser(currentURL) {
    let userName = [];
    let roomType = [];
    currentURL = currentURL.split('?')[1].split('&');

    for(let i=0;i<currentURL.length;i++) {
        for(let j=currentURL[i].length-1;j>=0;j--) {
            if(currentURL[i][j] === '=') break;
            if(i === 0) {
                userName.push(currentURL[i][j]);
            } else {
                roomType.push(currentURL[i][j]);
            }
        }
    }

    userName = userName.reverse().join("");
    roomType = roomType.reverse().join("");
    return { userName: userName, roomType: roomType};
} 

