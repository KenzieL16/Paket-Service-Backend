import dataUserModel from '../models/data_customer.js'

const getLovCust = async (req, res) => {
    try {
        const users = await dataUserModel.getLovCust();

        if (users.length === 0) {
            res.status(404).json({ message: 'Data tidak ditemukan' });
        } else {
            res.json(users);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving users' });
    }
};

async function ambilData (req, res) {
    const { no_mesin } = req.params;
    const kd_user = req.user.username;
    try {
        const data = await dataUserModel.ambilData(no_mesin, kd_user);
        res.status(200).json({ success: true,message: 'Data Berhasil Diambil' , data: data});
    } catch (error) {
        console.error(error);
        // Cek pesan error untuk menentukan respons yang tepat
        if (error.message === 'Data sudah diambil') {
            res.status(400).json({ message: 'Data sudah diambil' }); // Status 400 Bad Request
        } else {
            res.status(500).json({ message: 'Gagal Mengambil Data' }); // Status 500 Internal Server Error
        }
    }
}

const getListData = async (req, res) => {
    const kd_user = req.user.username;
    const { sts_paket_service } = req.headers;
    try {
        const data = await dataUserModel.getListData(kd_user, sts_paket_service);
        res.status(200).json({ success: true,message: 'Data Berhasil Diambil' , data: data});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving users' });
    }
};

const Details = async (req, res) => {
    const kd_user = req.user.username;
    const { no_mesin } = req.headers;   
    try {
        const data = await dataUserModel.Details(kd_user, no_mesin);
        res.status(200).json({ success: true,message: 'Data Berhasil Diambil' , data: data});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving users' });
    }
};

const mstKode = async (req, res) => {
    const { mst } = req.headers;
    try {
        const data = await dataUserModel.mstKode(mst);
        res.status(200).json({ success: true,message: 'Data Berhasil Diambil' , data: data});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving data' });
    }
};

const updateData = async (req, res) => {
    const data = req.body;
    const { no_mesin } = req.params;

    try {

        if (!no_mesin || !data) {
            return res.status(400).json({ success: false, message: 'No_mesin atau data tidak ditemukan' });
        }
        // Mengambil data setelah update
        const update = await dataUserModel.updateData(no_mesin, data);
        // Jika data ditemukan, kirimkan response sukses
        return res.status(200).json({ success: true, message: 'Berhasil Update Data', data: update });

    } catch (error) {
        // Log error dan kirimkan respons error
        console.error(error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memperbarui data' });
    }
};

const kota = async (req, res) => {
    try {
        const data = await dataUserModel.kota();
        res.status(200).json({ success: true,message: 'Data Berhasil Diambil' , data: data});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving data' });
    }
};


const gethomeData = async (req, res) => {
    const kd_user = req.user.username;
    const {startDate, endDate, sts_paket_service} = req.body;
    try {
        const data = await dataUserModel.homeData(kd_user, startDate, endDate, sts_paket_service);
        res.status(200).json({ success: true,message: 'Data Berhasil Diambil' , data: data});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving users' });
    }
};

const gethomeLeader = async (req, res) => {
    const {startDate, endDate} = req.body;
    try {
        const data = await dataUserModel.homeLeader(startDate, endDate);
        res.status(200).json({ success: true,message: 'Data Berhasil Diambil' , data: data});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving users' });
    }
};


export default {
    getLovCust,
    ambilData,
    getListData,
    Details,
    mstKode,
    updateData,
    kota,
    gethomeData,
    gethomeLeader
}