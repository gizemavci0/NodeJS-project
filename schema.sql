-- Öğrenci şeması
CREATE TABLE ogrenci (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    counter INT
);

-- Bölüm şeması
CREATE TABLE bolum (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE Ogrenci_Sayac (
    counter int
);

------------------------------------
ALTER TABLE
    bolum
ADD
    COLUMN dept_std_id INT UNIQUE,
ADD
    CONSTRAINT fk_dept_std_id FOREIGN KEY (dept_std_id) REFERENCES ogrenci(id);

ALTER TABLE ogrenci
ADD COLUMN deptid INT,
ADD CONSTRAINT fk_deptid FOREIGN KEY (deptid) REFERENCES bolum(id);