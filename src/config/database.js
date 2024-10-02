import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const dbpool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
const dblogin = mysql.createPool({
    host: process.env.DB_HOST2,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME2,
});
const dbkota = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME3,
});

export const db = dbpool.promise();
export const dbLogin = dblogin.promise();
export const dbKota = dbkota.promise();