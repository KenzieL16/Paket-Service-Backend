import { db, dbLogin, dbKota} from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const getUsers = async  () => {

    try{
        const [rows] = await dbLogin.execute(`SELECT * FROM mst_users`);
        return rows;
    } catch (error) {
        throw error;
    }
}

const login = async (username, password) => {

    const loginquery = `SELECT * FROM mst_users WHERE username = ? LIMIT 1`;

    const [rows] = await dbLogin.execute(loginquery, [username]);
    const user = rows[0] 
    const valid = await bcrypt.compare(password, user.password2)
    console.log("ini valid ", valid)
    if (!valid) {
        throw new Error('Invalid username or password');
    }

    const datausersQuery = `
    SELECT 
        u.id, 
        u.name, 
        u.username, 
        u.role_id, 
        p.name AS permission_name 
    FROM 
        mst_users u
    JOIN 
        mst_permissions p ON u.role_id = p.role_id 
    WHERE 
        u.username = ?
`;
const [datausers] = await dbLogin.execute(datausersQuery, [username]);
const result = {
    id: datausers[0].id,
    name: datausers[0].name,
    username: datausers[0].username,
    role_id: datausers[0].role_id,
    permissions: datausers.map(user => user.permission_name).filter(name => name),
};

    const accessToken = jwt.sign(
        { id: user.id, name: user.name, username: user.username, role : user.role, permissions: result.permissions},
        process.env.ACCESS_TOKEN,
        { expiresIn: '5m' } 
    );

    const refreshToken = jwt.sign(
        { id: user.id, name: user.name, username: user.username, role : user.role, permissions: result.permissions},
        process.env.REFRESH_TOKEN,
        { expiresIn: '1d' }
    );

    return {
        accessToken,
        refreshToken,
        datausers : result
    };
}

export default {
    getUsers,
    login,
};