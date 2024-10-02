import express from 'express';
import verifyToken from '../middleware/verifytoken.js';
import { exportExcelReport, exportExcelLeader } from '../controller/excelController.js';
const router = express.Router();

router.post('/export-excel', verifyToken, exportExcelReport);
router.post('/export-leader', verifyToken, exportExcelLeader);


export default router;