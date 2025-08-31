document.addEventListener('DOMContentLoaded', () => {
    const comodosList = document.getElementById('comodos-list')
    const dispositivosList = document.getElementById('dispositivos-list')
    const comodoNomeInput = document.getElementById('comodo-nome')
    const addComodoBtn = document.getElementById('add-comodo')
    const dispositivoNomeInput = document.getElementById('dispositivo-nome')
    const dispositivoTipoSelect = document.getElementById('dispositivo-tipo')
    const dispositivoComodoSelect = document.getElementById('dispositivo-comodo')
    const addDispositivoBtn = document.getElementById('add-dispositivo')

    const API_URL = 'http://localhost:3000/api'

    async function fetchComodos() {
        try {
            const response = await fetch(`${API_URL}/comodos`)
            const comodos = await response.json()
            comodosList.innerHTML = ''
            dispositivoComodoSelect.innerHTML = '<option value="">Selecione um cômodo</option>'
            comodos.forEach(comodo => {
                const li = document.createElement('li')
                li.innerHTML = `<span>${comodo.nome}</span> <button data-id="${comodo.id}" data-type="comodo">Excluir</button>`
                comodosList.appendChild(li)

                const option = document.createElement('option')
                option.value = comodo.id;
                option.textContent = comodo.nome;
                dispositivoComodoSelect.appendChild(option)
            });
        } catch (error) {
            console.error('Erro ao buscar cômodos:', error)
        }
    }

    async function fetchDispositivos() {
        try {
            const response = await fetch(`${API_URL}/dispositivos`);
            const dispositivos = await response.json()
            dispositivosList.innerHTML = ''
            dispositivos.forEach(dispositivo => {
                const li = document.createElement('li')
                const statusText = dispositivo.status ? 'Ligado' : 'Desligado'
                li.innerHTML = `
                    <span>${dispositivo.nome} (${dispositivo.tipo}) - Status: ${statusText}</span>
                    <div>
                        <button class="toggle-btn" data-id="${dispositivo.id}">${statusText === 'Ligado' ? 'Desligar' : 'Ligar'}</button>
                        <button class="delete-btn" data-id="${dispositivo.id}" data-type="dispositivo">Excluir</button>
                    </div>
                `;
                dispositivosList.appendChild(li);
            });
        } catch (error) {
            console.error('Erro ao buscar dispositivos:', error)
        }
    }

    async function addComodo() {
        const nome = comodoNomeInput.value;
        if (!nome) return alert('Por favor, insira o nome do cômodo.')
        try {
            await fetch(`${API_URL}/comodos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome })
            });
            comodoNomeInput.value = ''
            fetchComodos()
        } catch (error) {
            console.error('Erro ao adicionar cômodo:', error)
        }
    }

    async function addDispositivo() {
        const nome = dispositivoNomeInput.value
        const tipo = dispositivoTipoSelect.value
        const comodoId = dispositivoComodoSelect.value
        if (!nome || !tipo || !comodoId) return alert('Por favor, preencha todos os campos.')
        try {
            await fetch(`${API_URL}/dispositivos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, tipo, comodoId })
            });
            dispositivoNomeInput.value = ''
            fetchDispositivos()
        } catch (error) {
            console.error('Erro ao adicionar dispositivo:', error)
        }
    }

    async function toggleStatus(id) {
        try {
            await fetch(`${API_URL}/dispositivos/${id}/toggle`, { method: 'PATCH' })
            fetchDispositivos()
        } catch (error) {
            console.error('Erro ao alternar status do dispositivo:', error)
        }
    }

    async function deleteItem(id, type) {
        try {
            await fetch(`${API_URL}/${type}s/${id}`, { method: 'DELETE' })
            if (type === 'comodo') fetchComodos()
            else fetchDispositivos()
        } catch (error) {
            console.error(`Erro ao excluir ${type}:`, error)
        }
    }

    addComodoBtn.addEventListener('click', addComodo)
    addDispositivoBtn.addEventListener('click', addDispositivo)

    comodosList.addEventListener('click', (e) => {
        if (e.target.dataset.type === 'comodo') {
            deleteItem(e.target.dataset.id, 'comodo')
        }
    })

    dispositivosList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            deleteItem(e.target.dataset.id, 'dispositivo')
        } else if (e.target.classList.contains('toggle-btn')) {
            toggleStatus(e.target.dataset.id);
        }
    })

    fetchComodos()
    fetchDispositivos()
})