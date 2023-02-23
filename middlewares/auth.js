const jwt = require("jwt-simple");
const moment = require("moment");
const { secretKey } = require("../services/jwt");

// Middleware de autenticacion
exports.auth = (req, res, next) => {
  // next metodo que me permite saltar a la siguiente accion

  // Comprobar si recibimos el header de Authorization
  if (!req.headers.authorization) return res.status(403).send({
    status: "error",
    message: "La peticion no tiene el header de autenticacion."
  });

  // Limpiar token (a veces llega con comillas x ej, entonces las sacamos con una regex)
  let token = req.headers.authorization.replace(/['"]+/g, '');

  // Decodificar token
  try {
    let payload = jwt.decode(token, secretKey);

    // Comprobar expiracion token
    if(payload.exp <= moment().unix()) return res.status(401).send({
      status: "error",
      message: "Token expirado."
    });

    // Agregar datos de usuario a request
    req.user = payload;
  } catch (error) {
    return res.status(404).send({
      status: "error",
      message: "Token invalido."
    })
  }

  // Pasar a ejecucion de accion
  next(); // Para pasar a la siguiente accion, o sea a la fn del controller

}
