const jwt = require("jwt-simple");
const moment = require("moment");

// Clave secreta > para codificar y decodificar token
const secretKey = "ii8xub3pU&y$T*__tV9kY4UwmnA678Jkds";

const createToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    surname: user.surname,
    nick: user.nick,
    email: user.email,
    role: user.role,
    image: user.image,
    iat: moment().unix(), // momento en el que creamos este payload
    exp: moment().add(30, "days").unix() // fecha de expiracion del token: 30 dias
  }
  return jwt.encode(payload, secretKey);
}

module.exports = {
  secretKey,
  createToken
};
