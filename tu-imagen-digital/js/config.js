export const ASESOR_WEBHOOK = "https://n8n.srv1473142.hstgr.cloud/webhook/tid-asesor";

export const WHATSAPP_NUMERO = "5213326321806";

export const NEGOCIO = {
  nombre: "Tu Imagen Digital",
  claim: "Delegas tu contenido. Nosotros lo hacemos.",
  ciudad: "Guadalajara, Jal.",
  telefono: "33 2632 1806",
  sitio: "tuimagendigital.com"
};

export const PAQUETES = [
  {
    id: "arranque",
    nombre: "Arranque",
    para: "Negocios que apenas empiezan en redes",
    incluye: [
      { id: "video10", qty: 1 },
      { id: "stories", qty: 2 },
      { id: "copypost", qty: 1 },
      { id: "ideas", qty: 3 },
      { id: "subir", qty: 2 }
    ]
  },
  {
    id: "crecimiento",
    nombre: "Crecimiento",
    para: "Ya publicas, pero quieres más alcance",
    destacado: true,
    incluye: [
      { id: "video10", qty: 3 },
      { id: "video31", qty: 1 },
      { id: "stories", qty: 5 },
      { id: "miniaturas", qty: 3 },
      { id: "copypost", qty: 3 },
      { id: "guion10", qty: 3 },
      { id: "programacion", qty: 4 },
      { id: "comentarios", qty: 2 },
      { id: "retro", qty: 1 }
    ]
  },
  {
    id: "todo",
    nombre: "Todo delegado",
    para: "No quieres tocar nada de tus redes",
    incluye: [
      { id: "video10", qty: 4 },
      { id: "video31", qty: 2 },
      { id: "video1a3", qty: 1 },
      { id: "stories", qty: 7 },
      { id: "miniaturas", qty: 4 },
      { id: "copypost", qty: 4 },
      { id: "copyplat", qty: 2 },
      { id: "guion10", qty: 4 },
      { id: "subir", qty: 6 },
      { id: "comentarios", qty: 3 },
      { id: "mensajesredes", qty: 3 },
      { id: "retro", qty: 1 },
      { id: "campana", qty: 1 },
      { id: "metricas", qty: 1 }
    ]
  }
];
