import { db, dbLogin } from "../config/database.js";
import ExcelJS from "exceljs";

// Define styles
const headerStyle = {
  font: { bold: true, color: { argb: "000000" } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" } },
  alignment: { horizontal: "left" },
};

const dataDetailsSpecification = {
  no_mesin: { displayName: "No Mesin", headerStyle, width: 150 },
  nama_customer: { displayName: "Nama Customer", headerStyle, width: 200 },
  nama_motor: { displayName: "Nama Motor", headerStyle, width: 200 },
  sts_paket_service: {
    displayName: "Status Paket Service",
    headerStyle,
    width: 200,
  },
  tgl_call_tele: { displayName: "Tanggal Call", headerStyle, width: 150 },
  alasan_pending: { displayName: "Alasan Pending", headerStyle, width: 200 },
  alasan_tidak_minat: {
    displayName: "Alasan Tidak Minat",
    headerStyle,
    width: 200,
  },
};

// Function to export data to Excel with multiple tables in one sheet
export const exportToExcel = async (dataDetails, startDate, endDate) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data Details");

    // Add start and end date
    sheet.addRow([
      `Dari Tanggal: ${startDate}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    sheet.addRow([
      `Sampai Tanggal: ${endDate}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    sheet.addRow([]); // Empty row

    // Add header rows for Data Details
    sheet.addRow(["Data Details"]).font = headerStyle.font;
    sheet
      .addRow(
        Object.keys(dataDetailsSpecification).map(
          (key) => dataDetailsSpecification[key].displayName
        )
      )
      .eachCell({ includeEmpty: true }, (cell) => {
        cell.style = headerStyle;
      });

    // Add data rows for Data Details
    dataDetails.forEach((record) => {
      sheet.addRow([
        record.no_mesin,
        record.nama_customer,
        record.nama_motor,
        record.sts_paket_service,
        record.tgl_call_tele,
        record.alasan_pending,
        record.alasan_tidak_minat,
      ]);
    });

    // Set column widths (optional)
    sheet.columns = [
      { width: 20 },
      { width: 30 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 30 },
      { width: 20 },
      { width: 30 },
      { width: 30 },
    ];

    // Write file buffer
    const reportBuffer = await workbook.xlsx.writeBuffer();
    return reportBuffer;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};
// Function to fetch data details from database
export const fetchDataDetails = async (
  kd_user,
  startDate,
  endDate,
  sts_paket_service,
  nama_motor
) => {
  try {
    // Build the base query
    let queryDetails = `
      SELECT
        dwh.no_mesin, dwh.nama_customer, dwh.nama_motor,
        dwh.sts_paket_service, dwh.tgl_call_tele,
        pending.name AS alasan_pending,
        tidak_minat.name AS alasan_tidak_minat
      FROM dwh
      LEFT JOIN mst_alasan_pending AS pending ON dwh.alasan_pending = pending.id
      LEFT JOIN mst_alasan_tdk_berminat AS tidak_minat ON dwh.alasan_tidak_minat = tidak_minat.id
      WHERE dwh.kd_user = ? AND dwh.tgl_call_tele BETWEEN ? AND ? 
    `;

    const queryParams = [kd_user, startDate, endDate];

    // Add filter for sts_paket_service if it's not empty
    if (sts_paket_service && sts_paket_service.trim() !== "") {
      queryDetails += ` AND dwh.sts_paket_service = ?`;
      queryParams.push(sts_paket_service);
    }

    // Add filter for nama_motor using LIKE if it's not empty
    if (nama_motor && nama_motor.trim() !== "") {
      queryDetails += ` AND UPPER(dwh.nama_motor) LIKE UPPER(?)`;
      queryParams.push(`%${nama_motor.toUpperCase()}%`);
    }

    // Execute the query with dynamic parameters
    const [detailsData] = await db.execute(queryDetails, queryParams);

    // Map the data to change status and format date
    const formattedDetailsData = detailsData.map((record) => {
      // Convert status paket service to description
      switch (record.sts_paket_service) {
        case "T":
          record.sts_paket_service = "Tidak Berminat";
          break;
        case "P":
          record.sts_paket_service = "Pending";
          break;
        case "O":
          record.sts_paket_service = "Berminat";
          break;
        default:
          record.sts_paket_service = "Unknown";
      }
      // Convert tgl_call_tele to yyyy-MM-dd format
      const [year, month, day] = record.tgl_call_tele
        .toISOString()
        .split("T")[0]
        .split("-");
      record.tgl_call_tele = `${year}-${month}-${day}`;
      return record;
    });

    return formattedDetailsData;
  } catch (error) {
    throw error;
  }
};

export const exportToExcelLeader = async (startDate, endDate) => {
  try {
    // Initialize Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const rekapSheet = workbook.addWorksheet("Rekap");

    // Set title for the Rekap sheet
    rekapSheet.mergeCells("A1:H1");
    rekapSheet.getCell(
      "A1"
    ).value = `Paket Service Periode ${startDate} - ${endDate}`;
    rekapSheet.getCell("A1").font = { bold: true, size: 14 };
    rekapSheet.addRow([]);

    // Table 1 - Rekap Summary Header
    const header1 = ["Bulan", "Pending", "Tidak Berminat", "Berminat", "Total"];
    rekapSheet.addRow(header1);
    const table1Header = rekapSheet.getRow(3);

    // Apply style for the header
    table1Header.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    // Set column widths for the first table
    rekapSheet.getColumn(1).width = 15; // Lebar untuk 'id User'
    rekapSheet.getColumn(2).width = 25; // Lebar untuk 'Nama'
    rekapSheet.getColumn(3).width = 15; // Lebar untuk 'Bulan'
    rekapSheet.getColumn(4).width = 15; // Lebar untuk 'Pending'
    rekapSheet.getColumn(5).width = 15; // Lebar untuk 'Tidak Berminat'
    rekapSheet.getColumn(6).width = 10; // Lebar untuk 'Berminat'
    rekapSheet.getColumn(7).width = 10; // Lebar untuk 'Total'
    rekapSheet.getColumn(8).width = 15;

    // Query for table 1 data
    const table1Query = `
          SELECT MONTH(tgl_call_tele) AS bulan, YEAR(tgl_call_tele) AS tahun,
          SUM(CASE WHEN sts_paket_service = 'P' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN sts_paket_service = 'T' THEN 1 ELSE 0 END) AS tidak_minat,
          SUM(CASE WHEN sts_paket_service = 'O' THEN 1 ELSE 0 END) AS berminat,
          COUNT(*) AS total
          FROM dwh
          WHERE tgl_call_tele BETWEEN ? AND ?
          GROUP BY bulan, tahun
      `;
    const [rekapRows] = await db.execute(table1Query, [startDate, endDate]);

    // Helper function to get month name
    const getMonthName = (monthNumber) => {
      const date = new Date();
      date.setMonth(monthNumber - 1);
      return date.toLocaleString("id-ID", { month: "long" });
    };

    // Populate the first table with formatted month name and year
    rekapRows.forEach((row) => {
      const monthName = `${getMonthName(row.bulan)} ${row.tahun}`;
      rekapSheet
        .addRow([
          monthName,
          row.pending,
          row.tidak_minat,
          row.berminat,
          row.total,
        ])
        .eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
    });

    // Add some space between the two tables
    rekapSheet.addRow([]);

    // Table 2 - Header
    const header2 = [
      "id User",
      "Nama",
      "Bulan",
      "Pending",
      "Tidak Berminat",
      "Berminat",
      "Total",
    ];
    rekapSheet.addRow(header2);
    const table2Header = rekapSheet.getRow(rekapSheet.rowCount);

    // Apply style for the second table header
    table2Header.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Table 2 - Data Query
    const table2Query = `
          SELECT d.kd_user, MONTH(d.tgl_call_tele) AS bulan, YEAR(d.tgl_call_tele) AS tahun,
          SUM(CASE WHEN d.sts_paket_service = 'P' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN d.sts_paket_service = 'T' THEN 1 ELSE 0 END) AS tidak_minat,
          SUM(CASE WHEN d.sts_paket_service = 'O' THEN 1 ELSE 0 END) AS berminat,
          COUNT(*) AS total
          FROM dwh d
          WHERE d.tgl_call_tele BETWEEN ? AND ?
          GROUP BY d.kd_user, bulan, tahun
      `;
    const [userRows] = await db.execute(table2Query, [startDate, endDate]);

    // Fetch user names from mst_users using dbLogin
    for (const row of userRows) {
      const userQuery = `SELECT name FROM mst_users WHERE username = ?`;
      const [userResult] = await dbLogin.execute(userQuery, [row.kd_user]);
      const userName = userResult.length > 0 ? userResult[0].name : "Unknown";
      const monthName = `${getMonthName(row.bulan)} ${row.tahun}`;

      // Add rows to the second table
      rekapSheet
        .addRow([
          row.kd_user,
          userName,
          monthName,
          row.pending,
          row.tidak_minat,
          row.berminat,
          row.total,
        ])
        .eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
    }

    // Sheet 2 - Alasan Summary----------------------------------------------------------------------------
    const alasanSheet = workbook.addWorksheet("Pending");

    // Set title for the Pending sheet
    alasanSheet.mergeCells("A1:H1");
    alasanSheet.getCell(
      "A1"
    ).value = `Paket Service Periode ${startDate} - ${endDate}`;
    alasanSheet.getCell("A1").font = { bold: true, size: 14 };
    alasanSheet.addRow([]); // Add an empty row after the title

    const alasanQuery = `SELECT id, name FROM mst_alasan_pending`;
    const [alasanRows] = await db.execute(alasanQuery);

    // Set header for the first table
    const alasanHeader = [
      "Alasan",
      ...Array.from(
        {
          length:
            new Date(endDate).getMonth() - new Date(startDate).getMonth() + 1,
        },
        (_, i) => getMonthName(new Date(startDate).getMonth() + 1 + i)
      ),
    ];
    alasanSheet.addRow(alasanHeader);

    // Apply style for the first table header (Alasan)
    const alasanTableHeader = alasanSheet.getRow(3);
    alasanTableHeader.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Set column widths for the first table
    alasanSheet.getColumn(1).width = 30; // Lebar untuk kolom A (Alasan)
    for (let i = 2; i <= 8; i++) {
      // Kolom B hingga H
      alasanSheet.getColumn(i).width = 15; // Lebar untuk kolom B hingga H
    }

    // Add alasan data for the first table
    for (const alasan of alasanRows) {
      const rowData = [alasan.name];
      for (
        let month = new Date(startDate).getMonth();
        month <= new Date(endDate).getMonth();
        month++
      ) {
        const monthIndex = month + 1; // Convert to 1-based month
        const year = new Date(startDate).getFullYear(); // Get the year from startDate
        const countQuery = `
      SELECT COUNT(*) AS count FROM dwh
      WHERE MONTH(tgl_call_tele) = ? AND YEAR(tgl_call_tele) = ? AND sts_paket_service = 'P' AND alasan_pending = ?
      AND tgl_call_tele BETWEEN ? AND ?
    `;
        const [countResult] = await db.execute(countQuery, [
          monthIndex,
          year,
          alasan.id,
          startDate,
          endDate,
        ]);
        rowData.push(countResult[0].count);
      }
      const addedRow = alasanSheet.addRow(rowData);

      // Apply border to the added row
      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
    }

    // Count where alasan_pending is NULL
    const emptyReasonRow = ["Alasan Kosong"]; // Name for the empty reason row
    for (
      let month = new Date(startDate).getMonth();
      month <= new Date(endDate).getMonth();
      month++
    ) {
      const monthIndex = month + 1; // Convert to 1-based month
      const year = new Date(startDate).getFullYear(); // Get the year from startDate
      const emptyCountQuery = `
    SELECT COUNT(*) AS count FROM dwh
    WHERE MONTH(tgl_call_tele) = ? AND YEAR(tgl_call_tele) = ? AND sts_paket_service = 'P' AND alasan_pending IS NULL
    AND tgl_call_tele BETWEEN ? AND ?
  `;
      const [emptyCountResult] = await db.execute(emptyCountQuery, [
        monthIndex,
        year,
        startDate,
        endDate,
      ]);
      emptyReasonRow.push(emptyCountResult[0].count);
    }

    // Add the empty reason row to the sheet and apply border
    const emptyReasonRowExcel = alasanSheet.addRow(emptyReasonRow);
    emptyReasonRowExcel.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Add space between the first and second tables
    alasanSheet.addRow([]); // Add an empty row for spacing

    // Set header untuk tabel kedua
    const userSummaryHeader = [
      "ID User",
      "Nama",
      "Bulan",
      ...alasanRows.map((alasan) => alasan.name),
      "Alasan Kosong",
    ];
    const userSummaryRow = alasanSheet.addRow(userSummaryHeader);

    // Terapkan style untuk header tabel kedua
    const userSummaryTableHeader = alasanSheet.getRow(
      alasanSheet.lastRow.number
    );
    userSummaryTableHeader.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" }, // Latar belakang kuning untuk header
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Ambil data kd_user dari tabel dwh
    const userSummaryQuery = `SELECT kd_user FROM dwh WHERE kd_user IS NOT NULL AND kd_user != ''`;
    const [userSummaryRows] = await db.execute(userSummaryQuery);

    const processedUserIds = new Set(); // Untuk menyimpan id user yang sudah diproses

    // Loop melalui setiap pengguna untuk menambahkan data ke tabel
    for (const user of userSummaryRows) {
      const userId = user.kd_user;

      if (!processedUserIds.has(userId)) {
        processedUserIds.add(userId); // Tandai userId sudah diproses

        // Ambil nama pengguna dari mst_users menggunakan dbLogin
        const userNameQuery = `SELECT name FROM mst_users WHERE username = ?`;
        const [userResult] = await dbLogin.execute(userNameQuery, [userId]);
        const userName = userResult.length ? userResult[0].name : "Unknown";

        // Loop melalui bulan dalam rentang yang ditentukan untuk menambahkan data ke tabel
        let start = new Date(startDate);
        let end = new Date(endDate);

        for (
          let month = start.getMonth();
          month <=
          end.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
          month++
        ) {
          const monthIndex = (month % 12) + 1; // Konversi ke bulan 1-based
          const year = start.getFullYear() + Math.floor(month / 12); // Mendapatkan tahun
          const monthName = getMonthName(monthIndex); // Mendapatkan nama bulan

          // Hitung alasan untuk pengguna ini
          const alasanCounts = [];
          for (const alasan of alasanRows) {
            const countQuery = `
          SELECT COUNT(*) AS count FROM dwh
          WHERE MONTH(tgl_call_tele) = ? AND YEAR(tgl_call_tele) = ? AND sts_paket_service = 'P' AND alasan_pending = ? AND kd_user = ?
          AND tgl_call_tele BETWEEN ? AND ?
        `;
            const [countResult] = await db.execute(countQuery, [
              monthIndex,
              year,
              alasan.id,
              userId,
              startDate,
              endDate,
            ]);
            alasanCounts.push(countResult[0].count);
          }

          // Hitung alasan_pending yang kosong
          const emptyCountQuery = `
        SELECT COUNT(*) AS count FROM dwh
        WHERE MONTH(tgl_call_tele) = ? AND YEAR(tgl_call_tele) = ? AND sts_paket_service = 'P' AND alasan_pending IS NULL AND kd_user = ?
        AND tgl_call_tele BETWEEN ? AND ?
      `;
          const [emptyCountResult] = await db.execute(emptyCountQuery, [
            monthIndex,
            year,
            userId,
            startDate,
            endDate,
          ]);
          const emptyCount = emptyCountResult[0].count;

          // Tambah baris untuk pengguna ke tabel, termasuk jika semua hasil adalah 0
          const userRow = [
            userId,
            userName,
            monthName,
            ...alasanCounts,
            emptyCount,
          ];
          alasanSheet.addRow(userRow);
        }
      }
    }

    // Setelah menambahkan baris ke tabel
    const columnWidths = [22, 20, 15, ...alasanRows.map(() => 23), 20]; // Sesuaikan lebar kolom

    // Atur lebar kolom untuk sheet
    columnWidths.forEach((width, index) => {
      alasanSheet.getColumn(index + 1).width = width;
    });

    // Table 3 - Tidak Berminat ------------------------------------------------------------------
    const tidakBerminatSheet = workbook.addWorksheet("Tidak Berminat");

    // Set title for the Tidak Berminat sheet
    tidakBerminatSheet.mergeCells("A1:H1");
    tidakBerminatSheet.getCell(
      "A1"
    ).value = `Paket Service Periode ${startDate} - ${endDate}`;
    tidakBerminatSheet.getCell("A1").font = { bold: true, size: 14 };
    tidakBerminatSheet.addRow([]); // Add an empty row after the title

    // Ambil data alasan dari mst_alasan_tdk_berminat
    const tidakBerminatQuery = `SELECT id, name FROM mst_alasan_tdk_berminat`;
    const [tidakBerminatRows] = await db.execute(tidakBerminatQuery);

    // Set header untuk tabel pertama
    const tidakBerminatHeader = [
      "Alasan",
      ...Array.from(
        {
          length:
            new Date(endDate).getMonth() - new Date(startDate).getMonth() + 1,
        },
        (_, i) => getMonthName(new Date(startDate).getMonth() + 1 + i)
      ),
    ];
    tidakBerminatSheet.addRow(tidakBerminatHeader);

    // Terapkan style untuk header tabel pertama
    const tidakBerminatTableHeader = tidakBerminatSheet.getRow(3);
    tidakBerminatTableHeader.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Set column widths untuk tabel pertama
    tidakBerminatSheet.getColumn(1).width = 30; // Lebar untuk kolom A (Alasan)
    for (let i = 2; i <= 8; i++) {
      tidakBerminatSheet.getColumn(i).width = 15; // Lebar untuk kolom B hingga H
    }

    // Tambah data alasan untuk tabel pertama
    for (const alasan of tidakBerminatRows) {
      const rowData = [alasan.name];
      for (
        let month = new Date(startDate).getMonth();
        month <= new Date(endDate).getMonth();
        month++
      ) {
        const monthIndex = month + 1; // Convert to 1-based month
        const year = new Date(startDate).getFullYear(); // Get the year from startDate
        const countQuery = `
            SELECT COUNT(*) AS count FROM dwh
            WHERE MONTH(tgl_call_tele) = ? AND YEAR(tgl_call_tele) = ? AND sts_paket_service = 'T' AND alasan_tidak_minat = ?
            AND tgl_call_tele BETWEEN ? AND ?
        `;
        const [countResult] = await db.execute(countQuery, [
          monthIndex,
          year,
          alasan.id,
          startDate,
          endDate,
        ]);
        rowData.push(countResult[0].count);
      }
      const addedRow = tidakBerminatSheet.addRow(rowData);

      // Terapkan border ke baris yang ditambahkan
      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
    }

    // Hitung jumlah di mana alasan_tidak_minat adalah NULL
    const emptyReasonRowTidakBerminat = ["Alasan Tidak Berminat Kosong"]; // Nama untuk baris alasan kosong
    for (
      let month = new Date(startDate).getMonth();
      month <= new Date(endDate).getMonth();
      month++
    ) {
      const monthIndex = month + 1; // Convert to 1-based month
      const year = new Date(startDate).getFullYear(); // Get the year from startDate
      const emptyCountQuery = `
        SELECT COUNT(*) AS count FROM dwh
        WHERE MONTH(tgl_call_tele) = ? AND YEAR(tgl_call_tele) = ? AND sts_paket_service = 'T' AND alasan_tidak_minat IS NULL
        AND tgl_call_tele BETWEEN ? AND ?
      `;
      const [emptyCountResult] = await db.execute(emptyCountQuery, [
        monthIndex,
        year,
        startDate,
        endDate,
      ]);
      emptyReasonRowTidakBerminat.push(emptyCountResult[0].count);
    }

    // Tambah baris alasan kosong ke sheet dan terapkan border
    const emptyReasonRowExcelTidakBerminat = tidakBerminatSheet.addRow(
      emptyReasonRowTidakBerminat
    );
    emptyReasonRowExcelTidakBerminat.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Tambah spasi antara tabel pertama dan kedua
    tidakBerminatSheet.addRow([]); // Tambah baris kosong untuk spasi

    // Set header untuk tabel kedua
    const userSummaryTidakBerminatHeader = [
      "ID User",
      "Nama",
      "Bulan",
      ...tidakBerminatRows.map((alasan) => alasan.name),
      "Alasan Tidak Berminat Kosong",
    ];
    const userSummaryTidakBerminatRow = tidakBerminatSheet.addRow(
      userSummaryTidakBerminatHeader
    );

    // Terapkan style untuk header tabel kedua
    const userSummaryTidakBerminatTableHeader = tidakBerminatSheet.getRow(
      tidakBerminatSheet.lastRow.number
    );
    userSummaryTidakBerminatTableHeader.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" }, // Latar belakang kuning untuk header
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Ambil data kd_user dari tabel dwh
    const userSummaryTidakBerminatQuery = `SELECT kd_user FROM dwh WHERE kd_user IS NOT NULL AND kd_user != ''`;
    const [userSummaryTidakBerminatRows] = await db.execute(
      userSummaryTidakBerminatQuery
    );

    const processedUserIdsTidakBerminat = new Set(); // Untuk menyimpan id user yang sudah diproses

    // Loop melalui setiap pengguna untuk menambahkan data ke tabel
    for (const user of userSummaryTidakBerminatRows) {
      const userId = user.kd_user;

      if (!processedUserIdsTidakBerminat.has(userId)) {
        processedUserIdsTidakBerminat.add(userId); // Tandai userId sudah diproses

        // Ambil nama pengguna dari mst_users menggunakan dbLogin
        const userNameQuery = `SELECT name FROM mst_users WHERE username = ?`;
        const [userResult] = await dbLogin.execute(userNameQuery, [userId]);
        const userName = userResult.length ? userResult[0].name : "Unknown";

        // Loop melalui bulan dalam rentang yang ditentukan untuk menambahkan data ke tabel
        let start = new Date(startDate);
        let end = new Date(endDate);

        for (
          let month = start.getMonth();
          month <=
          end.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
          month++
        ) {
          const monthIndex = (month % 12) + 1; // Konversi ke bulan 1-based
          const year = start.getFullYear() + Math.floor(month / 12); // Mendapatkan tahun
          const monthName = getMonthName(monthIndex); // Mendapatkan nama bulan

          // Hitung alasan untuk pengguna ini
          const alasanCounts = [];
          for (const alasan of tidakBerminatRows) {
            const countQuery = `
                    SELECT COUNT(*) AS count FROM dwh
                    WHERE MONTH(tgl_call_tele) = ? AND YEAR(tgl_call_tele) = ? AND sts_paket_service = 'T' AND alasan_tidak_minat = ? AND kd_user = ?
                    AND tgl_call_tele BETWEEN ? AND ?
                `;
            const [countResult] = await db.execute(countQuery, [
              monthIndex,
              year,
              alasan.id,
              userId,
              startDate,
              endDate,
            ]);
            alasanCounts.push(countResult[0].count);
          }

          // Hitung alasan_tidak_minat yang kosong
          const emptyCountQuery = `
                    SELECT COUNT(*) AS count FROM dwh
                    WHERE MONTH(tgl_call_tele) = ? AND YEAR(tgl_call_tele) = ? AND sts_paket_service = 'T' AND alasan_tidak_minat IS NULL AND kd_user = ?
                    AND tgl_call_tele BETWEEN ? AND ?
                `;
          const [emptyCountResult] = await db.execute(emptyCountQuery, [
            monthIndex,
            year,
            userId,
            startDate,
            endDate,
          ]);
          const rowData = [
            userId,
            userName,
            monthName,
            ...alasanCounts,
            emptyCountResult[0].count,
          ];
          const addedRow = tidakBerminatSheet.addRow(rowData);

          // Terapkan border ke baris yang ditambahkan
          addedRow.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
          });
        }
      }
    }

    // Sesuaikan lebar kolom di sheet "Tidak Berminat"
    tidakBerminatSheet.getColumn(1).width = 30; // Lebar kolom ID User
    tidakBerminatSheet.getColumn(2).width = 25; // Lebar kolom Nama
    tidakBerminatSheet.getColumn(3).width = 20; // Lebar kolom Bulan
    for (let i = 4; i <= 4 + tidakBerminatRows.length; i++) {
      // Untuk setiap kolom alasan
      tidakBerminatSheet.getColumn(i).width = 30; // Lebar kolom alasan
    }

    // Write file buffer
    const reportBuffer = await workbook.xlsx.writeBuffer();
    return reportBuffer;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};
