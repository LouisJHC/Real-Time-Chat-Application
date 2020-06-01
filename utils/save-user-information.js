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
    return usersInTheRoom;
}

const deleteUserInfo = (userId) => {
    for(let i=0;i<users.length;i++) {
        if(users[i].userId === userId) {
            users.splice(i, 1);
        }
    }
}

module.exports = {
    saveUserInfo,
    getUsersFromTheRoom,
    deleteUserInfo,
};

