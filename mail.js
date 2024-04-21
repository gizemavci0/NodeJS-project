const express = require("express");
const fs = require("fs");
const pool = require("./database");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

require("dotenv").config();

//env dosyasından periyod ve test edeceğimiz değerleri process ile çekeriz
const period = process.env.PERIOD;
const gmail_username = process.env.MAIL_USERNAME;
const gmail_password = process.env.MAIL_PASSWORD;

//veritabanından tüm öğrenci kayıtlarını alır, bir JSON dosyasına dönüştürür ve dosyaya yazar.
//Bu işlem fs.writeFileSync ile gerçekleştirilir.
async function writeStudentsToJson() {
  try {
    const result = await pool.query("SELECT * FROM ogrenci");
    const studentList = result.rows;
    fs.writeFileSync("studentList.json", JSON.stringify(studentList));
    console.log("Ogrenci listesi basariyla JSON dosyasina yazildi");
  } catch (error) {
    console.error("Ogrenci listesi JSON dosyaya eklenemedi:", error);
  }
}
/*nodemailer kütüphanesi aracılığıyla e-posta göndermek için kullanılır.
Gmail SMTP sunucusunu kullanarak bir transporter oluşturulur ve gönderilecek e-posta ayarları yapılır.
Daha sonra, transporter.sendMail ile e-posta gönderilir.
Bu işlemde, gönderilecek e-postanın konusu, içeriği ve eklenecek dosyası (öğrenci listesi JSON dosyası) belirlenir. */

async function sendEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmail_username,
        pass: gmail_password,
      },
    });

    const mailOption = {
      from: "testnodejs652@gmail.com",
      to: "gizemmnsgizem@gmail.com",
      subject: "Haftalik Öğrenci Listesi",
      text: "Haftalik öğrenci listesini içerir",
      attachments: [
        {
          filename: "studentList.json",
          path: "./studentList.json",
        },
      ],
    };

    const info = await transporter.sendMail(mailOption);
    console.log("Mail basariyla gonderildi.", info.response);
  } catch (error) {
    console.error("Mail gonderilemedi. Hata:", error);
  }
}

/*belirli bir periyotta belirtilen işlemleri (JSON dosyasına yazma ve e-posta gönderme) gerçekleştirmek için kullanılır.
Bu işlem, haftalık raporlama işlemini otomatikleştirmek için kullanılır. */
//periyod değeri .env dosyasında bulunur

async function weeklyReport() {
  try {
    console.log("Haftalik raporlama islemi basliyor..");
    await writeStudentsToJson();
    await sendEmail();
    console.log("Haftalik raporlama islemi tamamlandi.");
  } catch (e) {
    console.error("Haftalık raporlama işlemi basarısız oldu. \nHata:", e);
  }
}

//callback olarak fonksıyonumuzu attık.
cron.schedule(period, weeklyReport);

module.exports = {
  writeStudentsToJson,
  sendEmail,
  weeklyReport,
};
