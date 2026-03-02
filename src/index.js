require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/auth.routes");


const app = express();

// serve frontend static files
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());

app.set("view engine", "ejs");
// Carpeta de vistas (ajusta según tu estructura)
app.set("views", path.join(__dirname, "..", "views"));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Mongo conectado"));

app.use("/auth", authRoutes);




app.listen(3000);