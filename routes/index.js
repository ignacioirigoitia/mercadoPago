var express = require('express');
var router = express.Router();

const {index} = require('../controllers/indexController');
const  {agregarItem,quitarItem,mostrarCarrito, vaciarCarrito} = require('../controllers/carritoController');
const {finalizarCompra,response,notifications} = require('../controllers/mercadoController');
router.get('/',index);
router.get('/agregar/:id',agregarItem);
router.get('/quitar/:id',quitarItem);
router.get('/listar',mostrarCarrito);
router.get('/vaciar',vaciarCarrito);


router.get('/compra',finalizarCompra);
router.get('/response',response);

router.post('/notifications',notifications)

module.exports = router