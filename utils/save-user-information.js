let users = [];

const saveUserInfo = (userId, userName, roomType) => {
    let user = {};
    user.userId = userId;
    user.userName = userName;
    user.roomType = roomType;
    users.push(user);
    return user;
}


const getUsersFromTheRoom = (userId, roomType) => {
    let usersInTheRoom = [];
    for(let i=0;i<users.length;i++) {
        // have to put it inside the for loop, the new user gets created everytime.
        // If this is outside the for loop, then user.userName will keep getting overwritten, and it would produce wrong output.
        let user = {};
        if(users[i].roomType === roomType) {
            user.userId = users[i].userId;
            user.userName = users[i].userName;
            usersInTheRoom.push(user);
        }
    }
    return Array.from(usersInTheRoom);
}

const deleteUserInfo = (userId) => {
    for(let i=0;i<users.length;i++) {
        if(users[i] === userId) {
            users.splice(i, 1);
        }
    }
}

let messages = [];

const addMessageToTheList = async (messageInfo) => {
    let message = {};
    message.messageId = messageInfo.messageId;
    message.messageContent = messageInfo.messageContent;

    const result = await messages.push(message);

    return result;
}

const getAllSavedMessages = () => {
    console.log(messages);
}
module.exports = {
    saveUserInfo,
    getUsersFromTheRoom,
    deleteUserInfo,
    addMessageToTheList,
    getAllSavedMessages
};

