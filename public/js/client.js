const socket = io('localhost:3000')

socket.on('welcome-message', message => {
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

    socket.emit('user-typed-message', message);
})

function appendMessages(message) {
    div = document.createElement('div');
    div.classList.add('message');

    div.innerHTML = `<p class="meta">Louis <span>1:20pm</span>&nbsp Random Message</p>
    <p class="text"></p> ${message}`

    appMessages.appendChild(div);

}


