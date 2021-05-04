const db = require('../database/models')

const verificar = (carrito,id) => {
    let pos = -1
    for (let i = 0; i < carrito.length; i++) {
        
        if(carrito[i].id == id){
            pos = i
            break
        }
    }
    return pos
}

module.exports = {
    agregarItem : (req,res) => {
        let carrito = req.session.carrito;
        let id = req.params.id

        db.Product.findOne({
            where : {
                id
            },
            include : [
                {association : 'imagenes'}
            ]
        })
        .then(producto => {
            if(producto){
                let pos = verificar(carrito,id)

                if(pos === -1){
                    let item = {
                        id : producto.id,
                        nombre : producto.nombre,
                        image : producto.imagenes[0].link,
                        precio : producto.precio,
                        cantidad : 1,
                        total : producto.precio
                    }
                    carrito.push(item)

                    if(req.session.userLogin){
                        db.Order.findOne({
                            where : {
                                userId : req.session.userLogin.id,
                                status : 'pending'
                            }
                        })
                        .then(order => {
                            if(order){
                                db.Cart.create({
                                    userId : order.userId,
                                    productId : producto.id,
                                    cantidad : 1,
                                    orderId : order.id
                                })
                            }else{
                                db.Order.create({
                                    userId : req.session.userLogin.id,
                                    status : 'pending'
                                })
                                .then(order => {
                                    db.Cart.create({
                                        userId : order.userId,
                                        productId : producto.id,
                                        cantidad : 1,
                                        orderId : order.id
                                    })
                                })
                            }
                        })
                        .catch(error => console.log(error))
                    }
                
                }else{
                    let item = carrito[pos];
                    item.cantidad = item.cantidad + 1;
                    item.total = item.cantidad * item.precio;
                    carrito[pos] = item

                    if(req.session.userLogin){
                        db.Cart.update(
                            {
                                cantidad : item.cantidad
                            },
                            {
                                where : {
                                    productId : item.id,
                                    userId : req.session.userLogin.id
                                }
                            }
                        )
                        .then(()=>console.log('cantidad incrementada'))
                        .catch(error => console.log(error))
                    }
                }

                req.session.carrito = carrito

                return res.status(200).json(req.session.carrito)
            }
        })

    },
    quitarItem : (req,res) => {
        let carrito = req.session.carrito;
        let id = req.params.id;
        let pos = verificar(carrito,id);

        // busco el item que corresponda a la posición
        let item = carrito[pos]

        //chequeo la cantidad
        if(item.cantidad > 1){
            item.cantidad = item.cantidad - 1;
            item.total = item.cantidad * item.precio;
            carrito[pos] = item;
            req.session.carrito = carrito;
            res.status(200).json(req.session.carrito)
            if(req.session.userLogin){
                db.Cart.update(
                    {   
                        cantidad : item.cantidad                   
                    },
                    {
                        where : {
                            userId : req.session.userLogin.id,
                            productId : item.id
                        }
                    }
                )
                .then(()=>console.log('cantidad decrementada'))
                .catch(error => console.log(error))
            }
        }else{
            carrito.splice(item,1)
            req.session.carrito = carrito;
            res.status(200).json(req.session.carrito)

            if(req.session.userLogin){
                db.Order.findOne({
                    where : {
                        userId : req.session.userLogin.id,
                        status : 'pending'
                    },
                    include : [
                        {association : 'carrito'}
                    ]
                })
                .then(order => {
                    if(order.carrito.length > 0){
                        db.Order.destroy({
                            where : {
                                id : order.id
                            }
                        })
                    }else{
                        db.Cart.destroy(
                            {
                                where : {
                                    userId : req.session.userLogin.id,
                                    productId : item.id
                                }
                            }
                        )
                        .then(()=>console.log('item eliminado del carrito'))
                    }
                })
                .catch(error => console.log(error))
            }
        }   
    },
    mostrarCarrito : (req,res) => {

        return res.status(200).json(req.session.carrito)

    },
    vaciarCarrito : (req,res) => {
        if(req.session.userLogin){
            console.log(req.session.carrito)
            db.Order.destroy({
                where : {
                    id : req.session.carrito[0].orderId,
                    userId : req.session.userLogin.id
                }
            })
            .then( () => console.log('carrito vaciado'))
            .catch( error => console.log(error))
        }


        req.session.carrito = []
        return res.status(200).json(req.session.carrito)

    }
}