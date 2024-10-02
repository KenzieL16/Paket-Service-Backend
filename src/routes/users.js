import express from 'express';
import users from '../controller/users.js';
const router = express.Router();

router.get('/', users.getAllUsers);
router.post('/login', users.login);

export default router;