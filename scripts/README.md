# Scripts ByteStorm Tech (.BAT)

Scripts robustos em batch para cada serviço exibido no site. Incluem logging, lock de execução, configuração centralizada e integração com PowerShell.

## Estrutura

```
scripts/
├── Menu-ByteStorm.bat      # Menu interativo
├── _lib/Common.bat           # Biblioteca compartilhada
├── config/
│   ├── Config.example.bat    # Modelo de configuração
│   └── Config.bat            # Sua config (criar a partir do example)
├── services/
│   ├── 01-integracao-api.bat
│   ├── 02-scripts-sob-medida.bat
│   ├── ...
│   └── 12-consultoria-automacao.bat
├── data/input/               # Dados de entrada (CSV demo)
├── data/output/              # Resultados gerados
└── logs/                     # Logs por execução
```

## Mapeamento site → script

| Serviço no site | Script |
|-----------------|--------|
| Integrações de API | `01-integracao-api.bat` |
| Scripts sob medida | `02-scripts-sob-medida.bat` |
| Rotinas agendadas | `03-rotinas-agendadas.bat` |
| ETL e dados | `04-etl-dados.bat` |
| RPA | `05-rpa.bat` |
| E-mail e notificações | `06-email-notificacoes.bat` |
| Planilhas | `07-planilhas.bat` |
| Segurança | `08-seguranca.bat` |
| Automação com Scripts | `09-automacao-scripts.bat` |
| Integração de Sistemas | `10-integracao-sistemas.bat` |
| Service Desk | `11-service-desk.bat` |
| Consultoria em Automação | `12-consultoria-automacao.bat` |

## Uso rápido

1. Abra `Menu-ByteStorm.bat` (duplo clique) ou execute um serviço direto:
   ```bat
   scripts\services\04-etl-dados.bat
   ```
2. No menu, opção **C** cria `config\Config.bat` a partir do exemplo.
3. Edite `config\Config.bat` com URLs de API, SMTP, pastas, etc.
4. Logs em `scripts/logs/`.

## Recursos de robustez

- **Lock file**: impede duas instâncias do mesmo serviço ao mesmo tempo
- **Logs datados**: um arquivo por execução em `logs/`
- **Códigos de saída**: `0` sucesso, `1+` erro, `2` lock/alerta
- **Fallbacks**: Python quando disponível; senão PowerShell
- **Retry**: integração API com tentativas (via lógica PS)

## Requisitos

- Windows 10/11 ou Server
- PowerShell 5.1+
- Opcional: Python 3.x, curl
- Para agendamento: permissão para `schtasks` (opção 3)

## Agendamento no Windows

O script `03-rotinas-agendadas.bat` cria a tarefa `ByteStorm_Automacao_Diaria` (08:00) apontando para o pipeline `09-automacao-scripts.bat`.

## Personalização

- Coloque CSVs em `data/input/`
- Saídas em `data/output/`
- APIs de teste padrão: JSONPlaceholder (substitua em `Config.bat`)

---

**ByteStorm Tech** — Scripts que executam. Processos que escalam.
