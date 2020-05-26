const users = [];

const saveUserInfo = (userId, userName, roomType) => {
    let user = {};
    user.id = userId;
    user.userName = userName;
    user.roomType = roomType;

    users.push(user);
    return user;
}

const getUsersFromTheRoom = (roomType) => {
    let usersInTheRoom = [];
    for(let i=0;i<users.length;i++) {
        if(users[i].roomType == roomType) {
            usersInTheRoom.push(users[i].userName);
        }
    }

    return usersInTheRoom;
}


module.exports = {
    saveUserInfo,
    getUsersFromTheRoom
};
