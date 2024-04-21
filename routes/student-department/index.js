const pool = require('../../database');


async function combineStudentDepartment(req, res) {
    const { userEmail, departmantID } = req.body;

    try {
        // ogrenci var mı?
        const ogrenciSorgu = await pool.query('SELECT id, deptid FROM ogrenci WHERE email = $1', [userEmail]);
        const ogrenci = ogrenciSorgu.rows[0];
        if (!ogrenci) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı.' });
        }

        // bolum var mı?
        const bolumSorgu = await pool.query('SELECT id, dept_std_id FROM bolum WHERE id = $1', [departmantID]);
        const bolum = bolumSorgu.rows[0];
        if (!bolum) {
            return res.status(404).json({ error: 'Bölüm bulunamadı.' });
        }

        // bolume bağlı ogrenci var mı?
        if (bolum.dept_std_id) {
            return res.status(400).json({ error: 'Bölüm zaten bir öğrenciye sahip.' });
        }

        // ogrenciye bağlı bolum var mı?
        if (ogrenci.deptid) {
            return res.status(400).json({ error: 'Öğrenci zaten bir bölüme ait.' });
        }

        // bolum verisini ogrenci ile güncelle
        await pool.query('UPDATE bolum SET dept_std_id = $1 WHERE id = $2', [ogrenci.id, departmantID]);

        // ogrenci verisini bolum ile güncelle
        await pool.query('UPDATE ogrenci SET deptid = $1 WHERE id = $2', [departmantID, ogrenci.id]);

        res.status(200).json({ message: 'Öğrenci başarıyla bölüme eklendi.' });
    } catch (error) {
        console.error('Öğrenci ve bölüm birleştirme hatası:', error);
        res.status(500).json({ error: 'İç sunucu hatası.' });
    }
}

module.exports = { combineStudentDepartment };