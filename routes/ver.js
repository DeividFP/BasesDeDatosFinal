const express = require('express');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const funcs = require('../lib/funcs');
const { isLoggedIn } = require('../lib/auth');

router.get('/inventario', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        const u = req.query.u;
        const v = req.query.v;
        if ((typeof u && typeof v) == 'undefined') {
            let inv = await pool.query('SELECT * FROM material');
            inv = funcs.InDate(inv);
            for (let value of inv) {
                if (value.statuss == 2) {
                    value.s = 'DISPONIBLE';
                    value.stat = true;
                } else {
                    value.s = 'EN PRÉSTAMO';
                    value.stat = false;
                }
            }
            res.render('ver/inventario', { inv, isA });
        } else {
            if (typeof v == 'undefined') {

                let inv = await pool.query(`SELECT * FROM material WHERE sku LIKE '%${u}%' OR nombre LIKE '%${u}%' OR descr LIKE '%${u}%' `);
                inv = funcs.InDate(inv);
                for (let value of inv) {
                    if (value.statuss == 2) {
                        value.s = 'DISPONIBLE';
                        value.stat = true;
                    } else {
                        value.s = 'EN PRÉSTAMO';
                        value.stat = false;
                    }
                }
                res.render('ver/inventario', { inv, isA });


            } else {
                let inv = await pool.query('SELECT * FROM material WHERE statuss = ?', [v]);
                inv = funcs.InDate(inv);
                for (let value of inv) {
                    if (value.statuss == 2) {
                        value.s = 'DISPONIBLE';
                        value.stat = true;
                    } else {
                        value.s = 'EN PRÉSTAMO';
                        value.stat = false;
                    }
                }
                res.render('ver/inventario', { inv, isA });
            }
        }

    } else {
        res.redirect('/');
    }

});

router.post('/busq', isLoggedIn, (req, res) => {
    const { v, b } = req.body;
    if (typeof v == 'undefined') {
        if (b.length < 1) {
            res.redirect('/ver/inventario');
        } else {
            res.redirect(`/ver/inventario/?b=${b}`);
        }
    } else {
        res.redirect(`/ver/inventario/?v=${v}`);
    }


});

router.post('/a_busq', isLoggedIn, (req, res) => {
    const { v, b } = req.body;
    if (typeof v == 'undefined') {
        if (b.length < 1) {
            res.redirect('/ver/actividades');
        } else {
            res.redirect(`/ver/actividades/?b=${b}`);
        }
    } else {
        res.redirect(`/ver/actividades/?v=${v}`);
    }


});

router.get('/usuarios', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {

        let consulta = await pool.query('SELECT usr.mb, statuss, nom, pri, seg FROM usr join registro on usr.mb = registro.mb');
        let stat = [];
        for (let value of consulta) {
            if (value.statuss != 1) {
                value.statuss = true;
            } else {
                value.statuss = false;
            }

        }
        res.render('ver/usuarios', { consulta, isA });
    } else {
        res.redirect('/');
    }
});

router.get('/datos/usuario', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    let isU = funcs.isUser(req.user.rol);
    let mb = req.query.s;
    let crd = 0;
    if (typeof mb == 'undefined') {
        let consulta = await pool.query('SELECT * FROM registro WHERE mb = ?', [req.user.mb]);
        let cred = await pool.query('SELECT creditos FROM inscritos WHERE id_mb = ?', [req.user.mb]);
        for (let value of cred) {
            crd = crd + value.creditos;
        }
        res.render('ver/datUsers', { consulta, crd, isU, isA });
    } else {
        let consulta = await pool.query('SELECT * FROM registro WHERE mb = ?', [mb]);
        let cred = await pool.query('SELECT creditos FROM inscritos WHERE id_mb = ?', [mb]);
        for (let value of cred) {
            crd = crd + value.creditos;
        }
        res.render('ver/datUsers', { consulta, crd, isU, isA });
    }

});

router.get('/actividades', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        const v = req.query.v,
            b = req.query.b;
        if (typeof v == 'undefined' && typeof b == 'undefined') {
            let consulta = await pool.query('SELECT * FROM actividad');
            for (let value of consulta) {
                let ins = await pool.query('SELECT * FROM inscritos WHERE id_act = ?', [value.cod]);
                value.in = ins.length;
            }
            res.render('ver/act', { consulta, isA });
        } else {
            if (typeof v == 'undefined') {
                let consulta = await pool.query(`SELECT * FROM actividad WHERE cod LIKE '%${b}%' OR descr LIKE '%${b}%'`);
                for (let value of consulta) {
                    let ins = await pool.query('SELECT * FROM inscritos WHERE id_act = ?', [value.cod]);
                    value.in = ins.length;
                }
                res.render('ver/act', { consulta, isA });
            } else {
                let consulta = await pool.query('SELECT * FROM actividad WHERE tipo = ?', [v]);
                for (let value of consulta) {
                    let ins = await pool.query('SELECT * FROM inscritos WHERE id_act = ?', [value.cod]);
                    value.in = ins.length;
                }
                res.render('ver/act', { consulta, isA });

            }
        }
    } else {
        res.redirect('/');
    }

});

router.get('/inscritos', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        let cod = req.query.s;
        let consulta = await pool.query('SELECT id_mb, pri, seg, nom, creditos FROM inscritos join registro ON id_act = ? AND inscritos.id_mb = registro.mb', [cod]);
        for (let value of consulta) {
            value.cod = cod;
        }
        res.render('ver/inscritos', { consulta, cod, isA });
    } else {
        res.redirect('/');
    }
});

router.get('/in_cursos', isLoggedIn, async(req, res) => {
    let aux = [];
    let isU = funcs.isUser(req.user.rol)
    if (isU) {
        let consulta = await pool.query('SELECT descr, lugar, li, lf, mi, mf, mii, mif, ji, jf, vi, vf, creditos FROM inscritos join actividad ON inscritos.id_act = actividad.cod AND inscritos.id_mb = ?', [req.user.mb]);
        res.render('ver/in_cursos', { isU, consulta });
    } else {
        res.redirect('/');
    }
});

router.get('/im_cursos', isLoggedIn, async(req, res) => {
    let isU = funcs.isUser(req.user.rol)
    if (isU) {
        let consulta = await pool.query('SELECT cod, descr, lugar, li, lf, mi, mf, mii, mif, ji, jf, vi, vf FROM actividad WHERE prof = ?', [req.user.mb]);
        for (let value of consulta) {
            let ins = await pool.query('SELECT * FROM inscritos WHERE id_act = ?', [value.cod]);
            value.inscritos = ins.length;
        }
        res.render('ver/im_cursos', { isU, consulta });
    } else {
        res.redirect('/');
    }
});

module.exports = router;