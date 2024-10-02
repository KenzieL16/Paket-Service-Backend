import express from 'express';
import token from '../controller/token.js';
const router = express.Router();

router.post('/', token.refreshToken);

export default router;