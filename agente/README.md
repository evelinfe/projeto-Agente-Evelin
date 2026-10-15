# Front-end para Agente de IA no Microsoft Azure AI Foundry

Interface web moderna, fluida e responsiva para interagir em tempo real com o agente de IA hospedado no **Microsoft Azure AI Foundry** (`evelin-ferrarini`).

---

## 📁 Estrutura de Arquivos

Conforme solicitado, os arquivos do front-end foram totalmente separados:

```
agente/
├── index.html        # Estrutura HTML5 semântica e acessível
├── style.css         # Estilização moderna Dark Glassmorphism em Vanilla CSS
├── script.js         # Lógica do front-end, renderização Markdown, áudio e API
├── server.py         # Servidor backend ponte em Python (conecta com o Azure AI Foundry)
├── agente.py         # Script original de referência do Azure AI Foundry
└── README.md         # Documentação e instruções de uso
```

---

## 🚀 Como Executar

### 1. Iniciar o Servidor Backend

No terminal do seu projeto, execute o script do servidor com o seu ambiente virtual Python:

```bash
# Com o ambiente virtual ativado (ou direto pelo executável do .venv):
.venv\Scripts\python.exe server.py
```

Você verá a seguinte mensagem no terminal:

```
==================================================
 Conectando ao Microsoft Azure AI Foundry...
 Endpoint: https://aula-agente-lucas-resource.services.ai.azure.com/api/projects/aula-agente-lucas
 Agente:   evelin-ferrarini
==================================================
 Conexao com Azure AI Foundry estabelecida com sucesso!

 Front-end disponivel em: http://localhost:8000
 Pressione Ctrl+C para encerrar o servidor.
```

### 2. Abrir no Navegador

Abra o seu navegador de preferência e acesse:
👉 **[http://localhost:8000](http://localhost:8000)**

*(Ou se preferir usar a extensão **Live Server** do VS Code, também funcionará normalmente, pois o `server.py` possui suporte a **CORS** habilitado).*

---

## ✨ Recursos Implementados no Front-end

1. **Design Moderno (Dark Glassmorphism)**:
   - Paleta de cores com gradientes violeta, ciano e neon.
   - Efeitos de desfoque de fundo (`backdrop-filter: blur`), orbs luminosos flutuantes e microanimações suaves.
   - Tipografia moderna com a fonte *Plus Jakarta Sans* e *Fira Code* para códigos.

2. **Renderizador de Markdown Completo**:
   - Títulos (`#`, `##`, `###`), negrito (`**texto**`), itálico, listas numeradas e com marcadores.
   - Blocos de código estilizados com botão de **Copiar** em 1 clique.

3. **Memória de Conversa Contínua (`conversation.id`)**:
   - Preserva o ID da conversa gerado pelo Azure AI Foundry ao longo de toda a sessão, mantendo o contexto das respostas anteriores.
   - Botão **"Nova Conversa"** para resetar e iniciar um novo tópico a qualquer momento.

4. **Entrada de Voz (Speech-to-Text)**:
   - Botão de microfone integrado que transcreve sua fala diretamente para o campo de texto via Web Speech API.

5. **Feedback Sonoro (Web Audio API)**:
   - Sons sintetizados em tempo real ao enviar e receber mensagens (pode ser silenciado no botão do cabeçalho).

6. **Exportação de Chat**:
   - Exporta toda a conversa atual em formato Markdown (`.md`) para download.
