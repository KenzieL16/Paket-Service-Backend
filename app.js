import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 3004;
import cors from 'cors';
import express from 'express';
const app = express();

app.use(cors({
    origin: ['http://192.168.70.17:8080','http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Headers','mst','sts_paket_service','no_mesin']
}));

import users_routes from "./src/routes/users.js";
import data_customer_routes from "./src/routes/data_customer.js";
import token from "./src/routes/token.js";
import excelReport from './src/routes/excelReport.js';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get('/', (req, res)=> {
    res.send('Hello World!');
});
app.use('/data_customer', data_customer_routes);
app.use('/users', users_routes);
app.use('/token-refresh', token);
app.use('/excel', excelReport);

app.listen(PORT, () => {
    console.log(`Berhasil Running Server ${PORT}!`);
});