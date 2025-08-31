-- schema.sql
CREATE TABLE IF NOT EXISTS comodo (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS dispositivo (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('luz','ventilador','tomada','outro')),
  status BOOLEAN NOT NULL DEFAULT FALSE, -- FALSE=desligado, TRUE=ligado
  comodo_id INTEGER NOT NULL REFERENCES comodo(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cena (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS acao (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  intervalo_ms INTEGER NOT NULL DEFAULT 0 CHECK (intervalo_ms >= 0),
  status_desejado BOOLEAN NOT NULL, -- TRUE=ligar, FALSE=desligar
  dispositivo_id INTEGER NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
  cena_id INTEGER NOT NULL REFERENCES cena(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_acao_ordem_por_cena ON acao(cena_id, ordem);

CREATE TABLE IF NOT EXISTS execucao_cena (
  id SERIAL PRIMARY KEY,
  cena_id INTEGER NOT NULL REFERENCES cena(id),
  iniciada_em TIMESTAMP NOT NULL DEFAULT NOW(),
  finalizada_em TIMESTAMP,
  status TEXT NOT NULL CHECK (status IN ('em_andamento','concluida','falhou')),
  detalhes TEXT
);
