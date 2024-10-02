import { fetchDataDetails, exportToExcel, exportToExcelLeader } from '../models/excelExportModel.js';

export const exportExcelReport = async (req, res) => {
    const kd_user = req.user.username;
    const name = req.user.name;
    try {
      console.log('User:', kd_user);
      const { startDate, endDate, sts_paket_service, nama_motor } = req.body;
  
      // Validasi input
      if (!kd_user || !startDate || !endDate) {
        return res.status(400).json({ error: 'Parameter kd_user, startDate, dan endDate diperlukan.' });
      }
  
      // Ambil data dari model
      const dataDetails = await fetchDataDetails(kd_user, startDate, endDate, sts_paket_service, nama_motor);
  
      // Buat file Excel
      const excelData = await exportToExcel(dataDetails, startDate, endDate);
  
      // Format tanggal untuk nama file
      const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
      const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
      const fileName = `report_${formattedStartDate}_to_${formattedEndDate}_${name}.xlsx`;
  
      // Kirim file Excel sebagai respons
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(excelData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Terjadi kesalahan saat mengekspor data ke Excel.' });
    }
  };
  
  export const exportExcelLeader = async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      // Validasi input parameter
      if (!startDate || !endDate) {
          return res.status(400).json({ message: 'Parameter startDate dan endDate diperlukan' });
      }

      // Panggil fungsi exportLeaderExcel dan dapatkan path file Excel
      const fileExcel = await exportToExcelLeader(startDate, endDate);

      // Format tanggal untuk nama file
      const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
      const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
      const fileName = `report ${formattedStartDate} to ${formattedEndDate}.xlsx`;

      // Kirim file Excel sebagai respons
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(fileExcel);
  
  } catch (error) {
      console.error('Error exporting leader Excel:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengekspor data' });
  }
};