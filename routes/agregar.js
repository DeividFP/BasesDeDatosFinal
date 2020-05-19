const express = require('express');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const nodemailer = require('nodemailer');
const funcs = require('../lib/funcs');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
const url = 'http://localhost:3000';

router.get('/usuario', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        let rol = await pool.query('SELECT * FROM rol');
        let carreer = await pool.query('SELECT * FROM carrera');
        let a_rol = Array.from(rol);
        let a_carreer = Array.from(carreer);
        res.render('agregar/usuario', { a_carreer, a_rol, isA });
    } else {
        res.redirect('/');
    }
});

router.post('/usuario', isLoggedIn, async(req, res) => {
    const { mat_bol, pape, sape, nombre, nac, nss, calle, next, nint, col, alc_mun, email, tel, usert, carrera } = req.body;
    const newLink = {
        mb: mat_bol,
        pri: pape,
        seg: sape,
        nom: nombre,
        f_nac: nac,
        nss,
        calle,
        exte: next,
        inte: nint,
        col,
        am: alc_mun,
        email,
        tel,
        rol: usert,
        carrera,
    };
    if ((mat_bol.length && pape.length && sape.length && nombre.length && nac.length && nss.length && calle.length && next.length && col.length && alc_mun.length && email.length && tel.length) > 0) {
        const mabo = await pool.query('SELECT * FROM registro WHERE mb = ?', [mat_bol]);
        const corr = await pool.query('SELECT * FROM registro WHERE email = ?', [email]);
        const nuss = await pool.query('SELECT * FROM registro WHERE nss = ?', [nss]);
        if (mabo.length > 0) {
            req.flash('error', 'Ya existe esa matrícula/boleta en el sistema');
            res.redirect('/agregar/usuario');
        } else if (corr.length > 0) {
            req.flash('error', 'Ya existe ese email en el sistema');
            res.redirect('/agregar/usuario');
        } else if (nuss.length > 0) {
            req.flash('error', 'Ya existe ese NSS en el sistema');
            res.redirect('/agregar/usuario');
        } else {

            let token = await helpers.generateToken();
            contentHTML = `
            <h2>Hola ${nombre} ingresa al siguiente <a href="${url}/pass/activar/?h=${token}&s=${mat_bol}">enlace</a> para activar tu cuenta</h2>
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
            await pool.query('INSERT INTO registro SET ?', [newLink]);
            let id_user = await pool.query('SELECT id FROM registro WHERE mb = ?', [mat_bol]);
            let id_usr = id_user[0].id;
            const usr = {
                id: id_usr,
                mb: mat_bol,
                pass: '',
                hashh: token,
                statuss: 1,
                rol: usert
            };
            await pool.query('INSERT INTO usr SET ?', [usr])
            req.flash('success', 'Usuario agregado correctamente');
            res.redirect('/agregar/usuario');
        }
    } else {
        req.flash('error', 'LLene todos los campos solicitados');
        res.redirect('/agregar/usuario');
    }
});

router.get('/material', isLoggedIn, (req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        res.render('agregar/material', { isA });
    } else {
        res.redirect('/');
    }
});

router.post('/material', isLoggedIn, async(req, res) => {
    const { sku, nombre, desc, precio, ingreso, fecha } = req.body;
    if ((sku.length && nombre.length && desc.length && precio.length && ingreso.length && fecha.length) > 0) {
        if (!isNaN(precio)) {
            newSku = sku.replace(/ /g, "");
            const newLink = {
                sku: newSku,
                nombre,
                descr: desc,
                costo: precio,
                tipo_ingreso: ingreso,
                fecha_ingreso: fecha,
                statuss: 2
            }
            await pool.query('INSERT INTO material SET ?', [newLink]);
            if (precio < 1) {
                req.flash('warning', 'Se agregó el material pero debe tener un precio válido');
            } else {
                req.flash('success', 'Se agregó el material correctamente');
            }
            res.redirect('/agregar/material');
        } else {
            req.flash('warning', 'Ingrese un precio válido');
            res.redirect('/agregar/material');
        }
    } else {
        req.flash('error', 'Todos los campos son requeridos')
        res.redirect('/agregar/material');
    }

});

router.get('/actividad', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol)
    if (isA) {
        let consulta = await pool.query('SELECT mb, pri, seg, nom FROM registro');
        let act = await pool.query('SELECT * FROM tipo_act');
        res.render('agregar/actividad', { consulta, act, isA });
    } else {
        res.redirect('/');
    }
});

router.post('/actividad', isLoggedIn, async(req, res) => {
    const { name, pla, ins, sku, cat, lu, luF, ma, maF, mi, miF, ju, juF, vi, viF } = req.body;
    let newAct = {
        cod: sku,
        descr: name,
        li: lu,
        lF: luF,
        mi: ma,
        mf: maF,
        mii: mi,
        mif: miF,
        ji: ju,
        jf: juF,
        vi,
        vf: viF,
        tipo: cat,
        prof: ins,
        lugar: pla
    }
    await pool.query('INSERT INTO actividad SET ?', [newAct]);
    req.flash('success', 'Actividad agregada');
    res.redirect('/agregar/actividad');
});

router.get('/A_actividad', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        let s = req.query.s;
        let u = req.query.u;
        let consulta = [];
        if (typeof u == 'undefined') {
            consulta = await pool.query('SELECT mb, pri, seg, nom FROM registro');
        } else {
            consulta = await pool.query(`SELECT mb, pri, seg, nom FROM registro WHERE (mb LIKE '%${u}%' OR pri LIKE '%${u}%' OR seg LIKE '%${u}%' OR nom LIKE '%${u}%')`);
        }
        for (let value of consulta) {
            value.s = s;
            let rows = await pool.query('SELECT * FROM inscritos WHERE id_mb = ? AND id_act = ?', [value.mb, s]);
            if (rows.length > 0) {
                value.insc = false;
            } else {
                value.insc = true;
            }
        }
        res.render('agregar/A_act', { consulta, s, isA });
    } else {
        res.redirect('/');
    }
});

router.post('/A_actividad', isLoggedIn, (req, res) => {
    const { u, s } = req.body;
    res.redirect(`/agregar/A_actividad/?s=${s}&u=${u}`);
});

router.post('/AA', isLoggedIn, async(req, res) => {
    const { cod, mb, cr } = req.body;
    let newLink = {
        id_mb: mb,
        id_act: cod
    }
    await pool.query('INSERT INTO inscritos SET ?', [newLink]);
    res.redirect(`/agregar/A_actividad/?s=${cod}`);
});

router.post('/creditos', isLoggedIn, async(req, res) => {
    const { c, m, cred } = req.body;
    await pool.query('UPDATE inscritos SET creditos = ? WHERE id_mb = ? AND id_act = ?', [cred, m, c]);
    res.redirect(`/ver/inscritos/?s=${c}`);
});

router.get('/prestamo', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        const sku = req.query.s;
        const u = req.query.u;

        if (typeof sku == 'undefined') {
            res.redirect('/');
        } else {
            if (typeof u == 'undefined') {
                let consulta = await pool.query('SELECT pri, seg, nom, mb FROM registro');
                for (let value of consulta) {
                    let stat = await pool.query('SELECT statuss FROM material WHERE sku = ?', [sku]);
                    value.sku = sku;
                    if (stat[0].statuss == 2) {
                        value.stat = true;
                    } else {
                        value.stat = false;
                    }
                }
                res.render('agregar/prestamo', { consulta, sku, isA });
            } else {
                let consulta = await pool.query(`SELECT pri, seg, nom, mb FROM registro WHERE mb LIKE '%${u}%'`);
                for (let value of consulta) {
                    let stat = await pool.query('SELECT statuss FROM material WHERE sku = ?', [sku]);
                    value.sku = sku;
                    if (stat[0].statuss == 2) {
                        value.stat = true;
                    } else {
                        value.stat = false;
                    }
                }
                res.render('agregar/prestamo', { consulta, sku, isA });
            }

        }
    } else {
        res.redirect('/');
    }

});

router.post('/prest', isLoggedIn, async(req, res) => {
    const { s } = req.body;
    if (await pool.query('UPDATE material SET statuss = 1 WHERE sku = ?', [s])) {

        req.flash('success', 'Artículo prestado');

    } else {
        req.flash('error', 'Ocurrió un error');
    }

    res.redirect('/ver/inventario');
});

router.post('/busq', isLoggedIn, async(req, res) => {
    let { s, u } = req.body;
    res.redirect(`/agregar/prestamo/?s=${s}&u=${u}`);
});

router.post('/devolver', isLoggedIn, async(req, res) => {
    const { id } = req.body;
    if (await pool.query('UPDATE material SET statuss = 2 WHERE sku = ?', [id])) {

        req.flash('success', 'Artículo devuelto');

    } else {
        req.flash('error', 'Ocurrió un error');
    }
    res.redirect('/ver/inventario');
});

module.exports = router;