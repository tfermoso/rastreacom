const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");


const router = express.Router();


// REGISTER
router.get("/register", async (req, res) => {
    res.render("register");
});

router.post("/register", async (req, res) => {
    //Obtenemos los datos del formulario
    const { nombre, email, password, edad } = req.body;

    //Validamos que no falte ningún campo
    if (!nombre || !email || !password) {
        return res.render("register", { error: "Todos los campos son obligatorios" });
        
    }
    //Validamos que el email no esté registrado
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.render("register", { error: "El email ya está registrado" });
    }
    //Hasheamos la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    //Creamos el nuevo usuario
    const newUser = new User({
        nombre,
        email,
        password: hashedPassword,
        edad: edad || null
    });

    try {
        await newUser.save();
        res.redirect("/login");
    } catch (error) {
        res.render("register", { error: "Error al crear el usuario" });
    }
});


// LOGIN
router.get("/login", async (req, res) => {
   res.render("login");
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render("login", { error: "Todos los campos son obligatorios" });
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.render("login", { error: "Email no registrado" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.render("login", { error: "Contraseña incorrecta" });
    }else {
        //Guardamos el usuario en la sesión (si usas sesiones)
        req.session.user = user;
        res.redirect("/dashboard");
    }

});





module.exports = router;