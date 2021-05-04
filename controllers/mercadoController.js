const mercadopago = require('mercadopago');
const db = require('../database/models');

mercadopago.configure({
    access_token : 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398',
    integrator_id : 'dev_24c65fb163bf11ea96500242ac130004'   
})

module.exports = {
    finalizarCompra : (req,res) => {
        /* productos */
        let items = [];
        let carrito = req.session.carrito;
        carrito.forEach(producto => {
            let item = {
                id : producto.id,
                picture_url : producto.image,
                title : producto.nombre,
                unit_price : producto.precio,
                quantity : producto.cantidad
            }
            items.push(item)
        })

        /* comprador */
        db.User.findOne({
            where : {
                id : req.session.userLogin.id
            },
            iclude : [
                {association : 'domicilio'}
            ]
        })
        .then(user => {
            req.session.payer = {
                first_name : user.name,
                last_name : user.lastName, //añadir a la base de datos!!!
                email : user.email,
                phone : {

                },
                address : {
                    /* street_name: user.domicilio.calle,
                    street_number: user.domicilio.numero,
                    zip_code: user.domicilio.cp */
                }
            } 
        })
        .catch(error => console.log(error))

        const host = 'localhost:' + process.env.PORT;

        const url = host + '/response?status='

        let preference = {
            back_urls : {
                success : url + 'success',
                pending : url + 'pending',
                failure : url + 'failure'
            },
            auto_return : 'approved',
            notification_url : host + '/notifications',
            items,
            payment_methods : {
                installments : 12
            },
            payer : req.session.payer,
            external_reference: 'Orden compra'
        }

        mercadopago.preferences.create(preference)
        .then(function(response){
            console.log(response)
            global.id = response.body.id;
            global.init_point = response.body.init_point
            return res.render('compra')
        })
        .catch(error => console.log(error))

    },
    response : (req,res) => {
        if(req.query.status.includes('success')){

            return res.render('success')
        }
        if(req.query.status.includes('pending')){

            return res.render('pending')
        }
        if(req.query.status.includes('failure')){

            return res.render('failure')
        }
    },
    notifications : (req,res) => {
        res.status(200).end('ok')
    }
}