const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
})

// util simples de espera
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Evita executar a mesma cena em paralelo
const cenasEmExecucao = new Set()

/* -------------------- CÔMODOS -------------------- */
app.get('/api/comodos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM comodo ORDER BY id')
  res.json(rows)
})

app.get('/api/comodos/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM comodo WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Cômodo não encontrado' })
  res.json(rows[0])
});

app.post('/api/comodos', async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO comodo (nome) VALUES ($1) RETURNING *',
      [nome]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    res.status(400).json({ error: 'Não foi possível criar o cômodo', detalhe: e.message })
  }
});

app.put('/api/comodos/:id', async (req, res) => {
  const { nome } = req.body
  const { rows } = await pool.query(
    'UPDATE comodo SET nome=$1 WHERE id=$2 RETURNING *',
    [nome, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Cômodo não encontrado' });
  res.json(rows[0])
});

app.delete('/api/comodos/:id', async (req, res) => {
  const r = await pool.query('DELETE FROM comodo WHERE id=$1', [req.params.id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Cômodo não encontrado' });
  res.status(204).send()
});

/* -------------------- DISPOSITIVOS -------------------- */
app.get('/api/dispositivos', async (req, res) => {
  const { comodoId } = req.query
  let q = 'SELECT * FROM dispositivo'
  const params = [];
  if (comodoId) {
    q += ' WHERE comodo_id=$1'
    params.push(comodoId);
  }
  q += ' ORDER BY id'
  const { rows } = await pool.query(q, params)
  res.json(rows)
})

app.get('/api/dispositivos/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM dispositivo WHERE id=$1', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Dispositivo não encontrado' })
  res.json(rows[0]);
});

app.post('/api/dispositivos', async (req, res) => {
  const { nome, tipo, status = false, comodoId } = req.body
  if (!nome || !tipo || !comodoId)
    return res.status(400).json({ error: 'nome, tipo, comodoId são obrigatórios' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO dispositivo (nome, tipo, status, comodo_id)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [nome, tipo, !!status, comodoId]
    );
    res.status(201).json(rows[0])
  } catch (e) {
    res.status(400).json({ error: 'Não foi possível criar o dispositivo', detalhe: e.message })
  }
})

app.put('/api/dispositivos/:id', async (req, res) => {
  const { nome, tipo, status, comodoId } = req.body
  const { rows } = await pool.query(
    `UPDATE dispositivo SET
     nome=COALESCE($1, nome),
     tipo=COALESCE($2, tipo),
     status=COALESCE($3, status),
     comodo_id=COALESCE($4, comodo_id)
     WHERE id=$5 RETURNING *`,
    [nome, tipo, status, comodoId, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Dispositivo não encontrado' })
  res.json(rows[0])
})

app.patch('/api/dispositivos/:id/toggle', async (req, res) => {
  const { rows } = await pool.query('UPDATE dispositivo SET status = NOT status WHERE id=$1 RETURNING *', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Dispositivo não encontrado' })
  res.json(rows[0])
})

app.delete('/api/dispositivos/:id', async (req, res) => {
  const r = await pool.query('DELETE FROM dispositivo WHERE id=$1', [req.params.id])
  if (r.rowCount === 0) return res.status(404).json({ error: 'Dispositivo não encontrado' })
  res.status(204).send()
})

/* -------------------- CENAS -------------------- */
app.get('/api/cenas', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cena ORDER BY id')
  res.json(rows)
})

app.get('/api/cenas/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cena WHERE id=$1', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Cena não encontrada' })
  res.json(rows[0])
});

app.post('/api/cenas', async (req, res) => {
  const { nome, ativa = true } = req.body
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });
  const { rows } = await pool.query('INSERT INTO cena (nome, ativa) VALUES ($1,$2) RETURNING *', [nome, !!ativa])
  res.status(201).json(rows[0])
});

app.put('/api/cenas/:id', async (req, res) => {
  const { nome, ativa } = req.body
  const { rows } = await pool.query(
    'UPDATE cena SET nome=COALESCE($1,nome), ativa=COALESCE($2,ativa) WHERE id=$3 RETURNING *',
    [nome, ativa, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Cena não encontrada' })
  res.json(rows[0])
});

app.delete('/api/cenas/:id', async (req, res) => {
  const r = await pool.query('DELETE FROM cena WHERE id=$1', [req.params.id])
  if (r.rowCount === 0) return res.status(404).json({ error: 'Cena não encontrada' })
  res.status(204).send()
});

/* ---- AÇÕES DA CENA ---- */
// Listar ações de uma cena
app.get('/api/cenas/:id/acoes', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM acao WHERE cena_id=$1 ORDER BY ordem', [req.params.id])
  res.json(rows);
});

// Adicionar UMA ação
app.post('/api/cenas/:id/acoes', async (req, res) => {
  const { ordem, intervalo_ms = 0, status_desejado, dispositivo_id } = req.body;
  if (ordem == null || status_desejado == null || !dispositivo_id)
    return res.status(400).json({ error: 'ordem, status_desejado, dispositivo_id são obrigatórios' })

  try {
    const { rows } = await pool.query(
      `INSERT INTO acao (ordem, intervalo_ms, status_desejado, dispositivo_id, cena_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [ordem, intervalo_ms, status_desejado, dispositivo_id, req.params.id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: 'Não foi possível criar a ação', detalhe: e.message })
  }
});

// Atualizar ação
app.put('/api/acoes/:acaoId', async (req, res) => {
  const { ordem, intervalo_ms, status_desejado, dispositivo_id } = req.body
  const { rows } = await pool.query(
    `UPDATE acao SET
     ordem = COALESCE($1, ordem),
     intervalo_ms = COALESCE($2, intervalo_ms),
     status_desejado = COALESCE($3, status_desejado),
     dispositivo_id = COALESCE($4, dispositivo_id)
     WHERE id=$5 RETURNING *`,
    [ordem, intervalo_ms, status_desejado, dispositivo_id, req.params.acaoId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Ação não encontrada' })
  res.json(rows[0]);
});

app.delete('/api/acoes/:acaoId', async (req, res) => {
  const r = await pool.query('DELETE FROM acao WHERE id=$1', [req.params.acaoId])
  if (r.rowCount === 0) return res.status(404).json({ error: 'Ação não encontrada' })
  res.status(204).send();
});

/* ---- EXECUTAR CENA (com intervalos) ---- */
app.post('/api/cenas/:id/executar', async (req, res) => {
  const cenaId = Number(req.params.id);

  // Evita sobreposição de execuções da mesma cena
  if (cenasEmExecucao.has(cenaId)) {
    return res.status(409).json({ error: 'Cena já está em execução' })
  }

  // Verifica se a cena existe e está ativa
  const cena = await pool.query('SELECT * FROM cena WHERE id=$1', [cenaId])
  if (!cena.rows[0]) return res.status(404).json({ error: 'Cena não encontrada' })
  if (!cena.rows[0].ativa) return res.status(409).json({ error: 'Cena está desativada' })

  const acoes = await pool.query('SELECT * FROM acao WHERE cena_id=$1 ORDER BY ordem', [cenaId])
  if (acoes.rows.length === 0) return res.status(400).json({ error: 'Cena sem ações' })

  // Cria log de execução
  const exec = await pool.query(
    `INSERT INTO execucao_cena (cena_id, status) VALUES ($1,'em_andamento') RETURNING *`,
    [cenaId]
  );
  const execId = exec.rows[0].id

  cenasEmExecucao.add(cenaId)

  try {
    for (const ac of acoes.rows) {
      if (ac.intervalo_ms > 0) {
        await sleep(ac.intervalo_ms)
      }
      // Aplica o status desejado ao dispositivo
      await pool.query('UPDATE dispositivo SET status=$1 WHERE id=$2', [ac.status_desejado, ac.dispositivo_id])
    }

    await pool.query(
      `UPDATE execucao_cena
       SET status='concluida', finalizada_em=NOW(), detalhes=$2
       WHERE id=$1`,
      [execId, `Executadas ${acoes.rows.length} ações com sucesso`]
    );
    res.status(200).json({ message: 'Cena executada com sucesso', execucaoId: execId })
  } catch (e) {
    await pool.query(
      `UPDATE execucao_cena
       SET status='falhou', finalizada_em=NOW(), detalhes=$2
       WHERE id=$1`,
      [execId, e.message]
    );
    res.status(500).json({ error: 'Falha na execução da cena', detalhe: e.message, execucaoId: execId })
  } finally {
    cenasEmExecucao.delete(cenaId)
  }
})

/* ---- SAÚDE ---- */
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch {
    res.status(500).json({ ok: false })
  }
})

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API rodando em http://localhost:${port}`))
