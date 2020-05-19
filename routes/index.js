const express = require('express');
const router = express.Router();
const pool = require('../database');
const funcs = require('../lib/funcs');
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');

router.get('/', isLoggedIn, function(req, res, next) {
    let isA = funcs.isAdmin(req.user.rol);
    let isU = funcs.isUser(req.user.rol);
    res.render('index', { isA, isU });

});

router.post('/resultados', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        const { buscador } = req.body;
        let usr = await pool.query(`SELECT registro.mb, pri, seg, nom, statuss FROM registro join usr on (usr.mb like '%${buscador}%' OR pri like '%${buscador}%' OR seg like '%${buscador}%' OR nom like '%${buscador}%') AND usr.mb=registro.mb`);
        let mat = await pool.query(`SELECT * FROM material WHERE (sku like '%${buscador}%' OR nombre like '%${buscador}%' OR descr like '%${buscador}%')`);
        let act = await pool.query(`SELECT * FROM actividad WHERE (cod like '%${buscador}%' OR descr like '%${buscador}%' OR prof like '%${buscador}%')`);
        for (let value of act) {
            let rows = await pool.query('SELECT * FROM inscritos WHERE id_act = ?', [value.cod]);
            value.in = rows.length;
        }
        mat = funcs.InDate(mat);
        var Susr = false;
        var Smat = false;
        var Sact = false;
        if (usr.length > 0) {
            Susr = true
        }
        if (mat.length > 0) {
            Smat = true
        }
        if (act.length > 0) {
            Sact = true
        }
        for (let value of usr) {
            if (value.statuss != 1) {
                value.estat = true;
            } else {
                value.estat = false;
            }

        }
        for (let value of mat) {
            if (value.statuss == 1) {
                value.s = 'DISPONIBLE';
                value.statuss = true;
            } else {
                value.s = 'EN PRÉSTAMO';
                value.statuss = false;
            }
        }
        res.render('resultados', { usr, mat, Susr, Smat, act, Sact, isA });
    } else {
        res.redirect('/');
    }
});

router.get('/login', isNotLoggedIn, (req, res) => {
    res.render('auth/login');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local.signin', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next)
});

router.post('/logout', isLoggedIn, (req, res) => {
    req.logOut();
    res.redirect('/login');
});

module.exports = router;