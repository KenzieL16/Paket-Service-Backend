import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const verifyToken = (req, res, next) => {
    // Mengambil token dari header
    const token = req.headers['authorization']?.split(' ')[1];
    // Jika token tidak ada, kirim respons error
    if (!token) {
        return res.status(403).json({ success: false, message: 'Token tidak tersedia' });
    }

    try {
        // Memverifikasi token menggunakan secret key
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        // Menyimpan data pengguna yang didecode ke dalam request object
        req.user = {
            id: decoded.id,
            name: decoded.name,
            username: decoded.username,
            role: decoded.role,
            permissions: decoded.permissions || [], // Ensure permissions are included
        };
        // Melanjutkan ke middleware berikutnya
        next();
    } catch (error) {
        res.status(403).json({ success: false, message: 'token tidak valid' });
    }
};



export default verifyToken;
