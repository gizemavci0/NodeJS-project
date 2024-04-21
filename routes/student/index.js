const pool = require("../../database");
const Mail = require("../../mail"); // sendMail fonksiyonunu kullanabilmek için ekledik

//TODO unique email

// Tüm öğrencileri getiren fonksiyon
async function getAllStudents(req, res) {
  try {
    const result = await pool.query("SELECT * FROM ogrenci");
    res.json(result.rows);
  } catch (err) {
    console.error("Öğrenciler alınırken bir hata oluştu:", err);
    res.status(500).json({ error: "Öğrenciler alınırken bir hata oluştu." });
  }
}

// Öğrenci ekleme fonksiyonu
async function addStudent(req, res) {
  const { name, email, counter } = req.body;
  try {
    //İlk olarak, ogrenci tablosuna yeni bir öğrenci eklemek için bir SQL sorgusu çalıştırılır.
    //Bu sorgu, yeni öğrencinin bilgilerini ve sayaç değerini veritabanına ekler.

    const checkMail = await pool.query(
      "SELECT * FROM ogrenci WHERE email = $1",
      [email]
    );

    if (checkMail.rowCount > 0) {
      return res
        .status(400)
        .json({ success: false, error: "Bu eposta adresi zaten kayitli." });
    }

    const result = await pool.query(
      "INSERT INTO ogrenci (name, email, counter) VALUES ($1, $2, $3) RETURNING *",
      [name, email, counter]
    );
    //Eğer ekleme işlemi başarılıysa, yeni eklenen öğrencinin bilgileri ve bir başarı mesajı JSON formatında döndürülür.
    if (result.rowCount === 1) {
      const addedStudent = result.rows[0];
      res.status(201).json({
        success: true,
        message: "Öğrenci başarıyla eklendi.",
        student: addedStudent,
      });

      //------------ Sayac tablosu counter artttırma-------------------------------

      //Ardından, sayaç tablosundaki mevcut değer alınır.
      const counter = await pool.query("SELECT * FROM ogrenci_sayac");
      //Eğer sayaç verisi bulunmuyorsa, yeni bir sayaç oluşturulur ve değeri 1 olarak atanır.
      if (counter.rows.length == 0) {
        await pool.query("INSERT INTO ogrenci_sayac (counter) values ($1)", [
          1,
        ]);
        console.log("Ogrenci sayaci 1");
      }
      //Eğer sayaç verisi bulunuyorsa, sayaç değeri artırılır ve güncellenir.
      else if (counter.rows.length > 0) {
        let newValue = counter.rows[0].counter + 1;
        await pool.query("UPDATE ogrenci_sayac SET counter=($1)", [newValue]);
        console.log(`Ogrenci degiskeni arttirildi mevcut deger:${newValue}`);
      }
      //Eğer herhangi bir hata oluşursa, bir hata mesajı döndürülür.
      else {
        console.error("Ogrenci sayaci guncellenirken hata olustu:", error);
      }

      //------------------------------------------------------------------------
    } else {
      res
        .status(500)
        .json({ success: false, error: "Öğrenci eklenirken bir hata oluştu." });
    }
  } catch (err) {
    console.error("Öğrenci eklenirken bir hata oluştu:", err);
    res
      .status(500)
      .json({ success: false, error: "Öğrenci eklenirken bir hata oluştu." });
  }
}

// Öğrenci silme fonksiyonu
async function deleteStudent(req, res) {
  const { id } = req.body;
  try {
    // ogrenciye bağlı bolum var mı? varsa dept_std_id'yi null yap
    await pool.query(
      "UPDATE bolum SET dept_std_id = NULL WHERE dept_std_id = $1",
      [id]
    );

    // ogrenci silen kod kısmı
    //Bu sorgu, öğrencinin veritabanından silinmesini sağlar.
    const result = await pool.query(
      "DELETE FROM ogrenci WHERE id = $1 RETURNING *",
      [id]
    );
    //Eğer silme işlemi başarısız olursa, yalnızca 0 satır silinmişse, bir hata döndürülür ve işlem durdurulur.
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Öğrenci bulunamadı." });
    }
    //Eğer silme işlemi başarılıysa, bir mesaj ve silinen öğrencinin bilgileri JSON formatında döndürülür.
    res.json({
      message: "Öğrenci başarıyla silindi.",
      deletedStudent: result.rows[0],
    });

    //------------ Sayac tablosu counter azaltma-------------------------------

    //Daha sonra, bir sayaç tablosundan öğrenci sayısını azaltmak için bir dizi sorgu çalıştırılır.
    //Önce sayaç tablosundaki mevcut değer alınır.
    const counter = await pool.query("SELECT * FROM ogrenci_sayac");

    //Eğer sayaç verisi bulunamazsa bir hata mesajı yazdırılır.
    if (counter.rows.length == 0) {
      console.error("Sayac verisi girilmemis");
    }
    //Eğer sayaç verisi bulunursa ve değer 0'dan büyükse, sayaç değeri azaltılır ve yeni değer güncellenir.
    else if (counter.rows.length > 0) {
      if (counter.rows[0].counter > 0) {
        let newValue = counter.rows[0].counter - 1;
        await pool.query("UPDATE ogrenci_sayac SET counter=($1)", [newValue]);
        console.log(`Ogrenci degiskeni azaltildi mevcut deger:${newValue}`);
      } else {
        console.error("Mevcut sayac 0'dan kucuk olamaz");
      }
    } else {
      console.error("Ogrenci sayaci guncellenirken hata olustu:", error);
    }
    //------------------------------------------------------------------------
    //Eğer herhangi bir hata oluşursa, bir hata mesajı döndürülür ve işlem durdurulur.
  } catch (err) {
    console.error("Öğrenci silinirken bir hata oluştu:", err);
    res.status(500).json({ error: "Öğrenci silinirken bir hata oluştu." });
  }
}

// Öğrenci verisi güncelleme fonksiyonu
async function updateStudent(req, res) {
  const { id, name, email, counter } = req.body;
  try {
    const result = await pool.query(
      "UPDATE ogrenci SET name = $1, email = $2, counter = $3 WHERE id = $4 RETURNING *",
      [name, email, counter, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Öğrenci bulunamadı." });
    }
    res.json({
      success: true,
      message: "Öğrenci başarıyla güncellendi.",
      updatedStudent: result.rows[0],
    });
  } catch (err) {
    console.error("Öğrenci güncellenirken bir hata oluştu:", err);
    res.status(500).json({
      success: false,
      error: "Öğrenci güncellenirken bir hata oluştu.",
    });
  }
}
async function sendMail(req, res) {
  try {
    await Mail.writeStudentsToJson();
    await Mail.sendEmail();
    res.json({ message: "Mail gonderimi basarili" });
  } catch (error) {
    console.log("hata:", error);
    res.json({ message: "Mail gonderiminde hata" });
  }
}

module.exports = {
  getAllStudents,
  addStudent,
  deleteStudent,
  updateStudent,
  sendMail,
};
