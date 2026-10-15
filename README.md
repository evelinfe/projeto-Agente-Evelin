# 🌸 Projeto Agente Evelin Ferrarini

<div align="center">

![Azure AI Foundry](https://img.shields.io/badge/Azure%20AI%20Foundry-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3 Glassmorphism](https://img.shields.io/badge/CSS3-Dark%20Glassmorphism-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Status](https://img.shields.io/badge/Status-Em%20Produção-success?style=for-the-badge)

<p align="center">
  <b>Interface conversacional inteligente e interativa conectada ao agente de IA hospedado no Microsoft Azure AI Foundry.</b><br>
  Especialista em Marketing, Atração de Clientes e Estratégias Digitais para Salões de Beleza e Design de Sobrancelhas.
</p>

</div>

---

## 📌 Visão Geral do Projeto

O **projeto-Agente-Evelin** é uma solução completa que integra um agente de Inteligência Artificial no **Microsoft Azure AI Foundry** (`evelin-ferrarini`) a uma interface web rica, interativa e responsiva com visual moderno em *Dark Glassmorphism*.

A assistente **Evelin Ferrarini** atua como uma consultora especializada no nicho de estética e beleza, oferecendo:
- 💡 **Planejamento de Conteúdo:** Ideias criativas para posts, Reels e Stories no Instagram.
- 🎯 **Estratégias de Atração:** Criação de promoções, pacotes promocionais e combos de serviços (cabelo, sobrancelhas e tratamentos).
- ✍️ **Copywriting & Ganchos:** Roteiros de antes/depois, legendas persuasivas e chamadas para ação (CTA).
- 🗓️ **Fidelização:** Campanhas para dias de menor movimento e manutenção de clientes.

---

## ✨ Principais Funcionalidades

### 🎨 Front-end Moderno & Fluido
- **Design Dark Glassmorphism:** Efeitos de desfoque de fundo (`backdrop-filter: blur`), iluminação ambiente dinâmica (*ambient glow*) e microinterações táteis.
- **Renderizador Markdown em Tempo Real:** Formatação completa de títulos, listas, destaques e blocos de código com botão de cópia rápida em 1 clique.
- **Entrada por Voz (Speech-to-Text):** Transcrição de áudio pelo microfone do navegador via Web Speech API.
- **Efeitos Sonoros Sintetizados:** Feedback auditivo suave para envio e recebimento de mensagens através da Web Audio API (com opção de silenciar).
- **Exportação de Conversas:** Permite salvar todo o histórico do diálogo em arquivo Markdown (`.md`).
- **Sugestões Rápidas (Chips):** Cartões de acesso rápido a perguntas frequentes e modelos de prompts.

### ⚙️ Back-end & Integração Azure
- **Ponte com Azure AI Foundry:** Comunicação direta com a API do Azure utilizando o SDK oficial `azure-ai-projects` e autenticação com `DefaultAzureCredential`.
- **Gerenciamento de Conversação (`conversation.id`):** Mantém o contexto de múltiplos turnos de conversa sincronizado com o Azure OpenAI.
- **Servidor HTTP Assíncrono com CORS:** Backend em Python servindo arquivos estáticos e rotas de API REST com suporte a CORS para testes locais e em rede.

---

## 📁 Estrutura do Repositório

```text
projeto-Agente-Evelin/
├── README.md                  # Documentação principal do projeto
└── agente/
    ├── index.html             # Estrutura semântica da aplicação web
    ├── style.css              # Estilização completa em Vanilla CSS (Glassmorphism)
    ├── script.js              # Lógica do front-end, chamadas de API, áudio e voz
    ├── server.py              # Servidor ponte HTTP e rotas REST para o Azure AI Foundry
    ├── agente.py              # Script Python de referência direta com Azure AI Projects
    └── README.md              # Documentação complementar específica do módulo agente
```

---

## 🛠️ Tecnologias Utilizadas

- **Linguagens & Tecnologias Web:** HTML5, CSS3 moderno, JavaScript (ES6+ Vanilla).
- **Back-end:** Python 3.10+, `http.server`, `urllib`, `json`.
- **Nuvem & Inteligência Artificial:**
  - [Microsoft Azure AI Foundry](https://ai.azure.com/)
  - `azure-ai-projects >= 2.1.0`
  - `azure-identity` (DefaultAzureCredential)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Python 3.10+** instalado.
- Conta no Azure com acesso ao projeto no **Azure AI Foundry**.
- Azure CLI autenticado (`az login`) ou credenciais de ambiente configuradas.

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/projeto-Agente-Evelin.git
cd projeto-Agente-Evelin
```

### 2. Configurar o Ambiente Virtual Python
No diretório `agente/`:

```bash
cd agente

# Criar ambiente virtual
python -m venv .venv

# Ativar ambiente virtual
# No Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# No Windows (Prompt de Comando):
.\.venv\Scripts\activate.bat
# No Linux/macOS:
source .venv/bin/activate
```

### 3. Instalar as Dependências
```bash
pip install "azure-ai-projects>=2.1.0" azure-identity
```

### 4. Executar o Servidor
```bash
python server.py
```

Você verá a saída no terminal indicando a conexão com o Azure:
```text
==================================================
 Conectando ao Microsoft Azure AI Foundry...
 Endpoint: https://aula-agente-lucas-resource.services.ai.azure.com/api/projects/aula-agente-lucas
 Agente:   evelin-ferrarini
==================================================
 Conexao com Azure AI Foundry estabelecida com sucesso!

 Front-end disponivel em: http://localhost:8000
 Pressione Ctrl+C para encerrar o servidor.
```

### 5. Acessar a Aplicação
Abra seu navegador em:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 🔌 Rotas da API Backend (`server.py`)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/status` | Retorna o estado da conexão com o agente no Azure e metadados. |
| `POST` | `/api/new_conversation` | Cria um novo ID de sessão de conversa no Azure AI Foundry. |
| `POST` | `/api/chat` | Envia uma mensagem do usuário e retorna a resposta gerada pelo agente. |

### Exemplo de Requisição (`/api/chat`):
```json
{
  "message": "Crie um roteiro de Stories para mostrar o antes e depois de um design de sobrancelhas.",
  "conversation_id": "conv_abc123"
}
```

---

## 💡 Exemplos de Prompts Recomendados

- **Ideias de Post:** *"Quero ideias de posts promocionais para atrair novas clientes para meu salão."*
- **Roteiro de Stories:** *"Crie um roteiro de Stories interativo para mostrar o antes e depois de sobrancelhas com henna."*
- **Engajamento no Instagram:** *"Quais os melhores ganchos e CTAs para divulgar cronograma capilar no feed?"*
- **Promoção Estratégica:** *"Monte uma estratégia de combo: corte + hidratação + sobrancelhas para terça e quarta-feira."*

---

## 👩‍💻 Autoria

Desenvolvido por **Evelin de Siqueira Ferrarini**  
Projeto de Agente de IA integrado ao ecossistema **Microsoft Azure AI**.