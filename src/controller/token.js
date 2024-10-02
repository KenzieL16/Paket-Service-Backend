import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const refreshToken = async (req, res) => {
    const { refresh_token } = req.body;

    // Cek apakah refresh token ada
    if (!refresh_token) {
        return res.status(403).json({ success: false, message: 'Refresh token tidak tersedia' });
    }

    try {
        // Memverifikasi refresh token
        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);
        const user = {
            id: decoded.id,
            name: decoded.name,
            username: decoded.username,
            role: decoded.role,
            permissions: decoded.permissions || [], // Gunakan permissions jika ada
        };
        // Buat token akses baru
        const newAccessToken = jwt.sign(
            { id: user.id, name: user.name, username: user.username, role: user.role, permissions: user.permissions },
            process.env.ACCESS_TOKEN,
            { expiresIn: '5m' } // Atur waktu kadaluarsa sesuai kebutuhan
        );

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.error(error);
        return res.status(401).json({ success: false, message: 'Refresh token tidak valid' });
    }
};

export default {
    refreshToken,
};