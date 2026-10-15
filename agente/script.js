/**
 * Evelin Ferrarini • AI Agent Frontend Logic (Vanilla JavaScript)
 * Interage com o agente hospedado no Microsoft Azure AI Foundry via server.py
 */

(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Application State & Configuration
  // ---------------------------------------------------------------------------
  const DEFAULT_BACKEND_URL = window.location.protocol.startsWith('http')
    ? window.location.origin
    : 'http://localhost:8000';

  const state = {
    backendUrl: localStorage.getItem('ai_agent_backend_url') || DEFAULT_BACKEND_URL,
    conversationId: localStorage.getItem('ai_agent_conv_id') || null,
    agentName: 'evelin-ferrarini',
    soundEnabled: localStorage.getItem('ai_agent_sound') !== 'false',
    isWaiting: false,
    history: [],
    audioCtx: null
  };

  // ---------------------------------------------------------------------------
  // 2. DOM Elements Cache
  // ---------------------------------------------------------------------------
  const dom = {
    chatMain: document.getElementById('chatMain'),
    welcomeCard: document.getElementById('welcomeCard'),
    messagesContainer: document.getElementById('messagesContainer'),
    typingIndicator: document.getElementById('typingIndicator'),
    messageInput: document.getElementById('messageInput'),
    btnSend: document.getElementById('btnSend'),
    btnClearInput: document.getElementById('btnClearInput'),
    btnVoiceInput: document.getElementById('btnVoiceInput'),
    btnNewChat: document.getElementById('btnNewChat'),
    btnExportChat: document.getElementById('btnExportChat'),
    btnSoundToggle: document.getElementById('btnSoundToggle'),
    iconSoundOn: document.querySelector('.icon-sound-on'),
    iconSoundOff: document.querySelector('.icon-sound-off'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusMessage: document.getElementById('statusMessage'),
    convTag: document.getElementById('convTag'),
    toastContainer: document.getElementById('toastContainer'),
    // Modal
    settingsModal: document.getElementById('settingsModal'),
    btnOpenSettings: document.getElementById('btnOpenSettings'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    cfgBackendUrl: document.getElementById('cfgBackendUrl'),
    cfgAgentName: document.getElementById('cfgAgentName'),
    cfgConvId: document.getElementById('cfgConvId'),
    modalStatusBox: document.getElementById('modalStatusBox'),
    modalStatusText: document.getElementById('modalStatusText'),
    btnCheckConnection: document.getElementById('btnCheckConnection'),
    btnSaveSettings: document.getElementById('btnSaveSettings')
  };

  // ---------------------------------------------------------------------------
  // 3. Audio Synthesizer (Web Audio API - No External Files Needed)
  // ---------------------------------------------------------------------------
  function getAudioContext() {
    if (!state.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        state.audioCtx = new AudioCtxClass();
      }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      if (type === 'send') {
        // Soft pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'receive') {
        // Two-tone chime (C5 -> E5)
        [523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.09;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.15, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.26);
        });
      }
    } catch {
      // Audio autoplay policy or device failure ignored silently
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Markdown Formatter & Code Block Parser
  // ---------------------------------------------------------------------------
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMarkdown(rawText) {
    if (!rawText) return '';

    // Extrai blocos de codigo temporariamente para proteger seu conteudo
    const codeBlocks = [];
    let text = rawText.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = codeBlocks.length;
      codeBlocks.push({ lang: lang || 'codigo', code: code.trim() });
      return `__CODE_BLOCK_${id}__`;
    });

    // Sanitiza tags HTML
    text = escapeHtml(text);

    // Cabecalhos (###, ##, #)
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Negrito e Italico
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');

    // Codigo inline
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Citacoes / Blockquotes
    text = text.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Listas ordenadas
    text = text.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ol-item">$1</li>');

    // Listas nao ordenadas (- ou *)
    text = text.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ul-item">$1</li>');

    // Agrupa itens <li>
    text = text.replace(/(<li class="ul-item">[\s\S]*?<\/li>)+/g, '<ul>$&</ul>');
    text = text.replace(/(<li class="ol-item">[\s\S]*?<\/li>)+/g, '<ol>$&</ol>');

    // Quebras de linha duplas viram paragrafos
    const paragraphs = text.split(/\n\s*\n/);
    text = paragraphs
      .map(p => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<blockquote') || p.startsWith('__CODE_BLOCK_')) {
          return p;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      })
      .join('');

    // Reinsere blocos de codigo formatados com botao de copiar
    text = text.replace(/__CODE_BLOCK_(\d+)__/g, (match, idStr) => {
      const item = codeBlocks[parseInt(idStr, 10)];
      if (!item) return '';
      const escapedCode = escapeHtml(item.code);
      return `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span>${escapeHtml(item.lang)}</span>
            <button class="code-copy-btn" onclick="copyCodeBlock(this)">Copiar</button>
          </div>
          <div class="code-block">
            <pre><code>${escapedCode}</code></pre>
          </div>
        </div>
      `;
    });

    return text;
  }

  // Funcao global para o botao de copiar do bloco de codigo
  window.copyCodeBlock = function (btn) {
    const pre = btn.closest('.code-block-wrapper').querySelector('pre code');
    if (!pre) return;
    navigator.clipboard.writeText(pre.innerText).then(() => {
      const original = btn.innerText;
      btn.innerText = 'Copiado!';
      btn.style.color = '#10b981';
      setTimeout(() => {
        btn.innerText = original;
        btn.style.color = '';
      }, 2000);
    });
  };

  // ---------------------------------------------------------------------------
  // 5. UI Updates & Message Rendering
  // ---------------------------------------------------------------------------
  function formatTime(date = new Date()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function appendMessage(role, text) {
    if (dom.welcomeCard && !dom.welcomeCard.classList.contains('hidden')) {
      dom.welcomeCard.classList.add('hidden');
    }

    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const timeStr = formatTime();
    const isUser = role === 'user';

    const avatarHtml = `
      <div class="message-avatar">
        ${isUser ? 'VOCÊ' : 'EF'}
      </div>
    `;

    const contentHtml = isUser
      ? `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`
      : renderMarkdown(text);

    row.innerHTML = `
      ${avatarHtml}
      <div class="message-content-wrap">
        <div class="message-bubble">
          ${contentHtml}
        </div>
        <div class="message-footer">
          <span class="message-time">${timeStr}</span>
          <button class="btn-copy-msg" title="Copiar mensagem">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copiar
          </button>
        </div>
      </div>
    `;

    // Botao de copiar mensagem completa
    const copyBtn = row.querySelector('.btn-copy-msg');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Mensagem copiada para a área de transferência!', 'success');
      });
    });

    dom.messagesContainer.appendChild(row);
    scrollToBottom();

    // Salva no historico em memoria
    state.history.push({ role, text, time: timeStr });
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      dom.chatMain.scrollTop = dom.chatMain.scrollHeight;
    });
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function updateConvTag(id) {
    if (!id) {
      dom.convTag.textContent = 'Conversa: Nova';
      dom.convTag.title = 'Nenhuma conversa ativa no Azure';
      dom.cfgConvId.value = '(Nenhuma conversa ativa)';
    } else {
      const shortId = id.length > 20 ? `${id.slice(0, 10)}...${id.slice(-6)}` : id;
      dom.convTag.textContent = `Conversa: ${shortId}`;
      dom.convTag.title = `ID completo: ${id}`;
      dom.cfgConvId.value = id;
    }
  }

  function setWaiting(waiting) {
    state.isWaiting = waiting;
    if (waiting) {
      dom.typingIndicator.classList.remove('hidden');
      dom.btnSend.disabled = true;
      dom.messageInput.disabled = true;
      scrollToBottom();
    } else {
      dom.typingIndicator.classList.add('hidden');
      dom.btnSend.disabled = false;
      dom.messageInput.disabled = false;
      dom.messageInput.focus();
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Backend API Communication
  // ---------------------------------------------------------------------------
  async function checkBackendStatus() {
    try {
      const res = await fetch(`${state.backendUrl}/api/status`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      dom.statusIndicator.className = 'status-indicator online';
      dom.statusIndicator.title = `Conectado ao agente ${data.agent_name} no Microsoft Foundry`;
      dom.statusMessage.textContent = `${data.agent_name} • Microsoft Azure AI Foundry Conectado`;

      if (dom.modalStatusBox) {
        dom.modalStatusBox.querySelector('.status-indicator-dot').className = 'status-indicator-dot online';
        dom.modalStatusText.textContent = `Online (Agente: ${data.agent_name})`;
      }
      return true;
    } catch (err) {
      dom.statusIndicator.className = 'status-indicator offline';
      dom.statusIndicator.title = 'Servidor backend offline. Execute server.py';
      dom.statusMessage.textContent = 'Backend offline • Execute python server.py';

      if (dom.modalStatusBox) {
        dom.modalStatusBox.querySelector('.status-indicator-dot').className = 'status-indicator-dot offline';
        dom.modalStatusText.textContent = 'Offline (Não foi possível conectar)';
      }
      return false;
    }
  }

  async function sendMessage() {
    const text = dom.messageInput.value.trim();
    if (!text || state.isWaiting) return;

    // Reseta textarea
    dom.messageInput.value = '';
    adjustTextareaHeight();
    dom.btnClearInput.classList.add('hidden');

    // Adiciona balao de mensagem do usuario
    appendMessage('user', text);
    playSound('send');
    setWaiting(true);

    try {
      const payload = {
        message: text,
        conversation_id: state.conversationId || undefined
      };

      const response = await fetch(`${state.backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro de resposta do servidor (HTTP ${response.status})`);
      }

      const data = await response.json();

      // Atualiza ID da conversa recebido
      if (data.conversation_id) {
        state.conversationId = data.conversation_id;
        localStorage.setItem('ai_agent_conv_id', state.conversationId);
        updateConvTag(state.conversationId);
      }

      const aiText = data.response || 'Sem resposta retornada pelo agente.';
      appendMessage('agent', aiText);
      playSound('receive');

    } catch (err) {
      console.error('Falha na comunicação:', err);
      const errorMsg = `⚠️ **Não foi possível obter resposta do agente no Microsoft Foundry.**\n\n*Detalhes:* \`${err.message}\`\n\n💡 **Dica:** Certifique-se de que o servidor local está rodando executando no terminal:\n\`python server.py\``;
      appendMessage('agent', errorMsg);
      showToast('Erro ao contatar o servidor backend.', 'error');
    } finally {
      setWaiting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Textarea Auto-growth & Helpers
  // ---------------------------------------------------------------------------
  function adjustTextareaHeight() {
    dom.messageInput.style.height = 'auto';
    const newHeight = Math.min(dom.messageInput.scrollHeight, 160);
    dom.messageInput.style.height = `${newHeight}px`;

    if (dom.messageInput.value.length > 0) {
      dom.btnClearInput.classList.remove('hidden');
    } else {
      dom.btnClearInput.classList.add('hidden');
    }
  }

  // ---------------------------------------------------------------------------
  // 8. New Chat & Export Handlers
  // ---------------------------------------------------------------------------
  async function startNewChat() {
    if (state.history.length === 0 && !state.conversationId) return;

    if (confirm('Deseja iniciar uma nova conversa com o agente? A conversa atual será arquivada.')) {
      state.conversationId = null;
      localStorage.removeItem('ai_agent_conv_id');
      state.history = [];
      dom.messagesContainer.innerHTML = '';
      dom.welcomeCard.classList.remove('hidden');
      updateConvTag(null);
      showToast('Nova conversa iniciada!', 'success');

      // Tenta criar nova sessao no backend
      try {
        const res = await fetch(`${state.backendUrl}/api/new_conversation`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.conversation_id) {
            state.conversationId = data.conversation_id;
            localStorage.setItem('ai_agent_conv_id', state.conversationId);
            updateConvTag(state.conversationId);
          }
        }
      } catch {
        // Backend pode estar offline, inicializara no primeiro envio
      }
    }
  }

  function exportChat() {
    if (state.history.length === 0) {
      showToast('Não há mensagens para exportar.', 'info');
      return;
    }

    let markdown = `# Conversa com ${state.agentName} (Microsoft Azure AI Foundry)\n`;
    markdown += `**Data:** ${new Date().toLocaleString('pt-BR')}\n`;
    markdown += `**ID da Conversa:** ${state.conversationId || 'N/A'}\n\n---\n\n`;

    state.history.forEach(item => {
      const author = item.role === 'user' ? 'Você' : state.agentName;
      markdown += `### [${item.time}] ${author}:\n${item.text}\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${state.agentName}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Conversa exportada com sucesso!', 'success');
  }

  // ---------------------------------------------------------------------------
  // 9. Speech-to-Text Recognition (Voice Input)
  // ---------------------------------------------------------------------------
  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dom.btnVoiceInput.title = 'Reconhecimento de voz não suportado neste navegador.';
      dom.btnVoiceInput.style.opacity = '0.4';
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    let isListening = false;

    recognition.onstart = () => {
      isListening = true;
      dom.btnVoiceInput.classList.add('listening');
      dom.btnVoiceInput.title = 'Ouvindo... Fale agora!';
      showToast('Microfone ativado. Fale sua pergunta...', 'info');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      dom.messageInput.value = (dom.messageInput.value + ' ' + transcript).trim();
      adjustTextareaHeight();
      dom.messageInput.focus();
    };

    recognition.onerror = (event) => {
      console.warn('Erro de reconhecimento de fala:', event.error);
      dom.btnVoiceInput.classList.remove('listening');
      isListening = false;
    };

    recognition.onend = () => {
      dom.btnVoiceInput.classList.remove('listening');
      dom.btnVoiceInput.title = 'Falar por voz (Microfone)';
      isListening = false;
    };

    dom.btnVoiceInput.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 10. Event Listeners Binding
  // ---------------------------------------------------------------------------
  function bindEvents() {
    // Envio por clique
    dom.btnSend.addEventListener('click', sendMessage);

    // Envio por teclado (Enter sem Shift)
    dom.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-ajuste de altura do textarea
    dom.messageInput.addEventListener('input', adjustTextareaHeight);

    // Limpar texto
    dom.btnClearInput.addEventListener('click', () => {
      dom.messageInput.value = '';
      adjustTextareaHeight();
      dom.messageInput.focus();
    });

    // Chips de sugestão inicial
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          dom.messageInput.value = prompt;
          adjustTextareaHeight();
          sendMessage();
        }
      });
    });

    // Nova Conversa e Exportar
    dom.btnNewChat.addEventListener('click', startNewChat);
    dom.btnExportChat.addEventListener('click', exportChat);

    // Alternar som
    dom.btnSoundToggle.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('ai_agent_sound', state.soundEnabled);
      dom.iconSoundOn.classList.toggle('hidden', !state.soundEnabled);
      dom.iconSoundOff.classList.toggle('hidden', state.soundEnabled);
      showToast(state.soundEnabled ? 'Efeitos sonoros ativados' : 'Efeitos sonoros desativados');
    });

    // Modal de Configurações
    dom.btnOpenSettings.addEventListener('click', () => {
      dom.cfgBackendUrl.value = state.backendUrl;
      dom.cfgConvId.value = state.conversationId || '(Nenhuma conversa ativa)';
      dom.settingsModal.classList.remove('hidden');
      checkBackendStatus();
    });

    dom.btnCloseModal.addEventListener('click', () => {
      dom.settingsModal.classList.add('hidden');
    });

    dom.settingsModal.addEventListener('click', (e) => {
      if (e.target === dom.settingsModal) {
        dom.settingsModal.classList.add('hidden');
      }
    });

    dom.btnCheckConnection.addEventListener('click', async () => {
      dom.modalStatusText.textContent = 'Testando conexão...';
      const ok = await checkBackendStatus();
      if (ok) {
        showToast('Conexão com o Microsoft Foundry bem-sucedida!', 'success');
      } else {
        showToast('Falha ao conectar com o servidor.', 'error');
      }
    });

    dom.btnSaveSettings.addEventListener('click', () => {
      const newUrl = dom.cfgBackendUrl.value.trim().replace(/\/$/, '');
      if (newUrl) {
        state.backendUrl = newUrl;
        localStorage.setItem('ai_agent_backend_url', newUrl);
      }
      dom.settingsModal.classList.add('hidden');
      checkBackendStatus();
      showToast('Configurações salvas!', 'success');
    });
  }

  // ---------------------------------------------------------------------------
  // 11. App Initialization
  // ---------------------------------------------------------------------------
  function init() {
    updateConvTag(state.conversationId);
    bindEvents();
    setupSpeechRecognition();
    checkBackendStatus();

    // Sincroniza estado inicial do icone de som
    if (!state.soundEnabled) {
      dom.iconSoundOn.classList.add('hidden');
      dom.iconSoundOff.classList.remove('hidden');
    }

    // Foco inicial
    dom.messageInput.focus();
  }

  // Inicia quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
