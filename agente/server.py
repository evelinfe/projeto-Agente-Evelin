import json
import os
import sys
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

# Reconfigura stdout para UTF-8 no Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

# Configurações do Agente Microsoft Foundry
ENDPOINT = os.getenv(
    "AZURE_AI_ENDPOINT",
    "https://aula-agente-lucas-resource.services.ai.azure.com/api/projects/aula-agente-lucas",
)
AGENT_NAME = os.getenv("AZURE_AI_AGENT_NAME", "evelin-ferrarini")
PORT = int(os.getenv("PORT", "8000"))

print("==================================================")
print(f" Conectando ao Microsoft Azure AI Foundry...")
print(f" Endpoint: {ENDPOINT}")
print(f" Agente:   {AGENT_NAME}")
print("==================================================")

# Inicializa credencial e cliente Azure
try:
    credential = DefaultAzureCredential()
    project_client = AIProjectClient(
        endpoint=ENDPOINT,
        credential=credential,
        allow_preview=True,
    )
    openai_client = project_client.get_openai_client(agent_name=AGENT_NAME)
    print(" Conexao com Azure AI Foundry estabelecida com sucesso!")
except Exception as e:
    print(f" Aviso ao conectar ao Azure: {e}")
    openai_client = None


class AgentHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve arquivos estaticos do diretorio onde esta este script
        directory = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=directory, **kwargs)

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.OK)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)

        # Rota de status do agente
        if parsed.path == "/api/status":
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._set_cors_headers()
            self.end_headers()
            status_data = {
                "status": "online" if openai_client is not None else "offline",
                "agent_name": AGENT_NAME,
                "endpoint": ENDPOINT,
                "message": "Servidor backend ativo e pronto para receber mensagens.",
            }
            self.wfile.write(json.dumps(status_data, ensure_ascii=False).encode("utf-8"))
            return

        # Rota padrao de arquivos estaticos
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)

        # Rota de nova conversa
        if parsed.path == "/api/new_conversation":
            self._handle_new_conversation()
            return

        # Rota de chat com o agente
        if parsed.path == "/api/chat":
            self._handle_chat()
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Rota nao encontrada")

    def _handle_new_conversation(self):
        try:
            if openai_client is None:
                raise RuntimeError("Cliente Azure OpenAI nao esta inicializado.")

            conversation = openai_client.conversations.create()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._set_cors_headers()
            self.end_headers()
            resp_body = {
                "conversation_id": conversation.id,
                "agent_name": AGENT_NAME,
            }
            self.wfile.write(json.dumps(resp_body, ensure_ascii=False).encode("utf-8"))
        except Exception as err:
            self._send_json_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(err))

    def _handle_chat(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                self._send_json_error(HTTPStatus.BAD_REQUEST, "Corpo da requisicao vazio.")
                return

            body_bytes = self.rfile.read(content_length)
            data = json.loads(body_bytes.decode("utf-8"))

            user_message = data.get("message", "").strip()
            conversation_id = data.get("conversation_id")

            if not user_message:
                self._send_json_error(HTTPStatus.BAD_REQUEST, "Mensagem do usuario nao informada.")
                return

            if openai_client is None:
                raise RuntimeError("Cliente Azure OpenAI nao esta inicializado. Verifique as credenciais.")

            # Se nao tiver conversation_id, cria uma nova
            if not conversation_id:
                conv = openai_client.conversations.create()
                conversation_id = conv.id

            # Envia a mensagem para o agente no Azure Foundry
            ai_response = openai_client.responses.create(
                conversation=conversation_id,
                input=[{"role": "user", "content": user_message}],
            )

            output_text = ai_response.output_text if hasattr(ai_response, "output_text") else str(ai_response)

            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._set_cors_headers()
            self.end_headers()

            response_data = {
                "response": output_text,
                "conversation_id": conversation_id,
                "agent_name": AGENT_NAME,
            }
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode("utf-8"))

        except Exception as err:
            self._send_json_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(err))

    def _send_json_error(self, status_code, message):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._set_cors_headers()
        self.end_headers()
        payload = {"error": message}
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))


def run():
    server_address = ("", PORT)
    httpd = ThreadingHTTPServer(server_address, AgentHTTPHandler)
    print(f"\n Front-end disponivel em: http://localhost:{PORT}")
    print(f" Pressione Ctrl+C para encerrar o servidor.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n Servidor finalizado.")
        httpd.server_close()


if __name__ == "__main__":
    run()
