const pool = require('../../database');

// Tüm bolumleri getiren fonksiyon
async function getAllDepartments(req, res) {
    try {
        const result = await pool.query('SELECT * FROM bolum');
        res.json(result.rows);
    } catch (err) {
        console.error('Bölümler alınırken bir hata oluştu:', err);
        res.status(500).json({ error: 'Bölümler alınırken bir hata oluştu.' });
    }
}

// Bolum ekleme fonksiyonu
async function addDepartment(req, res) {
    const { name } = req.body;
    try {
        const result = await pool.query('INSERT INTO bolum (name) VALUES ($1) RETURNING *', [name]);
        if (result.rowCount === 1) {
            const addedDepartmant = result.rows[0];
            res.status(201).json({ success: true, message: 'Bölüm başarıyla eklendi.', department: addedDepartmant });
        } else {
            res.status(500).json({ success: false, error: 'Bölüm eklenirken bir hata oluştu.' });
        }
    } catch (err) {
        console.error('Bölüm eklenirken bir hata oluştu:', err);
        res.status(500).json({ success: false, error: 'Bölüm eklenirken bir hata oluştu.' });
    }
}

// Bolum silme fonksiyonu
async function deleteDepartment(req, res) {
    const { id } = req.body;
    try {
        // bolume bağlı ogrenci var mı? varsa deptid'yi null yap
        await pool.query('UPDATE ogrenci SET deptid = NULL WHERE deptid = $1', [id]);
        
        // bolum silen kod kısmı
        const result = await pool.query('DELETE FROM bolum WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bölüm bulunamadı.' });
        }
        res.json({ message: 'Bölüm başarıyla silindi.', deletedDepartment: result.rows[0] });
    } catch (err) {
        console.error('Bölüm silinirken bir hata oluştu:', err);
        res.status(500).json({ error: 'Bölüm silinirken bir hata oluştu.' });
    }
}

// Bolum verisi güncelleme fonksiyonu
async function updateDepartment(req, res) {
    const { id, name } = req.body;
    try {
        const result = await pool.query('UPDATE bolum SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bölüm bulunamadı.' });
        }
        res.json({ success: true, message: 'Bölüm başarıyla güncellendi.', updatedDepartment: result.rows[0] });
    } catch (err) {
        console.error('Bölüm güncellenirken bir hata oluştu:', err);
        res.status(500).json({ success: false, error: 'Bölüm güncellenirken bir hata oluştu.' });
    }
}

module.exports = { getAllDepartments, addDepartment, deleteDepartment, updateDepartment };