const express = require("express");
const bcrypt = require("bcrypt");


const router = express.Router();


// REGISTER
router.get("/register", async (req, res) => {
    res.render("register");
});
router.post("/register", async (req, res) => {
    res.send("Registro de usuario");
});


// LOGIN
router.get("/login", async (req, res) => {
   res.render("login");
});

router.post("/login", async (req, res) => {
    res.send("Login de usuario");
});





module.exports = router;