const express = require("express");
const app = express();
const port = 3000;
const host = "localhost";

const path = require("path");
app.use("/static", express.static(path.join(__dirname, "public")));

app.set("view engine", "pug");

/**
 * homepage, what the project is about, cv path, etc
 */
app.get("/", (req, res) => {
    res.render("home", { title: "Home" });
});

/**
 * how to setup arduino for keyboard
 */
app.get("/setup", (req, res) => {
    res.send("");
});

/**
 * keyboard functionality
 * - compose: record notes to be sent to arduino
 * - uploads: pick songs to be sent arduino
 */

app.get("/kb/composer", (req, res) => {
    res.render("compose", { title: "Composer" });
});

// app.get("/kb/uploads", (req, res) => {
//     res.send("");
// });

// app.post("/kb/uploads", (req, res) => {
//     console.log(req.body);
//     res.send();
// });

/**
 * import songs from midi files to be played
 */
// app.get("/import", (req, res) => {
//     res.send("");
// });

app.listen(port, () => {
    console.log(`🚀 Server ready at: http://${host}:${port}`);
});
