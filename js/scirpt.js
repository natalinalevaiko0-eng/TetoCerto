
const ORCAMENTO = 80000;

let despesas = JSON.parse(localStorage.getItem("despesas")) || [];

let notas = JSON.parse(localStorage.getItem("notas")) || [];

let limite = Number(localStorage.getItem("limiteAlerta")) || 80;

const etapas = [
    { nome: "Fundação", previsto: 12000 },
    { nome: "Alvenaria", previsto: 18000 },
    { nome: "Instalações", previsto: 15000 },
    { nome: "Acabamento", previsto: 25000 },
    { nome: "Pintura", previsto: 10000 }
];

const formatarMoeda = (valor) => {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
};

// SALVAR DADOS

function salvarDados() {
    localStorage.setItem("despesas", JSON.stringify(despesas));
    localStorage.setItem("notas", JSON.stringify(notas));
}

// CALCULAR TOTAL

function calcularTotal() {
    return despesas.reduce((total, item) => total + item.valor, 0);
}

// ATUALIZAR DASHBOARD

function atualizarDashboard() {
    const total = calcularTotal();
    const saldo = ORCAMENTO - total;
    const porcentagem = (total / ORCAMENTO) * 100;

    document.getElementById("orcamento").textContent =
        formatarMoeda(ORCAMENTO);

    document.getElementById("totalGasto").textContent =
        formatarMoeda(total);

    document.getElementById("saldo").textContent =
        formatarMoeda(saldo);

    document.getElementById("percentual").textContent =
        porcentagem.toFixed(1) + "%";

    document.getElementById("barraGeral").style.width =
        Math.min(porcentagem, 100) + "%";

    atualizarEtapas();
    atualizarTabela();
    atualizarAlertas();
    atualizarGrafico();
}

// ATUALIZAR ETAPAS

function atualizarEtapas() {
    const lista = document.getElementById("listaEtapas");

    lista.innerHTML = "";

    etapas.forEach(etapa => {
        const gasto = despesas
            .filter(item => item.etapa === etapa.nome)
            .reduce((total, item) => total + item.valor, 0);

        const porcentagem = (gasto / etapa.previsto) * 100;

        lista.innerHTML += `
            <div class="stage">
                <div class="stage-header">
                    <strong>${etapa.nome}</strong>
                    <span>${Math.min(porcentagem, 100).toFixed(0)}%</span>
                </div>

                <div class="stage-progress">
                    <div style="width: ${Math.min(porcentagem, 100)}%"></div>
                </div>

                <div class="stage-values">
                    Previsto: ${formatarMoeda(etapa.previsto)}
                    <br>
                    Realizado: ${formatarMoeda(gasto)}
                    ${gasto > etapa.previsto
                        ? "<br><strong style='color:#c85d4e'>Orçamento ultrapassado!</strong>"
                        : ""}
                </div>
            </div>
        `;
    });
}

// REGISTRAR DESPESAS

document.getElementById("formDespesa").addEventListener("submit", function(event) {
    event.preventDefault();

    const descricao = document.getElementById("descricao").value.trim();
    const categoria = document.getElementById("categoria").value;
    const etapa = document.getElementById("etapaDespesa").value;
    const valor = Number(document.getElementById("valor").value);
    const data = document.getElementById("data").value;

    if (!descricao || !categoria || !etapa || !data ||
        !Number.isFinite(valor) || valor <= 0) {
        alert("Preencha todos os campos corretamente!");
        return;
    }

    despesas.push({
        descricao,
        categoria,
        etapa,
        valor,
        data
    });

    salvarDados();
    atualizarDashboard();

    this.reset();

    alert("Despesa cadastrada com sucesso!");
});

// ATUALIZAR TABELA

function atualizarTabela() {
    const tabela = document.getElementById("tabelaDespesas");

    tabela.innerHTML = "";

    const ultimas = [...despesas].reverse();

    if (ultimas.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5">Nenhuma despesa cadastrada.</td>
            </tr>
        `;
        return;
    }

    ultimas.forEach(item => {
        const dataFormatada = new Date(item.data + "T12:00:00")
            .toLocaleDateString("pt-BR");

        tabela.innerHTML += `
            <tr>
                <td>${item.descricao}</td>
                <td>${item.categoria}</td>
                <td>${item.etapa}</td>
                <td>${dataFormatada}</td>
                <td>${formatarMoeda(item.valor)}</td>
            </tr>
        `;
    });
}

// NOTAS FISCAIS

document.getElementById("arquivo").addEventListener("change", function() {
    const arquivo = this.files[0];

    if (!arquivo) return;

    const extensao = arquivo.name.split(".").pop().toLowerCase();

    if (!["pdf", "png", "jpg", "jpeg"].includes(extensao)) {
        alert("Formato de arquivo não permitido!");
        this.value = "";
        return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
        alert("O arquivo deve ter no máximo 10 MB.");
        this.value = "";
        return;
    }

    notas.push({
        nome: arquivo.name,
        tamanho: (arquivo.size / 1024).toFixed(1) + " KB",
        data: new Date().toLocaleDateString("pt-BR")
    });

    salvarDados();
    atualizarNotas();

    this.value = "";
});

function atualizarNotas() {
    const lista = document.getElementById("listaNotas");

    lista.innerHTML = "";

    notas.forEach(nota => {
        lista.innerHTML += `
            <li>
                📄 ${nota.nome}
                <br>
                <small>${nota.tamanho} • ${nota.data}</small>
            </li>
        `;
    });

    if (notas.length === 0) {
        lista.innerHTML = "<li>Nenhuma nota fiscal cadastrada.</li>";
    }
}

// ALERTAS DE ORÇAMENTO

function atualizarAlertas() {
    const total = calcularTotal();
    const porcentagem = (total / ORCAMENTO) * 100;

    const alerta = document.getElementById("mensagemAlerta");

    if (porcentagem >= 100) {
        alerta.className = "alert-box danger";
        alerta.innerHTML = `
            <strong>⚠ Orçamento ultrapassado!</strong>
            <p>Você ultrapassou o limite total da obra.</p>
        `;
    } else if (porcentagem >= limite) {
        alerta.className = "alert-box warning";
        alerta.innerHTML = `
            <strong>⚠ Atenção ao orçamento!</strong>
            <p>Você já utilizou ${porcentagem.toFixed(1)}% do orçamento.</p>
        `;
    } else {
        alerta.className = "alert-box";
        alerta.innerHTML = `
            <strong>✓ Tudo sob controle!</strong>
            <p>Seus gastos estão dentro do limite definido.</p>
        `;
    }
}

// CONFIGURAR LIMITE DO ALERTA

document.getElementById("limiteAlerta").value = limite;

document.getElementById("salvarLimite").addEventListener("click", function() {
    const novoLimite = Number(
        document.getElementById("limiteAlerta").value
    );

    if (!Number.isFinite(novoLimite) ||
        novoLimite < 1 || novoLimite > 100) {
        alert("Digite um limite entre 1 e 100%.");
        return;
    }

    limite = novoLimite;

    localStorage.setItem("limiteAlerta", limite);

    atualizarAlertas();

    alert("Limite de alerta atualizado!");
});

// GRÁFICO DE DISTRIBUIÇÃO

let grafico;

function atualizarGrafico() {
    const categorias = [
        "Materiais",
        "Mão de obra",
        "Acabamento",
        "Elétrica",
        "Hidráulica",
        "Outros"
    ];

    const valores = categorias.map(categoria => {
        return despesas
            .filter(item => item.categoria === categoria)
            .reduce((total, item) => total + item.valor, 0);
    });

    if (grafico) {
        grafico.data.datasets[0].data = valores;
        grafico.update();
        return;
    }

    grafico = new Chart(
        document.getElementById("grafico"),
        {
            type: "doughnut",

            data: {
                labels: categorias,

                datasets: [{
                    data: valores,
                    backgroundColor: [
                        "#536b43",
                        "#82966b",
                        "#c5b98c",
                        "#a5b69a",
                        "#35452f",
                        "#d9dfd0"
                    ],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },

            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );
}

// INICIALIZAÇÃO

atualizarDashboard();
atualizarNotas();
