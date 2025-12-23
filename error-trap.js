// ===================================
// Hyper-Aggressive Error Interceptor
// ===================================

(function () {
    const ACCOUNT_ERROR_MSG = "🚨 BLOQUEIO DE CONTA DETECTADO (GOOGLE) 🚨\n\nSua chave de API está em um projeto restrito. O Google recusou a geração.\n\nRESOLUÇÃO:\n1. No AI Studio, crie uma chave em 'Create API key in NEW project'.\n2. NÃO use projetos antigos.\n\nAtivei o Modo Manual para você continuar!";

    function handleAccountError() {
        alert(ACCOUNT_ERROR_MSG);
        localStorage.setItem('manual_mode', 'true');
        location.reload(); // Força o refresh com modo manual ativo
    }

    // Intercepta erros globais de runtime
    window.onerror = function (message, source, lineno, colno, error) {
        const msg = (message || "").toString().toLowerCase();
        if (msg.includes("must contain") || msg.includes("empty") || msg.includes("output text")) {
            handleAccountError();
            return true;
        }
        return false;
    };

    // Intercepta erros de Promise (como o fetch do Gemini)
    window.onunhandledrejection = function (event) {
        const msg = (event.reason?.message || event.reason || "").toString().toLowerCase();
        if (msg.includes("must contain") || msg.includes("empty") || msg.includes("output text")) {
            handleAccountError();
            event.preventDefault();
        }
    };

    // Proxy para o console.error (onde o erro costuma aparecer primeiro)
    const originalConsoleError = console.error;
    console.error = function () {
        const args = Array.from(arguments);
        const fullMsg = args.join(" ").toLowerCase();
        if (fullMsg.includes("must contain") || fullMsg.includes("empty") || fullMsg.includes("output text")) {
            handleAccountError();
        }
        originalConsoleError.apply(console, arguments);
    };

    console.log("🛡️ Filtro de Restrição do Google Ativado.");
})();
