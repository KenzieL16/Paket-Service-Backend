import dotenv from "dotenv";
import { db, dbLogin, dbKota } from "../config/database.js";
dotenv.config();

const getLovCust = async () => {
  try {
    const [rows] = await db.execute(`
            SELECT no_mesin, nama_customer, nama_motor 
            FROM dwh 
            WHERE (sts_paket_service IS NULL OR sts_paket_service = '') 
            AND (kd_user IS NULL OR kd_user = '')
        `);
    return rows;
  } catch (error) {
    throw error;
  }
};

const formatDate = (date) => {
  // Mengubah tanggal menjadi format YYYY-MM-DD
  return date.toISOString().split("T")[0];
};

const ambilData = async (no_mesin, kd_user) => {
  try {
    // Cek apakah kd_user sudah diisi
    const checkQuery = `SELECT kd_user, nama_motor FROM dwh WHERE no_mesin = ?`;
    const [rows] = await db.execute(checkQuery, [no_mesin]);

    // Jika kd_user sudah diisi, lempar error
    if (rows.length > 0 && rows[0].kd_user) {
      throw new Error("Data sudah diambil");
    }

    // Query untuk cek kesamaan nama_motor di tabel dwh dan name di tabel mst_produk
    const motorQuery = `
            SELECT id 
            FROM mst_produk 
            WHERE UPPER(?) LIKE CONCAT('%', UPPER(name), '%')
        `;
    const [motorRows] = await db.execute(motorQuery, [rows[0].nama_motor]);

    let id_produk = null;
    if (motorRows.length > 0) {
      id_produk = motorRows[0].id; // Ambil id produk jika ada kecocokan
    }

    // Ambil tanggal dan waktu saat ini dalam format yang sesuai untuk database MySQL
    const currentDate = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Update kolom kd_user, tgl_call_tele, dan jenis_produk
    const updateQuery = `
            UPDATE dwh 
            SET kd_user = ?, tgl_call_tele = ?, jenis_produk = ?, sts_paket_service = 'P'
            WHERE no_mesin = ?
        `;
    await db.execute(updateQuery, [kd_user, currentDate, id_produk, no_mesin]);

    // Ambil data berdasarkan no_mesin dan kd_user yang baru saja diperbarui
    const selectQuery = `
            SELECT no_mesin, nik, nama_customer, nama_motor, no_telp, no_telp2, sts_paket_service, tgl_call_tele, tgl_faktur, alasan_pending, alasan_tidak_minat, kd_dealer, nama_dealer, kode_pos, provinsi, kota, kecamatan, kelurahan, alamat, jenis_produk, sts_bayar, tgl_bayar 
            FROM dwh 
            WHERE no_mesin = ? AND kd_user = ?
        `;
    const [rowsData] = await db.execute(selectQuery, [no_mesin, kd_user]);

    // Function to convert UTC date to local date string in yyyy-MM-dd format
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Month starts from 0
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const formattedData = rowsData.map((row) => ({
      ...row,
      tgl_call_tele: row.tgl_call_tele ? formatDate(row.tgl_call_tele) : null,
      tgl_faktur: row.tgl_faktur ? formatDate(row.tgl_faktur) : null,
      tgl_bayar: row.tgl_bayar ? formatDate(row.tgl_bayar) : null,
    }));

    return formattedData;
  } catch (error) {
    throw error;
  }
};

const getListData = async (kd_user, sts_paket_service) => {
  try {
    // Query to get the list of data
    const selectQuery = `
            SELECT no_mesin, nama_customer, nama_motor 
            FROM dwh 
            WHERE sts_paket_service = ? AND kd_user = ?
            ORDER BY tgl_call_tele DESC
        `;
    const [rowsData] = await db.execute(selectQuery, [
      sts_paket_service,
      kd_user,
    ]);

    // Query to count the total number of records
    const countQuery = `
            SELECT COUNT(*) AS total 
            FROM dwh 
            WHERE sts_paket_service = ? AND kd_user = ?
        `;
    const [countResult] = await db.execute(countQuery, [
      sts_paket_service,
      kd_user,
    ]);
    const totalCount = countResult[0].total;

    // Return both the list of data and the total count
    return {
      jumlah_data: totalCount,
      data: rowsData,
    };
  } catch (error) {
    throw error;
  }
};

const Details = async (kd_user, no_mesin) => {
  try {
    // Ambil data berdasarkan no_mesin dan kd_user yang baru saja diperbarui
    const selectQuery = `
            SELECT no_mesin, nik, nama_customer, nama_motor, no_telp, no_telp2, sts_paket_service, tgl_call_tele, tgl_faktur, alasan_pending, alasan_tidak_minat, kd_dealer, nama_dealer, kode_pos, provinsi, kota, kecamatan, kelurahan, alamat, jenis_produk, sts_bayar, tgl_bayar 
            FROM dwh 
            WHERE no_mesin = ? AND kd_user = ?
        `;
    const [rowsData] = await db.execute(selectQuery, [no_mesin, kd_user]);

    const formattedData = rowsData.map((row) => ({
      ...row,
      tgl_call_tele: row.tgl_call_tele
        ? formatDate(new Date(row.tgl_call_tele))
        : null,
      tgl_faktur: row.tgl_faktur ? formatDate(new Date(row.tgl_faktur)) : null,
      tgl_bayar: row.tgl_bayar ? formatDate(new Date(row.tgl_bayar)) : null,
    }));

    return formattedData;
  } catch (error) {
    throw error;
  }
};

const mstKode = async (mst) => {
  try {
    let query;
    if (mst === "pending") {
      // Query untuk alasanPending
      query = `SELECT * FROM mst_alasan_pending`;
    } else if (mst === "tidak_minat") {
      // Query untuk alasanTidakMinat
      query = `SELECT * FROM mst_alasan_tdk_berminat`;
    } else if (mst === "produk") {
      // Query untuk alasanTidakMinat
      query = `SELECT * FROM mst_produk`;
    } else {
      throw new Error("Invalid mst value");
    }

    const [results] = await db.execute(query);
    return results;
  } catch (error) {
    throw error;
  }
};

const updateData = async (no_mesin, data) => {
  try {
    // SQL query untuk memperbarui semua field di tabel dwh
    const updateQuery = `
            UPDATE dwh
            SET nik = ?,
                no_telp2 = ?, 
                sts_paket_service = ?, 
                tgl_call_tele = ?, 
                alasan_pending = ?, 
                alasan_tidak_minat = ?, 
                kode_pos = ?, 
                provinsi = ?, 
                kota = ?, 
                kecamatan = ?, 
                kelurahan = ?, 
                alamat = ?, 
                jenis_produk = ?, 
                sts_bayar = ?, 
                tgl_bayar = ?,
                modified = NOW()
            WHERE no_mesin = ?
        `;

    // Eksekusi query dengan data dari request body
    const result = await db.execute(updateQuery, [
      data.nik || null,
      data.no_telp2 || null,
      data.sts_paket_service || null,
      data.tgl_call_tele || null,
      data.alasan_pending || null,
      data.alasan_tidak_minat || null,
      data.kode_pos || null,
      data.provinsi || null,
      data.kota || null,
      data.kecamatan || null,
      data.kelurahan || null,
      data.alamat || null,
      data.jenis_produk || null,
      data.sts_bayar || null,
      data.tgl_bayar || null,
      no_mesin,
    ]);
    // Cek jika baris yang di-update ada
    if (result.affectedRows === 0) {
      console.warn("Tidak ada data yang diperbarui.");
    }

    return { message: "Data updated successfully" };
  } catch (error) {
    console.error("Error updating data:", error);
    throw error;
  }
};

const kota = async () => {
  try {
    const selectQuery = `
            SELECT province, city, subdistrict 
            FROM kota
        `;
    const [rowsData] = await dbKota.execute(selectQuery);
    return rowsData;
  } catch (error) {
    throw error;
  }
};

const homeData = async (kd_user, startDate, endDate, sts_paket_service) => {
  try {
    // Set default values for startDate and endDate if not provided
    const today = new Date();
    const defaultStartDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-01`;
    const defaultEndDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    startDate = startDate || defaultStartDate;
    endDate = endDate || defaultEndDate;

    // Query to get the data
    let selectQuery = `
            SELECT no_mesin, nama_customer, nama_motor, sts_paket_service, tgl_call_tele
            FROM dwh 
            WHERE kd_user = ? AND tgl_call_tele BETWEEN ? AND ?
        `;
    const queryParams = [kd_user, startDate, endDate];

    // If sts_paket_service has a value, add it to the query
    if (sts_paket_service && sts_paket_service.trim() !== "") {
      selectQuery += ` AND sts_paket_service = ?`;
      queryParams.push(sts_paket_service);
    }
    selectQuery += ` ORDER BY tgl_call_tele DESC`;

    const [rowsData] = await db.execute(selectQuery, queryParams);

    // Map the data with status description and formatted date
    const mappedRowsData = rowsData.map((row) => {
      let statusDescription;
      switch (row.sts_paket_service) {
        case "T":
          statusDescription = "Tidak Minat";
          break;
        case "P":
          statusDescription = "Pending";
          break;
        case "O":
          statusDescription = "Berminat";
          break;
        default:
          statusDescription = "Unknown";
      }

      // Format `tgl_call_tele` if available
      let formattedDate = "";
      if (row.tgl_call_tele) {
        const date = new Date(row.tgl_call_tele);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      }

      return {
        ...row,
        sts_paket_service: statusDescription,
        tgl_call_tele: formattedDate,
      };
    });

    // Queries to count the total number of data by status
    const countQueries = {
      minat: `
                SELECT COUNT(*) AS total 
                FROM dwh 
                WHERE sts_paket_service = 'O' AND kd_user = ? AND tgl_call_tele BETWEEN ? AND ?
            `,
      pending: `
                SELECT COUNT(*) AS total 
                FROM dwh 
                WHERE sts_paket_service = 'P' AND kd_user = ? AND tgl_call_tele BETWEEN ? AND ?
            `,
      tidakMinat: `
                SELECT COUNT(*) AS total 
                FROM dwh 
                WHERE sts_paket_service = 'T' AND kd_user = ? AND tgl_call_tele BETWEEN ? AND ?
            `,
    };

    let totalCounts = { minat: 0, pending: 0, tidakMinat: 0 };

    // Check if sts_paket_service is provided
    if (!sts_paket_service || sts_paket_service.trim() === "") {
      // No sts_paket_service provided, count all statuses
      for (const [key, query] of Object.entries(countQueries)) {
        const [result] = await db.execute(query, [kd_user, startDate, endDate]);
        totalCounts[key] = result[0].total;
      }
    } else {
      // sts_paket_service provided, only count the relevant status
      switch (sts_paket_service) {
        case "O": {
          const [result] = await db.execute(countQueries.minat, [
            kd_user,
            startDate,
            endDate,
          ]);
          totalCounts.minat = result[0].total;
          break;
        }
        case "P": {
          const [result] = await db.execute(countQueries.pending, [
            kd_user,
            startDate,
            endDate,
          ]);
          totalCounts.pending = result[0].total;
          break;
        }
        case "T": {
          const [result] = await db.execute(countQueries.tidakMinat, [
            kd_user,
            startDate,
            endDate,
          ]);
          totalCounts.tidakMinat = result[0].total;
          break;
        }
      }
    }

    // Get the total count from query results
    const totalCount = {
      minat: totalCounts.minat,
      pending: totalCounts.pending,
      tidakMinat: totalCounts.tidakMinat,
      jumlah: totalCounts.minat + totalCounts.pending + totalCounts.tidakMinat,
    };

    // Return both data and total count
    return {
      jumlah_data: totalCount,
      data: mappedRowsData,
    };
  } catch (error) {
    throw error;
  }
};
async function homeLeader(startDate, endDate) {
  const userSummaryQuery = `SELECT kd_user FROM dwh WHERE kd_user IS NOT NULL AND kd_user != ''`;
  const [userSummaryRows] = await db.execute(userSummaryQuery);

  const processedUserIds = new Set(); // Untuk menyimpan id user yang sudah diproses
  const result = []; // Untuk data berdasarkan id user
  const jumlahData = {}; // Untuk menyimpan total tanpa kd_user

  for (const user of userSummaryRows) {
    const userId = user.kd_user;

    if (!processedUserIds.has(userId)) {
      processedUserIds.add(userId); // Tandai userId sudah diproses

      // Ambil nama pengguna dari mst_users menggunakan dbLogin
      const userNameQuery = `SELECT name FROM mst_users WHERE username = ?`;
      const [userResult] = await dbLogin.execute(userNameQuery, [userId]);
      const userName = userResult.length ? userResult[0].name : "Unknown";

      // Hitung jumlah `Pending`, `Tidak Berminat`, `Berminat` dengan filter rentang tanggal
      const counts = {
        Pending: 0,
        TidakBerminat: 0,
        Berminat: 0,
      };

      const countQuery = `
          SELECT COUNT(*) AS count, sts_paket_service FROM dwh
          WHERE kd_user = ? 
          AND tgl_call_tele BETWEEN ? AND ?
          GROUP BY sts_paket_service
        `;
      const [countResult] = await db.execute(countQuery, [
        userId,
        startDate,
        endDate,
      ]);

      // Loop untuk hitung status
      countResult.forEach((row) => {
        if (row.sts_paket_service === "P") {
          counts.Pending = row.count;
        } else if (row.sts_paket_service === "T") {
          counts.TidakBerminat = row.count;
        } else if (row.sts_paket_service === "O") {
          counts.Berminat = row.count;
        }
      });

      // Hitung total
      const total = counts.Pending + counts.TidakBerminat + counts.Berminat;

      // Simpan ke hasil JSON
      result.push({
        idUser: userId,
        Nama: userName,
        Pending: counts.Pending,
        TidakBerminat: counts.TidakBerminat,
        Berminat: counts.Berminat,
        Total: total,
      });
    }
  }

  // Tambahkan perhitungan total tanpa `kd_user`
  const totalCountsQuery = `
      SELECT COUNT(*) AS count, sts_paket_service FROM dwh
      WHERE tgl_call_tele BETWEEN ? AND ?
      GROUP BY sts_paket_service
    `;
  const [totalCountsResult] = await db.execute(totalCountsQuery, [
    startDate,
    endDate,
  ]);

  const totalCounts = {
    Pending: 0,
    TidakBerminat: 0,
    Berminat: 0,
  };

  // Hitung total status tanpa `kd_user`
  totalCountsResult.forEach((row) => {
    if (row.sts_paket_service === "P") {
      totalCounts.Pending = row.count;
    } else if (row.sts_paket_service === "T") {
      totalCounts.TidakBerminat = row.count;
    } else if (row.sts_paket_service === "O") {
      totalCounts.Berminat = row.count;
    }
  });

  // Hitung total keseluruhan tanpa `kd_user`
  const grandTotal =
    totalCounts.Pending + totalCounts.TidakBerminat + totalCounts.Berminat;

  // Simpan total tanpa `kd_user` ke array jumlahData
  jumlahData.Pending = totalCounts.Pending;
  jumlahData.TidakBerminat = totalCounts.TidakBerminat;
  jumlahData.Berminat = totalCounts.Berminat;
  jumlahData.Total = grandTotal;

  // Return kedua array, result dan jumlahData
  return {
    jumlahData,
    result,
  };
}

export default {
  getLovCust,
  ambilData,
  getListData,
  Details,
  mstKode,
  updateData,
  kota,
  homeData,
  homeLeader,
};
