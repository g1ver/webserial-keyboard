const express = require('express');
const app = express();
const port = 3000;
const host = "localhost";

const path = require('path');
app.use('/static', express.static(path.join(__dirname, 'public')));

app.set('view engine', 'pug');

app.get('/layout', (req, res) => {
    res.render('layout', {title: 'Header Test'});
});

/**
 * homepage, what the project is about, cv path, etc
 */
app.get('/', (req, res) => {
    res.render('home', {title: 'Home'});
});

/**
 * how to setup arduino for keyboard
 */
app.get('/setup', (req, res) => {
    res.send('');
});

/**
 * keyboard functionality
 * - play: click notes and hear them
 * - compose: record notes to be sent to arduino
 * - songs: download songs to be played by arduino
 */
app.get('/kb/play', (req, res) => {
    res.render('play', {title: 'Synthesizer'});
});

app.get('/kb/compose', (req, res) => {
    res.render('compose', {title: 'Composer'});
});

app.get('/kb/songs', (req, res) => {
    res.send('');
});

/**
 * import songs from midi files to be played
 */
app.get('/import', (req, res) => {
    res.send('');
});

app.listen(port, () => {
  console.log(`🚀 Server ready at: http://${host}:${port}`);
});