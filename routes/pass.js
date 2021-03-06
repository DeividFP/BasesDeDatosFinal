const express = require('express');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const nodemailer = require('nodemailer');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
const funcs = require('../lib/funcs');
const url = 'http://localhost:3000';

router.get('/activar', isNotLoggedIn, async(req, res) => {
    const hashh = req.query.h;
    const mb = req.query.s;
    if (hashh.length == 0) {
        res.redirect('/');
    } else {
        let datos = await pool.query('SELECT * FROM usr WHERE mb = ?', [mb]);
        if (datos[0].hashh != 0) {
            if (hashh.localeCompare(datos[0].hashh) == 0) {
                let role = datos[0].rol;
                const a_datos = Array.from(datos);
                var value = new Boolean(true);
                if (role == 2) {
                    value = true;
                } else {
                    value = false;
                }
                res.render('pass/activar', { a_datos, value });
            } else {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }

    }

});

router.post('/activar', async(req, res) => {
    const { mat_bol, pass1, pass2, ide, hash } = req.body;
    if ((pass1.length && pass2.length) > 0) {
        if (pass1.localeCompare(pass2) == 0) {
            let newPass = await helpers.encryptPassword(pass1);
            let newLink = {
                pass: newPass,
                hashh: '',
                statuss: 2
            }
            await pool.query('UPDATE usr set ? WHERE id = ? AND mb = ?', [newLink, ide, mat_bol]);
            req.flash('success', 'Por favor inicia sesión');
            res.redirect('/login');
        } else {
            req.flash('error', 'Las contraseñas no coinciden');
            res.redirect(`/pass/activar/?h=${hash}&s=${mat_bol}`);
        }
    } else {
        req.flash('error', 'Todos los campos son requeridos');
        res.redirect(`/pass/activar/?h=${hash}&s=${mat_bol}`);
    }

})

router.get('/actualizar', isLoggedIn, (req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    let isU = funcs.isUser(req.user.rol);
    res.render('pass/actualizar', { isA, isU });
});

router.post('/actualizar', isLoggedIn, async(req, res) => {
    const { pass1, pass2, pass3 } = req.body;
    if (pass1.length > 0 && pass2.length > 0 && pass3.length > 0) {
        if (pass1.localeCompare(pass2) == 0) {
            let rows = await pool.query('SELECT * FROM usr WHERE mb = ?', [req.user.mb]);
            //let mpass = await helpers.encryptPassword(pass3);
            let consulta = rows[0];
            let validatePassword = await helpers.matchPassword(pass3, consulta.pass);
            if (validatePassword) {
                let nPass = await helpers.encryptPassword(pass1);
                let newLink = {
                    pass: nPass
                }
                if (await pool.query('UPDATE usr SET ? WHERE mb = ?', [newLink, req.user.mb])) {
                    req.flash('success', 'Cambios guardados');
                    res.redirect('/');
                } else {
                    req.flash('success', 'Ocurrió un error');
                    res.redirect('/');
                }
            } else {
                req.flash('error', 'Contraseña incorrecta');
                res.redirect('/pass/actualizar');
            }
        } else {
            req.flash('error', 'Las contraseñas no coinciden');
            res.redirect('/pass/actualizar');
        }
    } else {
        req.flash('error', 'Todos los campos son obligatorios');
        res.redirect('/pass/actualizar');
    }
});

router.get('/recuperar', isNotLoggedIn, (req, res) => {
    res.render('pass/recuperar');
});

router.post('/recuperar', async(req, res) => {
    const { email } = req.body;
    let token = helpers.generateToken();
    let PR = Math.floor(Math.random() * ((10000000) - 10000) + 10000).toString();
    contentHTML = `
            <h2>Hola Tu contraseña temporal es: </h2>
            <h1> ${PR} </h1>
            <h2>Por favor actualízala lo antes posible <h2>
            `
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'pruebas.dfp.ipn@gmail.com',
            pass: '$passw@648'
        }
    });

    let mailOptions = {
        from: 'Sistema de administración Cultural y Deportiva UPIITA - IPN',
        to: `${email}`,
        subject: 'Asunto',
        html: contentHTML
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        }
    });

    let consulta = await pool.query('SELECT mb FROM registro WHERE email = ?', [email]);
    if (consulta.length > 0) {
        let nPa = await helpers.encryptPassword(PR);
        if (await pool.query('UPDATE usr SET pass = ? WHERE mb = ?', [nPa, consulta[0].mb])) {
            req.flash('success', 'Se envió un correo electrónico');
            res.redirect('/login');
        } else {
            req.flash('error', 'Ocurrió un error');
            res.redirect('/login');
        }
    } else {
        req.flash('error', 'No está registrado ese correo electrónico');
        res.redirect('/login');
    }


});

module.exports = router;