# ByteStorm Tech - Sites, Automação e Sistemas sob Medida

Repositório do site da ByteStorm Tech — especializada em desenvolvimento de sites, landing pages, automação de sistemas e integrações com scripts Python, JavaScript e PowerShell.

## Sobre

A ByteStorm Tech desenvolve sites profissionais, landing pages e automações sob medida: integrações de API, ETL, RPA, rotinas agendadas e suporte técnico.

### Serviços

- **Automação com Scripts**: Python, JavaScript, PowerShell e Bash
- **Integração de Sistemas**: APIs REST, webhooks, CRM, ERP
- **ETL e Dados**: Pipelines entre bancos, planilhas e APIs
- **Service Desk**: Monitoramento e suporte 24/7

## Instalação local

```bash
git clone https://github.com/costC22/NovoSiteCreativeLink.git
cd SiteByteStorm
python -m http.server 8000
```

Abra `http://localhost:8000` no navegador.

## Scripts de automação (.BAT)

Pasta `scripts/` com 12 serviços em batch + PowerShell, menu interativo e logs.

```bat
scripts\Menu-ByteStorm.bat
```

Ver `scripts/README.md` para detalhes.

## Estrutura

```
SiteByteStorm/
├── scripts/         # Automações .bat por serviço do site
├── index.html       # Página principal
├── solucoes.html    # Soluções de automação
├── atendimento.html # Contato
├── ferramentas.html # Recursos técnicos
├── styles.css       # Tema tech (grid, glow, terminal)
└── script.js        # Interações e contadores
```

## Design

- Cores: `#1a1f33` (fundo), `#00c0a3` (teal), `#e74c3c` (accent)
- Grid animado, glow effects, terminal com syntax highlight
- Fonte mono: JetBrains Mono

---

**ByteStorm Tech** — Sites, automações e integrações para empresas que querem operar melhor.

## Segurança

- O formulário público envia para `/api/contact`; o destino real de e-mail deve ficar somente na variável de ambiente `CONTACT_FORWARD_URL` no Netlify.
- Não coloque tokens, endpoints privados ou chaves em HTML, CSS ou JavaScript público.
- A função valida origem, tamanho do payload, campos permitidos, honeypot, padrões suspeitos e limite de tentativas por instância.
- CSP, HSTS, clickjacking protection, permissions policy e relatórios CSP estão configurados em `_headers`.
- Métricas públicas: `/api/security-metrics` e `/.well-known/security-metrics.json`.

Para auditar localmente:

```bash
node scripts/security-audit.mjs --check
```

### Camada anti-DDoS e injeções

- `netlify/edge-functions/request-shield.js` roda na borda para limitar excesso de requisições e bloquear probes comuns antes de chegar ao site.
- `/api/contact` tem rate limit próprio, limite de payload, allow-list de campos e bloqueio de padrões de SQL injection, XSS, command injection, SSRF e path traversal.
- O site não usa banco de dados no front-end; caso um banco seja adicionado no futuro, use queries parametrizadas/prepared statements e conta de menor privilégio.
