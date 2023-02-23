const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("../services/jwt");
const pagination = require("mongoose-pagination");
const path = require("path");
const fs = require("fs");

const register = (req, res) => {
  let params = req.body;

  // Chequear que lleguen los campos obligatorios
  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).json({
      status: "error",
      message: "Faltan datos por enviar"
    });
  }

  // Controlar si hay usuarios duplicados: si el email $or || el nick ya existen
  User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.nick.toLowerCase() }
    ]
  }).exec(async (error, users) => {
    if (error) {
      return res.status(500).json({
        status: "error",
        message: "Error en la consulta de usuarios"
      });
    }
    if (users && users.length >= 1) {
      return res.status(200).send({
        status: "success",
        message: "El usuario ya existe"
      });
    }
    // Cifrar password
    let pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;

    // Crear objeto de usuario luego de pasar por los filtros
    let userToSave = new User(params);

    // Guardar usuario en bbdd
    userToSave.save((error, storedUser) => {
      if (error || !storedUser) return res.status(500).send({ status: "error", message: "Error al guardar el usuario" });
      return res.status(200).json({
        status: "success",
        message: "Usuario registrado exitosamente",
        user: storedUser
      });
    });
  });
}

const login = (req, res) => {
  let params = req.body;

  if (!params.email || !params.password) return res.status(400).json({ status: "error", message: "Faltan datos por enviar" });

  User.findOne({
    email: params.email
  })
    //.select({ "password": 0 }) // seleccionar que campos devolver. En este caso no retorna la pwd.
    .exec((error, foundUser) => {
      if (error || !foundUser) return res.status(404).json({ status: "error", message: "Usuario no encontrado" });

      // Comprobar la pwd
      let pwd = bcrypt.compareSync(params.password, foundUser.password);
      if (!pwd) return res.status(400).json({ status: "error", message: "Contraseña incorrecta" });

      // Devolver token usando JWT
      const token = jwt.createToken(foundUser);

      // Devolver datos de usuario
      return res.status(200).json({
        status: "success",
        message: "Login exitoso",
        user: {
          id: foundUser._id,
          name: foundUser.name,
          nick: foundUser.nick
        },
        token: token
      });
    });
}

const profile = (req, res) => {
  // Recibir parametro id del usuario x url
  const id = req.params.id;

  // Consulta para traer datos del usuario de bbdd
  User.findById(id)
    .select({ password: 0, role: 0 }) // sacamos estos datos del user a devolver
    .exec((error, user) => {
      if (error || !user) return res.status(404).send({
        status: "error",
        message: "Se ha registrado un error."
      });

      // Devolver el resultado
      // TODO Devolver informacion de follows
      return res.status(200).send({
        status: "success",
        user: user
      });
    });
}

const list = (req, res) => {
  // Controlar en que pagina estamos
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }
  page = parseInt(page);

  // Consulta con mongoose paginate
  let itemsPerPage = 5;
  User.find().sort("_id").paginate(page, itemsPerPage, (error, users, total) => {
    if (error || !users) {
      return res.status(404).send({
        status: "error",
        message: "Error en la consulta",
        error
      });
    }
    // Devolver el resultado
    // TODO Devolver informacion de follows
    return res.status(200).send({
      status: "success",
      users,
      page,
      itemsPerPage,
      total,
      pages: Math.ceil(total / itemsPerPage)
    });
  }) // Pasamos pagina actual + numero de items por pagina
}

const update = (req, res) => {
  // Traer info del usuario a actualizar mediante token
  let userIdentity = req.user;
  let userToUpdate = req.body;

  // Eliminar campos sobrantes
  delete userToUpdate.iat;
  delete userToUpdate.exp;
  delete userToUpdate.role;
  delete userToUpdate.image;

  // Comprobar si usuario ya existe (por email o nick)
  User.find({
    $or: [
      { email: userToUpdate.email.toLowerCase() },
      { nick: userToUpdate.nick.toLowerCase() }
    ]
  }).exec(async (error, users) => {
    if (error) {
      return res.status(500).json({
        status: "error",
        message: "Error en la consulta de usuarios"
      });
    }

    // Solo podremos editar el perfil del usuario que hizo login
    let userIsset = false;
    users.forEach(user => {
      if (user && user._id != userIdentity.id) userIsset = true;
    })
    if (userIsset) {
      return res.status(200).send({
        status: "success",
        message: "El usuario ya existe"
      });
    }

    // Cifrar password
    if (userToUpdate.password) {
      let pwd = await bcrypt.hash(userToUpdate.password, 10);
      userToUpdate.password = pwd;
    }

    // Buscar y actualizar
    try {
      User.findByIdAndUpdate(userIdentity.id, userToUpdate, { new: true }, (error, updatedUser) => {
        if (error || !updatedUser) {
          return res.status(500).send({
            status: "error",
            message: "Error al actualizar el usuario"
          });
        }
        return res.status(200).send({
          status: "success",
          message: "Update user",
          user: updatedUser
        });
      });
    } catch (error) {
      return res.status(400).send({
        status: "error",
        message: "Error al actualizar el usuario"
      });
    }
  });
}

const upload = (req, res) => {
  // Traer fichero imagen y comprobar que existe
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "La peticion no incluye una imagen."
    });
  }

  // Conseguir nombre archivo
  let image = req.file.originalname;

  // Sacar extension archivo
  let fileExtension = path.extname(image);

  // Comprobar extension > borrar o guardar imagen segun extension
  if (fileExtension != ".png" && !fileExtension != ".jpg" && !fileExtension != ".jpeg" && !fileExtension != ".gif") {
    const filePath = req.file.path;
    fs.unlinkSync(filePath); // Elimina un archivo de un fichero
    return res.status(400).send({
      status: "error",
      message: "Extension de archivo invalida."
    })
  }
  // Guardar el archivo en el fichero
  User.findOneAndUpdate(
    req.user.id,
    { image: req.file.filename },
    { new: true },
    (error, updatedUser) => {
      if (error || !updatedUser) {
        return res.status(500).send({
          status: "error",
          message: "Error en la subida de imagen."
        });
      }
      return res.status(200).json({
        status: "success",
        user: updatedUser,
        file: req.file
      });
    }
  )
}

const avatar = (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Avatar route"
  });
}

module.exports = {
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar
}
