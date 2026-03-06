require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
//Crear variable de session

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 24,
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);


// serve frontend static files
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
// Carpeta de vistas (ajusta según tu estructura)
app.set("views", path.join(__dirname, "..", "views"));
console.log("Conectando a MongoDB...");
console.log("URI de MongoDB:", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Mongo conectado"));


app.use("/auth", authRoutes);

// rutas protegidas del usuario
app.use("/user", userRoutes);

app.get("/", (req, res) => {
    return res.render("index");
  });   


// 404 handler (siempre al final, después de app.use(...) de rutas)
app.use((req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/user/dashboard");
  }

  // si está logueado puedes redirigir a dashboard o mostrar 404
  return res.redirect("/");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});