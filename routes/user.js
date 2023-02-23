const express = require("express");
const router = express.Router();
const multer = require("multer");
const userController = require("../controllers/user");
const { auth } = require("../middlewares/auth");

// Configuracion storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/avatars/")
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${Date.now()}-${file.originalname}`);
  }
})

// Configuracion multer
const uploads = multer({storage});

// Router
router.post("/register", userController.register); // publico
router.post("/login", userController.login); // publico
router.get("/profile/:id", auth, userController.profile); // privado con auth > requiere header de Authorization con el token
router.get("/list/:page?", auth, userController.list);
router.put("/update", auth, userController.update); // solo permite actualizar datos de nosotros mismos, asi que no pasamos id por parametro sino que usamos el auth
router.post("/upload", [auth, uploads.single("file0")], userController.upload);
router.get("/avatar/:file", auth, userController.avatar);

module.exports = router;
