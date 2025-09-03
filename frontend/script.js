document.addEventListener("DOMContentLoaded", () => {
  const casasList = document.getElementById("casas-list")
  const comodosList = document.getElementById("comodos-list")
  const dispositivosList = document.getElementById("dispositivos-list")
  const cenasList = document.getElementById("cenas-list")
  const cenaDispositivosContainer = document.getElementById("cena-dispositivos-container")

  const casaNomeInput = document.getElementById("casa-nome")
  const comodoNomeInput = document.getElementById("comodo-nome")
  const dispositivoNomeInput = document.getElementById("dispositivo-nome")
  const dispositivoTipoSelect = document.getElementById("dispositivo-tipo")
  const cenaNomeInput = document.getElementById("cena-nome")

  const comodoCasaSelect = document.getElementById("comodo-casa")
  const dispositivoComodoSelect = document.getElementById("dispositivo-comodo")
  const cenaCasaSelect = document.getElementById("cena-casa")

  const API_URL = "http://localhost:3000/api"

  // ================= FUNÇÕES AUXILIARES =================
  async function fetchCasas() {
    const res = await fetch(`${API_URL}/casas`)
    const casas = await res.json()
    casasList.innerHTML = ""
    comodoCasaSelect.innerHTML = "<option value=''>Selecione a casa</option>"
    cenaCasaSelect.innerHTML = "<option value=''>Selecione a casa</option>"

    casas.forEach((casa) => {
      const li = document.createElement("li")
      li.innerHTML = `<span>${casa.nome}</span> <button data-id="${casa.id}" class="delete-casa">Excluir</button>`
      casasList.appendChild(li)

      let opt1 = document.createElement("option")
      opt1.value = casa.id
      opt1.textContent = casa.nome
      comodoCasaSelect.appendChild(opt1)

      let opt2 = document.createElement("option")
      opt2.value = casa.id
      opt2.textContent = casa.nome
      cenaCasaSelect.appendChild(opt2)
    })
  }

  async function fetchComodos() {
    const res = await fetch(`${API_URL}/comodos`)
    const comodos = await res.json()
    comodosList.innerHTML = ""
    dispositivoComodoSelect.innerHTML = "<option value=''>Selecione um cômodo</option>"

    comodos.forEach((comodo) => {
      const li = document.createElement("li")
      li.innerHTML = `<span>${comodo.nome} (${comodo.nome_casa})</span> <button data-id="${comodo.id}" class="delete-comodo">Excluir</button>`
      comodosList.appendChild(li)

      let opt = document.createElement("option")
      opt.value = comodo.id
      opt.textContent = `${comodo.nome} (${comodo.nome_casa})`
      dispositivoComodoSelect.appendChild(opt)
    })
  }

  async function fetchDispositivos() {
    const res = await fetch(`${API_URL}/dispositivos`)
    const dispositivos = await res.json()
    dispositivosList.innerHTML = ""

    dispositivos.forEach((dispositivo) => {
      const li = document.createElement("li")
      const statusText = dispositivo.status === "Ligado" ? "Ligado" : "Desligado"
      li.innerHTML = `
        <span>${dispositivo.nome} (${dispositivo.nome_comodo} - ${dispositivo.nome_casa}) - Status: ${statusText}</span>
        <div>
          <button class="toggle-btn" data-id="${dispositivo.id}">${statusText === "Ligado" ? "Desligar" : "Ligar"}</button>
          <button class="delete-btn" data-id="${dispositivo.id}">Excluir</button>
        </div>
      `
      dispositivosList.appendChild(li)
    })
  }

  async function fetchCenas() {
    const res = await fetch(`${API_URL}/cenas`)
    const cenas = await res.json()
    cenasList.innerHTML = ""
    cenas.forEach((cena) => {
      const li = document.createElement("li")
      li.innerHTML = `<span>${cena.nome}</span> 
        <div>
          <button class="executar-cena" data-id="${cena.id}">Executar</button>
          <button class="delete-cena" data-id="${cena.id}">Excluir</button>
        </div>`
      cenasList.appendChild(li)
    })
  }

  async function fetchDispositivosByCasa(casaId) {
    if (!casaId) {
      cenaDispositivosContainer.innerHTML = "<p>Selecione uma casa para ver os dispositivos.</p>"
      return []
    }
    const res = await fetch(`${API_URL}/dispositivos?casaId=${casaId}`)
    const dispositivos = await res.json()
    cenaDispositivosContainer.innerHTML = ""
    if (dispositivos.length === 0) {
      cenaDispositivosContainer.innerHTML = "<p>Nenhum dispositivo encontrado nesta casa.</p>"
    } else {
      dispositivos.forEach(dispositivo => {
        const div = document.createElement("div")
        div.classList.add("dispositivo-cena-item")
        div.innerHTML = `
          <input type="checkbox" class="cena-dispositivo-check" data-id="${dispositivo.id}">
          <span>${dispositivo.nome} (${dispositivo.tipo})</span>
          <select class="status-select" data-id="${dispositivo.id}">
            <option value="Ligado">Ligado</option>
            <option value="Desligado">Desligado</option>
          </select>
        `
        cenaDispositivosContainer.appendChild(div)
      })
    }
    return dispositivos
  }

  // ================= EVENTOS =================
  document.getElementById("add-casa").addEventListener("click", async () => {
    const nome = casaNomeInput.value
    if (!nome) return alert("Informe o nome da casa")
    await fetch(`${API_URL}/casas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    })
    casaNomeInput.value = ""
    fetchCasas()
  })

  document.getElementById("add-comodo").addEventListener("click", async () => {
    const nome = comodoNomeInput.value
    const casaId = comodoCasaSelect.value
    if (!nome || !casaId) return alert("Preencha o nome e selecione a casa")
    await fetch(`${API_URL}/comodos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, casaId }),
    })
    comodoNomeInput.value = ""
    fetchComodos()
  })

  document.getElementById("add-dispositivo").addEventListener("click", async () => {
    const nome = dispositivoNomeInput.value
    const tipo = dispositivoTipoSelect.value
    const comodoId = dispositivoComodoSelect.value
    if (!nome || !tipo || !comodoId) return alert("Preencha todos os campos")
    await fetch(`${API_URL}/dispositivos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, tipo, comodoId }),
    })
    dispositivoNomeInput.value = ""
    fetchDispositivos()
  })

  // Novo evento para carregar dispositivos por casa
  cenaCasaSelect.addEventListener("change", (e) => {
    const casaId = e.target.value
    fetchDispositivosByCasa(casaId)
  })

  document.getElementById("add-cena").addEventListener("click", async () => {
    const nome = cenaNomeInput.value
    const casaId = cenaCasaSelect.value

    const dispositivosSelecionados = []
    document.querySelectorAll("#cena-dispositivos-container .cena-dispositivo-check:checked").forEach(check => {
      const id = check.dataset.id
      const status = document.querySelector(`.status-select[data-id="${id}"]`).value
      dispositivosSelecionados.push({
        id,
        status_desejado: status
      })
    })

    if (!nome || !casaId) {
      return alert("Preencha o nome da cena e selecione a casa.")
    }

    if (dispositivosSelecionados.length < 3) {
      return alert("Selecione e defina o status de pelo menos 3 dispositivos.")
    }

    const response = await fetch(`${API_URL}/cenas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, casaId, dispositivos: dispositivosSelecionados }),
    })

    if (response.ok) {
      cenaNomeInput.value = ""
      cenaCasaSelect.value = ""
      cenaDispositivosContainer.innerHTML = "<p>Selecione uma casa para ver os dispositivos.</p>"
      fetchCenas()
      alert("Cena criada com sucesso!")
    } else {
      const errorData = await response.json()
      alert(errorData.error || "Erro ao adicionar cena.")
    }
  })

  // ============ CONFIRMAÇÕES DE EXCLUSÃO ============
  casasList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-casa")) {
      if (confirm("Tem certeza que deseja excluir esta casa?")) {
        fetch(`${API_URL}/casas/${e.target.dataset.id}`, { method: "DELETE" }).then(fetchCasas)
      }
    }
  })

  comodosList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-comodo")) {
      if (confirm("Tem certeza que deseja excluir este cômodo?")) {
        fetch(`${API_URL}/comodos/${e.target.dataset.id}`, { method: "DELETE" }).then(fetchComodos)
      }
    }
  })

  dispositivosList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      if (confirm("Tem certeza que deseja excluir este dispositivo?")) {
        fetch(`${API_URL}/dispositivos/${e.target.dataset.id}`, { method: "DELETE" }).then(fetchDispositivos)
      }
    } else if (e.target.classList.contains("toggle-btn")) {
      fetch(`${API_URL}/dispositivos/${e.target.dataset.id}/toggle`, { method: "PATCH" }).then(fetchDispositivos)
    }
  })

  cenasList.addEventListener("click", (e) => {
    if (e.target.classList.contains("executar-cena")) {
      fetch(`${API_URL}/cenas/${e.target.dataset.id}/executar`, { method: "POST" }).then(fetchDispositivos)
    }
    if (e.target.classList.contains("delete-cena")) {
      if (confirm("Tem certeza que deseja excluir esta cena?")) {
        fetch(`${API_URL}/cenas/${e.target.dataset.id}`, { method: "DELETE" }).then(fetchCenas)
      }
    }
  })

  // ================= INICIAL =================
  fetchCasas()
  fetchComodos()
  fetchDispositivos()
  fetchCenas()
})