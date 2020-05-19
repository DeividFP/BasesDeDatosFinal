const express = require('express');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const nodemailer = require('nodemailer');
const funcs = require('../lib/funcs');
const { isLoggedIn } = require('../lib/auth');

router.get('/material', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        const sku = req.query.s;
        let consulta = await pool.query('SELECT * FROM material WHERE sku = ?', [sku]);
        consulta = funcs.InDate(consulta);
        res.render('editar/material.hbs', { consulta, isA });
    } else {
        res.redirect('/');
    }
});

router.post('/material', isLoggedIn, async(req, res) => {
    const sku = req.query.s;
    const { nombre, desc, precio, ingreso, fecha } = req.body;
    if ((nombre.length && desc.length && precio.length && ingreso.length) > 0) {
        if (!isNaN(precio)) {
            const newLink = {
                nombre,
                descr: desc,
                costo: precio,
                tipo_ingreso: ingreso,
                fecha_ingreso: fecha
            }
            await pool.query('UPDATE material SET ? WHERE sku = ?', [newLink, sku]);
            req.flash('success', 'Se editó correctamente');
            res.redirect('/ver/inventario');
        }
    } else {
        req.flash('error', 'Todos los campos son requeridos')
        res.redirect(`/editar/material/?s=${sku}`);
    }
});


router.get('/horario', isLoggedIn, async(req, res) => {
    let isA = funcs.isAdmin(req.user.rol);
    if (isA) {
        const cod = req.query.s;
        let consulta = await pool.query('SELECT * FROM actividad WHERE cod = ?', [cod]);
        for (let value of consulta) {
            if (value.tipo == 1) {
                value.t = 'DEPORTIVA';
            } else {
                value.t = 'CULTURAL';
            }
        }
        res.render('editar/horario', { consulta, isA });
    } else {
        res.redirect('/');
    }
});

router.post('/horario', isLoggedIn, async(req, res) => {
    const { lu, luF, ma, maF, mi, miF, ju, juF, vi, viF, act } = req.body;
    const newLink = {
        li: lu,
        lf: luF,
        mi: ma,
        mf: maF,
        mii: mi,
        mif: miF,
        ji: ju,
        jf: juF,
        vi,
        vf: viF
    }
    let consulta = await pool.query('UPDATE actividad SET ? WHERE cod = ?', [newLink, act]);
    if (consulta) {
        req.flash('success', 'Se modicó el horario');
        res.redirect('/ver/actividades');
    } else {
        req.flash('error', 'Ocurrió un error');
        res.redirect('/ver/actividades');
    }
});

module.exports = router