const RESP=[
["Pedro Gonçalves da Mota","Data Owner","cliente, endereco (dados pessoais, LGPD)"],
["Alessandro Tavares Brandão","Data Owner","plano, assinatura, caixa_atendimento"],
["Júlio César Marques de Sousa","Data Owner","cobranca, pagamento (retenção fiscal PR01)"],
["Tayrone Henrique do Carmo","Data Steward","cobranca, pagamento, ordem_servico"],
["Rúben Tavares Nascimento","Data Steward","usuario, log_auditoria (acesso e auditoria)"],
["Keveny Santos","Data Steward","equipamento, vinculo_equipamento, evento_conexao"]];
const U="BIGINT UNSIGNED";
// coluna: [atributo, descricao, tipo, constraints, privacidade(S/P/N), linhagem?, rbac?]
const T=[
{n:"cliente",d:"Pessoa física ou jurídica que contrata o serviço (RF01). Exclusão lógica via ativo; anonimização irreversível a pedido do titular (PR03).",
lin:"Origem: cadastro manual (Atendente/Admin). Destino: assinatura, endereco, relatórios RF09.",rbac:"Admin: CRU; Atendente: CRU; Tecnico: R (consulta).",c:[
["id_cliente","Identificador único do cliente.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["nome","Nome completo ou razão social.","VARCHAR(255)","NOT NULL","P"],
["cpf_cnpj","CPF/CNPJ somente dígitos; único; rejeita duplicidade (RF01).","VARCHAR(14)","[UNIQUE] NOT NULL","P"],
["telefone","Telefone WhatsApp para contato.","VARCHAR(20)","NOT NULL","P"],
["email","E-mail opcional.","VARCHAR(255)","NULL","P"],
["data_consentimento","Data/hora do consentimento LGPD (PR03).","TIMESTAMP","NOT NULL","P"],
["ativo","Situação lógica: 1 ativo, 0 inativo. Padrão 1.","TINYINT(1)","NOT NULL DEFAULT 1","N"]]},
{n:"endereco",d:"Endereço de instalação vinculado ao cliente; um cliente pode ter vários endereços.",
lin:"Origem: cadastro (RF01). Destino: assinatura (local de instalação), ordem_servico.",rbac:"Admin: CRU; Atendente: CRU; Tecnico: R.",c:[
["id_endereco","Identificador único do endereço.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["id_cliente","Cliente dono do endereço.",U,"[FK] cliente.id_cliente NOT NULL","N"],
["logradouro","Rua/avenida.","VARCHAR(255)","NOT NULL","P"],
["numero","Número do imóvel.","VARCHAR(20)","NOT NULL","P"],
["complemento","Complemento (opcional).","VARCHAR(100)","NULL","P"],
["bairro","Bairro.","VARCHAR(100)","NOT NULL","P"],
["cep","CEP com 8 dígitos, sem máscara.","CHAR(8)","NOT NULL","P"],
["cidade","Cidade.","VARCHAR(100)","NOT NULL","N"],
["uf","Sigla do estado.","CHAR(2)","NOT NULL","N"]]},
{n:"usuario",d:"Operador do sistema com perfil de acesso RBAC (Administrador, Atendente, Técnico).",
lin:"Origem: cadastro pelo Admin. Destino: ordem_servico, pagamento, log_auditoria.",rbac:"Admin: CRU; demais perfis: sem acesso (exceto o próprio login).",c:[
["id_usuario","Identificador único do usuário.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["nome","Nome do operador.","VARCHAR(150)","NOT NULL","P"],
["login","Login único de acesso.","VARCHAR(50)","[UNIQUE] NOT NULL","P"],
["senha_hash","Hash da senha; nunca em texto claro.","VARCHAR(255)","NOT NULL","P","Origem: aplicação (hash). Destino: autenticação.","Somente a aplicação; ninguém lê."],
["perfil","Perfil RBAC do operador.","ENUM('Admin','Atendente','Tecnico')","NOT NULL","N"],
["ativo","Situação lógica do usuário.","TINYINT(1)","NOT NULL DEFAULT 1","N"]]},
{n:"plano",d:"Catálogo de planos mensais de internet. Reajuste não altera cobranças já emitidas (RN03).",
lin:"Origem: cadastro pelo Admin. Destino: assinatura, geração de cobrança (RF06).",rbac:"Admin: CRU; Atendente: R; Tecnico: R.",c:[
["id_plano","Identificador único do plano.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["nome","Nome comercial do plano.","VARCHAR(100)","[UNIQUE] NOT NULL","N"],
["velocidade_mbps","Velocidade contratada em Mbps; deve ser maior que 0.","INT","NOT NULL","N"],
["valor_mensal","Valor mensal vigente; maior ou igual a 0.","DECIMAL(10,2)","NOT NULL","N"],
["ativo","Plano disponível para novas assinaturas.","TINYINT(1)","NOT NULL DEFAULT 1","N"]]},
{n:"caixa_atendimento",d:"Caixa óptica (NAP) com número limitado de portas; base da regra RN01 (vaga de porta).",
lin:"Origem: cadastro técnico. Destino: assinatura (validação de porta livre).",rbac:"Admin: CRU; Atendente: R; Tecnico: CRU.",c:[
["id_caixa","Identificador único da caixa.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["identificacao","Código/etiqueta da caixa.","VARCHAR(50)","[UNIQUE] NOT NULL","N"],
["localizacao","Localização física na rede externa.","VARCHAR(255)","NOT NULL","N"],
["capacidade_portas","Total de portas; deve ser maior que 0.","INT","NOT NULL","N"]]},
{n:"equipamento",d:"Modems e roteadores da empresa, com controle de estoque e situação (RF04).",
lin:"Origem: cadastro/estoque (Admin/Técnico). Destino: vinculo_equipamento.",rbac:"Admin: CRU; Atendente: R; Tecnico: CRU.",c:[
["id_equipamento","Identificador único do equipamento.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["modelo","Modelo do aparelho.","VARCHAR(100)","NOT NULL","N"],
["numero_serie","Número de série único.","VARCHAR(100)","[UNIQUE] NOT NULL","N"],
["mac","Endereço MAC único (formato AA:BB:CC:DD:EE:FF).","CHAR(17)","[UNIQUE] NOT NULL","N"],
["situacao","Situação do equipamento no ciclo de vida.","ENUM('estoque','uso','manutencao','baixado')","NOT NULL","N"]]},
{n:"assinatura",d:"Contratação de um plano por um cliente em um endereço e caixa de atendimento (RF03; RN01, RN06, PR02).",
lin:"Origem: contratação (Atendente/Admin). Destino: cobranca, ordem_servico, evento_conexao, vinculo_equipamento.",rbac:"Admin: CRU; Atendente: CRU; Tecnico: R.",c:[
["id_assinatura","Identificador único da assinatura.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["id_cliente","Cliente contratante.",U,"[FK] cliente.id_cliente NOT NULL","N"],
["id_plano","Plano contratado.",U,"[FK] plano.id_plano NOT NULL","N"],
["id_endereco","Endereço de instalação.",U,"[FK] endereco.id_endereco NOT NULL","N"],
["id_caixa","Caixa de atendimento utilizada (RN01).",U,"[FK] caixa_atendimento.id_caixa NOT NULL","N"],
["data_contratacao","Data da contratação; base do prazo de 7 dias (PR02).","DATE","NOT NULL","N"],
["data_cancelamento","Data do cancelamento, se houver.","DATE","NULL","N"],
["dia_vencimento","Dia do mês de vencimento das cobranças.","TINYINT(1)","NOT NULL","N"],
["situacao","Situação contratual.","ENUM('ativa','suspensa','bloqueada','cancelada')","NOT NULL","N"]]},
{n:"ordem_servico",d:"Visita ou atendimento técnico: instalação, manutenção, mudança de endereço, troca de aparelho (RF05; RN02, RN04).",
lin:"Origem: abertura (Atendente/Técnico). Destino: cobranca (taxas avulsas RN07), relatórios.",rbac:"Admin: CRU; Atendente: CRU; Tecnico: RU (suas OS).",c:[
["id_os","Identificador único da OS.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["id_assinatura","Assinatura atendida (RN02).",U,"[FK] assinatura.id_assinatura NOT NULL","N"],
["id_usuario","Usuário responsável (RN02).",U,"[FK] usuario.id_usuario NOT NULL","N"],
["tipo","Tipo de serviço.","ENUM('instalacao','manutencao','mudanca_endereco','troca_aparelho')","NOT NULL","N"],
["situacao","Situação da OS.","ENUM('aberta','agendada','concluida','cancelada')","NOT NULL","N"],
["data_abertura","Data/hora de abertura.","DATETIME","NOT NULL","N"],
["data_agendada","Data/hora agendada.","DATETIME","NULL","N"],
["data_conclusao","Data/hora de conclusão.","DATETIME","NULL","N"],
["valor_cobrado","Taxa da OS (RN04: 1ª mudança R$ 0,00; demais R$ 50,00; troca de aparelho R$ 0,00).","DECIMAL(10,2)","NOT NULL","N"]]},
{n:"cobranca",d:"Mensalidade emitida por assinatura, com valor congelado na geração (RN03, RN07). Retenção de 5 anos (PR01).",
lin:"Origem: geração mensal (plano + taxas OS - desconto). Destino: pagamento, relatórios financeiros.",rbac:"Admin: CRU; Atendente: CRU; Tecnico: sem acesso. Sem DELETE (PR01).",c:[
["id_cobranca","Identificador único da cobrança.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["id_assinatura","Assinatura cobrada.",U,"[FK] assinatura.id_assinatura NOT NULL","N"],
["competencia","Mês de competência (AAAA-MM).","VARCHAR(7)","NOT NULL","N"],
["data_vencimento","Data de vencimento.","DATE","NOT NULL","N"],
["desconto","Desconto concedido; maior ou igual a 0.","DECIMAL(10,2)","NOT NULL DEFAULT 0.00","N"],
["valor_total","Valor final congelado na geração (RN03, RN07).","DECIMAL(10,2)","NOT NULL","N"],
["situacao","Situação da cobrança.","ENUM('pendente','paga','vencida','estornada')","NOT NULL","N"]]},
{n:"pagamento",d:"Pagamento registrado manualmente que dá baixa em uma cobrança (RF07; RN02, RN06). Retenção de 5 anos (PR01).",
lin:"Origem: baixa manual (Atendente/Admin). Destino: atualização de cobranca e assinatura (RN06).",rbac:"Admin: CRU; Atendente: CR; Tecnico: sem acesso. Sem DELETE (PR01).",c:[
["id_pagamento","Identificador único do pagamento.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["id_cobranca","Cobrança quitada.",U,"[FK] cobranca.id_cobranca NOT NULL","N"],
["id_usuario","Operador que registrou a baixa (RN02).",U,"[FK] usuario.id_usuario NOT NULL","N"],
["valor_pago","Valor efetivamente pago.","DECIMAL(10,2)","NOT NULL","N"],
["data_pagamento","Data/hora do pagamento.","DATETIME","NOT NULL","N"],
["forma","Forma de pagamento.","ENUM('Pix','boleto','dinheiro')","NOT NULL","N"]]},
{n:"evento_conexao",d:"Registro imutável (append-only) de mudança de status online/offline (RF08; RN08). Guarda sigilosa de 1 ano (PR04).",
lin:"Origem: aplicação coletora externa. Destino: relatórios de tempo offline (RF09).",rbac:"Admin: R e INSERT pela aplicação; Atendente: R; Tecnico: R. Sem UPDATE/DELETE (PR04).",c:[
["id_evento","Identificador único do evento.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["id_assinatura","Assinatura monitorada.",U,"[FK] assinatura.id_assinatura NOT NULL","N"],
["status","Status da conexão.","ENUM('online','offline')","NOT NULL","N"],
["data_hora","Data/hora do evento.","TIMESTAMP","NOT NULL","N"],
["ip_atribuido","Endereço IP atribuído (IPv4/IPv6); registro de conexão.","VARCHAR(45)","NULL","P"]]},
{n:"log_auditoria",d:"Trilha de auditoria append-only das operações sensíveis (RNF01).",
lin:"Origem: gatilhos nas tabelas sensíveis. Destino: auditorias e investigações.",rbac:"Admin: R; demais: sem acesso. INSERT apenas por gatilho/aplicação.",c:[
["id_log","Identificador único do log.",U,"[PK] AUTO_INCREMENT NOT NULL","N"],
["id_usuario","Usuário autor da operação.",U,"[FK] usuario.id_usuario NOT NULL","N"],
["tabela_afetada","Tabela alterada.","VARCHAR(100)","NOT NULL","N"],
["id_registro_afetado","Chave do registro alterado.",U,"NOT NULL","N"],
["operacao","Operação realizada (INSERT, UPDATE, exclusão lógica).","VARCHAR(50)","NOT NULL","N"],
["data_hora","Data/hora da operação.","TIMESTAMP","NOT NULL","N"],
["valor_anterior","Valor antes da alteração (pode conter dado pessoal).","TEXT","NULL","P"],
["valor_novo","Valor após a alteração (pode conter dado pessoal).","TEXT","NULL","P"]]},
{n:"vinculo_equipamento",d:"Entidade associativa: uso de um equipamento por uma assinatura ao longo do tempo (RF04; RN05). Nomes e tipos conforme o DDL atual; ver divergências na Parte 2.",
lin:"Origem: instalação/troca (Técnico). Destino: controle de comodato e estoque.",rbac:"Admin: CRU; Atendente: R; Tecnico: CRU.",c:[
["idvinculo_equipamento","Identificador do vínculo (no DDL sem AUTO_INCREMENT).","INT","[PK] NOT NULL","N"],
["assinatura_id_assinatura","Assinatura que usa o equipamento.",U,"[FK] assinatura.id_assinatura NOT NULL","N"],
["equipamento_id_equipamento","Equipamento vinculado.",U,"[FK] equipamento.id_equipamento NOT NULL","N"],
["data_inicio","Início do vínculo.","DATE","NOT NULL","N"],
["data_fim","Fim do vínculo; NULL indica vínculo vigente.","DATE","NULL","N"],
["id_equipamento_ativo","Destinada à coluna gerada da RN05; no DDL atual é coluna comum.","INT","NOT NULL","N"]]}];
const PB={S:'<span class="badge dps">DPS</span>',P:'<span class="badge dp">DP</span>',N:'<span class="badge na">N/A</span>'};
const $=s=>document.querySelector(s);
$("#resp").innerHTML=RESP.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("");
$("#navList").innerHTML=T.map(t=>`<a href="#${t.n}">${t.n}</a>`).join("");
$("#dict").innerHTML=T.map(t=>`<section class="card tbl" id="${t.n}" data-n="${t.n}"><h2>${t.n}</h2><p class="tdesc">${t.d}</p><div class="table-wrap"><table><thead><tr><th>Atributo</th><th>Descrição / Regra de Negócio</th><th>Tipo e Tamanho</th><th>Constraints</th><th>Privacidade (LGPD/GDPR)</th><th>Linhagem</th><th>Controle de Acesso (RBAC)</th></tr></thead><tbody>${t.c.map(c=>`<tr data-k="${(t.n+' '+c[0]).toLowerCase()}"><td><code>${c[0]}</code></td><td>${c[1]}</td><td>${c[2]}</td><td><b>${c[3]}</b></td><td>${PB[c[4]]}</td><td>${c[5]||t.lin}</td><td>${c[6]||t.rbac}</td></tr>`).join("")}</tbody></table></div></section>`).join("");
$("#search").addEventListener("input",e=>{const q=e.target.value.trim().toLowerCase();let any=false;
 document.querySelectorAll(".tbl").forEach(s=>{const tm=s.dataset.n.includes(q);let n=0;
  s.querySelectorAll("tbody tr").forEach(r=>{const ok=!q||tm||r.dataset.k.includes(q);r.hidden=!ok;if(ok)n++});
  s.hidden=n===0;if(n)any=true});
 $("#empty").hidden=any;});
$("#themeBtn").onclick=()=>{const d=document.documentElement,x=d.dataset.theme==="dark";d.dataset.theme=x?"light":"dark";$("#themeBtn").textContent=x?"Modo escuro":"Modo claro"};
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
$("#sidebar").onclick=e=>{if(e.target.tagName==="A")$("#sidebar").classList.remove("open")};
let pz=null;
$("#derBtn").onclick=()=>{$("#modal").hidden=false;if(!pz){const img=$("#derImg");pz=Panzoom(img,{maxScale:10,minScale:0.5,contain:false});$("#stage").addEventListener("wheel",pz.zoomWithWheel)}pz.reset({animate:false})};
$("#zin").onclick=()=>pz&&pz.zoomIn();$("#zout").onclick=()=>pz&&pz.zoomOut();$("#zrst").onclick=()=>pz&&pz.reset();
$("#zclose").onclick=()=>$("#modal").hidden=true;
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#modal").hidden=true});
