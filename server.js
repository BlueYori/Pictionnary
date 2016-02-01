var express = require('express');
var morgan = require('morgan');
var logger = require('log4js').getLogger('Server');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');
var app = express();

// config
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
//app.set('views', __dirname + '/views/Admin');


app.use(session({secret: 'ns2dk45nrl9vpa', resave: false, saveUninitialized: true,}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('combined'));
app.use(express.static(__dirname + '/public'));

logger.info('server start');

//Redirige sur la page login
app.get('/', function(req, res){
    res.redirect('/login');
});

app.get('/login', function (req, res) {
    if (req.session.user) {
        res.redirect('/main');
    }
    else {
        res.render('login');
    }
});

app.post('/login', function (req, res) {
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'test',
        password : 'test',
        database : 'pictionnary'
    });
    connection.connect();
    var condition = [req.body.email, req.body.password];
    connection.query("SELECT id, nom, prenom, couleur, profilePic FROM users WHERE email=? AND password=?", condition, function(err, rows, fields)
    {

        if (!err) {
            if(rows.length > 0) {
                console.log('Find');
                console.log(rows);
                rows = rows[0];
                req.session.userId = rows['id'];
                req.session.email = req.body.email;
                req.session.firstname = rows['nom'];
                req.session.lastname = rows['prenom'];
                req.session.color = rows['couleur'];
                req.session.profilPic = rows['profilePic'];
                res.redirect('/main');
            } else {
                res.redirect('/login');
            }
        } else {
            console.log('Error while performing Query.' + err);
        }
    });
    connection.end();
});

/*Affiche la page d'inscription*/
app.get('/inscription', function(req, res) {
    res.render('inscription', {query:req.query});
});

/*Méthode post d'inscription*/
app.post('/inscription', function(req, res) {
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'test',
        password : 'test',
        database : 'pictionnary'
    });
    var post = {id: req.body.id, email: req.body.email, password: req.body.password, nom: req.body.nom, prenom: req.body.prenom, tel: req.body.tel, website: req.body.website, sexe: req.body.sexe, birthdate: req.body.birthdate, ville: req.body.ville, taille: req.body.taille, couleur: req.body.couleur, profilepic: req.body.profilepic};
    connection.connect();
    connection.query("SELECT COUNT(*) AS numberRow FROM users WHERE email=? ", req.body.email, function(err, rows, fields) {
        if (!err) {
            if(rows[0]['numberRow'] == 0) {
                connection.query('INSERT INTO users SET ?', post, function(err, result) {
                    if(!err) {
                        req.session.userId = post['id'];
                        req.session.email = post['email'];
                        req.session.firstname = post['nom'];
                        req.session.lastname = post['prenom'];
                        req.session.color = post['couleur'];
                        req.session.profilPic = post['profilePic'].toString('utf8');
                        res.redirect('/main');
                    } else {
                        res.render('inscription');
                        logger.info('Error while performing Query insert.' + err);
                    }
                });
            } else {
                var query = "id" + req.body.userId +
                    "nom=" + req.body.nom +
                    "&prenom =" + req.body.prenom +
                    '&tel=' + req.body.tel +
                    '&website=' + req.body.website +
                    '&sexe=' + req.body.sexe +
                    '&birthdate=' + req.body.birthdate +
                    '&ville=' + req.body.ville +
                    '&taille=' + req.body.taille +
                    '&couleur=' + req.body.couleur;
                res.redirect('inscription/?' + query);
            }
            connection.end();
        } else {
            logger.info('Error while performing Query row count.' + err);
        }
    });
});

/*Affichage du main*/
app.get('/main', function(req, res) {
    if(!req.session.email) {
        res.redirect('/');
    } else {
        var connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'test',
            password : 'test',
            database : 'pictionnary'
        });
        connection.connect();
        connection.query("SELECT * FROM drawing WHERE id_utilisateur=? ", req.session.userId, function(err, rows) {
            if (!err) {
                res.render('main', {lastname:req.session.lastname, profilPic:req.session.profilPic, userDraw:rows});
            } else {
                logger.info('Error while performing Query draw row.' + err);
            }
        });
        connection.end();
    }
});

/*Affichage du pictionnary*/
app.get('/paint', function(req, res) {
    if(!req.session.email) {
        res.redirect('/');
    } else {
        res.render('paint', {color:req.session.color});
    }
});

/*Valider son dessin*/
app.post('/paint', function(req, res) {
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'test',
        password : 'test',
        database : 'pictionnary'
    });
    connection.connect();

    var post = {commandes:req.body.drawingCommands, dessin:req.body.picture, id_utilisateur:req.session.userId};
    connection.query('INSERT INTO drawing SET ?', post, function(err, rows, fields) {
        if (!err) {
            res.redirect('main');
        } else {
            logger.info('Error while performing Query insert drawing.' + err);
        }
    });
});

app.get('/guess', function(req, res) {
    if(!req.session.email) {
        res.redirect('/');
    } else {
        var connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'test',
            password : 'test',
            database : 'pictionnary'
        });
        connection.connect();
        connection.query("SELECT commandes FROM drawing WHERE id_utilisateur=? AND id=? ", [req.session.userId, req.query.id], function(err, rows) {
            if (!err) {
                if(rows.length > 0) {
                    res.render('guess', {command:rows[0]['drawingCommands']});
                } else {
                    res.redirect('/');
                }
            } else {
                logger.info('Error while performing Query draw row.' + err);
            }
        });
    }
});

/*Déconnexion*/
app.get('/logout', function(req, res) {
    delete req.session.userId;
    delete req.session.email;
    delete req.session.firstname;
    delete req.session.lastname;
    delete req.session.color;
    delete req.session.profilPic;

    console.log(req.session);
    res.redirect('/login');
});


/*---------------------Admin-----------------------*/
/*Redirige sur la page admin*/
app.get('/admin', function(req, res) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'test',
        password: 'test',
        database: 'pictionnary'
    });
    connection.connect();
    connection.query("SELECT * FROM users", function (err, rows, fields) {

        if (!err) {
            if (rows.length > 0) {
                console.log('Find');
                console.log(rows);
                rows = rows[0];
                req.session.userId = rows['id'];
                req.session.email = req.body.email;
                req.session.firstname = rows['nom'];
                req.session.lastname = rows['prenom'];
                req.session.color = rows['couleur'];
                req.session.profilPic = rows['profilePic'];
                res.redirect('/main');
            } else {
                res.render('dashboard');
            }
        } else {
            console.log('Error while performing Query.' + err);
        }
    });
    connection.end();
});

app.listen(1234);



