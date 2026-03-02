require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/auth.routes");


const app = express();

// serve frontend static files
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Mongo conectado"));

app.use("/auth", authRoutes);




app.listen(3000);