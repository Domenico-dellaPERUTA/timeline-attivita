CREATE DATABASE IF NOT EXISTS timeline_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE timeline_db;

CREATE TABLE IF NOT EXISTS progetti (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  societa VARCHAR(100) NOT NULL,
  cliente VARCHAR(100) NOT NULL,
  tecnologia TEXT NOT NULL,
  descrizione TEXT NOT NULL,
  anno_inizio INT NOT NULL,
  mese_inizio INT NOT NULL,
  anno_fine INT NULL,
  mese_fine INT NULL,
  impegno_saltuario BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_anno_inizio (anno_inizio),
  INDEX idx_societa (societa),
  INDEX idx_cliente (cliente)
);

