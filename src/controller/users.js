import UsersModel from '../models/users.js'

const getAllUsers = async (req, res) => {
    try {
        const users = await UsersModel.getUsers();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving users' });
    }
}

const login = async (req, res) => {
    const { username, password } = req.body;   
    try {
        const data = await UsersModel.login(username, password);
        res.status(200).json({ success: true,message: 'Berhasil Login' , data: data});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message});
    }
}


export default {
    getAllUsers,
    login
};