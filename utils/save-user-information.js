const users = [];

const saveUserInfo = (userId, userName, roomType) => {
    let user = {};
    user.id = userId;
    user.userName = userName;
    user.roomType = roomType;

    users.push(user);
    return user;
}
module.exports = saveUserInfo;