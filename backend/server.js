
const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const { Pool } = require("pg")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

app.use(cors())
app.use(bodyParser.json())

// ================= CASAS =================
app.get("/api/casas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM casas ORDER BY id")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/casas", async (req, res) => {
  try {
    const { nome } = req.body
    if (!nome) return res.status(400).json({ error: "Nome da casa é obrigatório." })

    const result = await pool.query(
      "INSERT INTO casas (nome) VALUES ($1) RETURNING *",
      [nome]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/casas/:id", async (req, res) => {
  try {
    const { id } = req.params
    await pool.query("DELETE FROM casas WHERE id = $1", [id])
    res.json({ message: "Casa excluída com sucesso" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ================= CÔMODOS =================
app.get("/api/comodos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT c.*, ca.nome AS nome_casa FROM comodos c JOIN casas ca ON c.casa_id = ca.id ORDER BY c.id"
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/comodos", async (req, res) => {
  try {
    const { nome, casaId } = req.body
    if (!nome || !casaId) return res.status(400).json({ error: "Nome e casaId são obrigatórios." })

    const result = await pool.query(
      "INSERT INTO comodos (nome, casa_id) VALUES ($1, $2) RETURNING *",
      [nome, casaId]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/comodos/:id", async (req, res) => {
  try {
    const { id } = req.params
    await pool.query("DELETE FROM comodos WHERE id = $1", [id])
    res.json({ message: "Cômodo excluído com sucesso" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ================= DISPOSITIVOS =================
app.get("/api/dispositivos", async (req, res) => {
  try {
    const { casaId } = req.query
    let query = `
      SELECT d.*, c.nome AS nome_comodo, ca.nome AS nome_casa
      FROM dispositivos d
      JOIN comodos c ON d.comodo_id = c.id
      JOIN casas ca ON c.casa_id = ca.id
    `
    const params = []
    if (casaId) {
      query += " WHERE ca.id = $1"
      params.push(casaId)
    }
    query += " ORDER BY d.id"
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/dispositivos", async (req, res) => {
  try {
    const { nome, tipo, comodoId } = req.body
    const comodo_id = parseInt(comodoId, 10)

    if (!nome || !tipo || !comodo_id) {
      return res.status(400).json({ error: "nome, tipo e comodoId são obrigatórios." })
    }

    const inserted = await pool.query(
      "INSERT INTO dispositivos (nome, tipo, status, comodo_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [nome, tipo, "Desligado", comodo_id]
    )
    const newId = inserted.rows[0].id

    const full = await pool.query(
      `SELECT d.id, d.nome, d.tipo, d.status, c.id AS comodo_id, c.nome AS nome_comodo, ca.id AS casa_id, ca.nome AS nome_casa
       FROM dispositivos d
       JOIN comodos c ON d.comodo_id = c.id
       JOIN casas ca ON c.casa_id = ca.id
       WHERE d.id = $1`,
      [newId]
    )
    res.status(201).json(full.rows[0])
  } catch (err) {
    console.error("Erro ao inserir dispositivo:", err)
    res.status(500).json({ error: err.message })
  }
})

app.patch("/api/dispositivos/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params
    const current = await pool.query("SELECT status FROM dispositivos WHERE id = $1", [id])
    if (current.rows.length === 0) return res.status(404).json({ error: "Dispositivo não encontrado" })

    const novoStatus = current.rows[0].status === "Ligado" ? "Desligado" : "Ligado"
    const result = await pool.query("UPDATE dispositivos SET status = $1 WHERE id = $2 RETURNING *", [novoStatus, id])
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/dispositivos/:id", async (req, res) => {
  try {
    const { id } = req.params
    await pool.query("DELETE FROM dispositivos WHERE id = $1", [id])
    res.json({ message: "Dispositivo excluído com sucesso" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ================= CENAS =================
app.get("/api/cenas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cenas ORDER BY id")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/cenas", async (req, res) => {
  try {
    const { nome, casaId, dispositivos } = req.body

    if (!nome || !casaId) return res.status(400).json({ error: "Nome e casaId são obrigatórios." })
    if (!dispositivos || !Array.isArray(dispositivos) || dispositivos.length < 3) {
      return res.status(400).json({ error: "Uma cena deve ter no mínimo 3 dispositivos." })
    }

    const cena = await pool.query("INSERT INTO cenas (nome, casa_id) VALUES ($1, $2) RETURNING *", [nome, casaId])
    const cenaId = cena.rows[0].id

    for (const d of dispositivos) {
      if (!d.id || !d.status_desejado) {
        return res.status(400).json({ error: "Cada dispositivo precisa de id e status_desejado." })
      }
      await pool.query(
        "INSERT INTO cena_dispositivos (cena_id, dispositivo_id, status_desejado) VALUES ($1, $2, $3)",
        [cenaId, d.id, d.status_desejado]
      )
    }

    res.status(201).json({ ...cena.rows[0], dispositivos })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/cenas/:id/executar", async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query("SELECT dispositivo_id, status_desejado FROM cena_dispositivos WHERE cena_id = $1", [id])

    for (const d of result.rows) {
      await pool.query("UPDATE dispositivos SET status = $1 WHERE id = $2", [d.status_desejado, d.dispositivo_id])
    }

    res.json({ message: "Cena executada com sucesso" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// NOVO: Excluir cena
app.delete("/api/cenas/:id", async (req, res) => {
  try {
    const { id } = req.params
    await pool.query("DELETE FROM cena_dispositivos WHERE cena_id = $1", [id])
    await pool.query("DELETE FROM cenas WHERE id = $1", [id])
    res.json({ message: "Cena excluída com sucesso" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ================= SERVIDOR =================
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
