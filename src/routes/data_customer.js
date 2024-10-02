import express from 'express';
import data_customer_controller from '../controller/data_customer.js';
import verifyToken from '../middleware/verifytoken.js';


const router = express.Router();

// Urutkan rute dari yang paling spesifik ke yang paling umum
router.post('/home-data', verifyToken, data_customer_controller.gethomeData);
router.post('/home-leader', verifyToken, data_customer_controller.gethomeLeader)
router.post('/:no_mesin/update', verifyToken, data_customer_controller.updateData);
router.post('/lov', verifyToken, data_customer_controller.getLovCust);
router.get('/list_data', verifyToken, data_customer_controller.getListData);
router.post('/details', verifyToken, data_customer_controller.Details);
router.post('/:no_mesin/ambil-data', verifyToken, data_customer_controller.ambilData);
router.get('/mst', data_customer_controller.mstKode);
router.get('/kota', data_customer_controller.kota);



export default router;
