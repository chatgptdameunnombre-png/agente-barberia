export const EUR_RATE = 21;
export const MONTH_MULTIPLIER = 4.4;

export const CATALOGO = [
  {
    "cat": "Edición de video",
    "items": [
      {
        "id": "video10",
        "name": "Video corto de 10 a 30 segundos",
        "price": 441,
        "period": "weekly",
        "unit": "pieza",
        "defaultQty": 3,
        "min": 1,
        "max": 20,
        "detail": "Incluye cortes, subtítulos, ajuste de audio, música, dinamismo, zooms, transiciones, animaciones, foley, corrección de color, textos dinámicos y creación de voz.",
        "checked": false
      },
      {
        "id": "video31",
        "name": "Video de 31 segundos a 1 minuto",
        "price": 540,
        "period": "weekly",
        "unit": "pieza",
        "defaultQty": 1,
        "min": 1,
        "max": 20,
        "detail": "Edición completa y adaptación del contenido según las necesidades del proyecto.",
        "checked": false
      },
      {
        "id": "video1a3",
        "name": "Video de 1 a 3 minutos",
        "price": 720,
        "period": "weekly",
        "unit": "pieza",
        "defaultQty": 1,
        "min": 1,
        "max": 20,
        "detail": "Edición completa y adaptación del contenido según las necesidades del proyecto.",
        "checked": false
      }
    ]
  },
  {
    "cat": "Edición de imagen",
    "items": [
      {
        "id": "pinterest",
        "name": "Adaptación de tamaño y texto para Pinterest",
        "price": 70,
        "period": "weekly",
        "unit": "imagen",
        "defaultQty": 1,
        "min": 1,
        "max": 20,
        "detail": "",
        "checked": false
      }
    ]
  },
  {
    "cat": "Creación de imágenes",
    "items": [
      {
        "id": "miniaturas",
        "name": "Miniaturas",
        "price": 42,
        "period": "weekly",
        "unit": "miniatura",
        "defaultQty": 3,
        "min": 1,
        "max": 20,
        "detail": "Creación de miniaturas para publicaciones o videos.",
        "checked": false
      },
      {
        "id": "logo",
        "name": "Diseño de logo",
        "price": 465,
        "period": "onetime",
        "unit": "proyecto",
        "defaultQty": 1,
        "detail": "Una vez. Incluye 2 rondas de revisión.",
        "checked": false
      },
      {
        "id": "stories",
        "name": "Diseño de stories",
        "price": 25,
        "period": "weekly",
        "unit": "story",
        "defaultQty": 3,
        "min": 1,
        "max": 20,
        "detail": "Puedes seleccionar la cantidad de stories que necesites.",
        "checked": false
      }
    ]
  },
  {
    "cat": "Contenido escrito",
    "items": [
      {
        "id": "copypost",
        "name": "Copy para post",
        "price": 42,
        "period": "weekly",
        "unit": "copy",
        "defaultQty": 1,
        "min": 1,
        "max": 20,
        "checked": false
      },
      {
        "id": "copyplat",
        "name": "Copy por plataforma",
        "price": 42,
        "period": "weekly",
        "unit": "plataforma",
        "defaultQty": 1,
        "min": 1,
        "max": 6,
        "checked": false
      },
      {
        "id": "ideas",
        "name": "Ideas de contenido",
        "price": 14,
        "period": "weekly",
        "unit": "idea",
        "defaultQty": 1,
        "min": 1,
        "max": 20,
        "checked": false
      },
      {
        "id": "guion10",
        "name": "Guión para video de 10 a 30 segundos",
        "price": 81,
        "period": "weekly",
        "unit": "guión",
        "defaultQty": 1,
        "min": 1,
        "max": 20,
        "checked": false
      },
      {
        "id": "guion31",
        "name": "Guión para video de 31 segundos a 1 minuto",
        "price": 90,
        "period": "weekly",
        "unit": "guión",
        "defaultQty": 1,
        "min": 1,
        "max": 20,
        "checked": false
      },
      {
        "id": "guion1a3",
        "name": "Guión para video de 1 a 3 minutos",
        "price": 126,
        "period": "weekly",
        "unit": "guión",
        "defaultQty": 1,
        "min": 1,
        "max": 20,
        "checked": false
      }
    ]
  },
  {
    "cat": "Gestión de publicación",
    "items": [
      {
        "id": "subir",
        "name": "Subir contenido",
        "price": 27,
        "period": "weekly",
        "unit": "pieza",
        "defaultQty": 1,
        "min": 1,
        "max": 30,
        "detail": "Precio por pieza publicada. Si no seleccionas este servicio, no es necesario proporcionar acceso a tus redes sociales.",
        "checked": false,
        "exclusiveGroup": "pub"
      },
      {
        "id": "programacion",
        "name": "Programación de contenido",
        "price": 27,
        "period": "weekly",
        "unit": "pieza",
        "defaultQty": 1,
        "min": 1,
        "max": 30,
        "detail": "Precio por pieza programada. Puedes elegir programación en lugar de publicación manual.",
        "checked": false,
        "exclusiveGroup": "pub"
      }
    ]
  },
  {
    "cat": "Comunidad",
    "items": [
      {
        "id": "comentarios",
        "name": "Contestar comentarios durante 20 minutos",
        "price": 81,
        "period": "weekly",
        "unit": "bloque de 20 min",
        "defaultQty": 1,
        "min": 1,
        "max": 10,
        "checked": false
      },
      {
        "id": "reacciones",
        "name": "Reaccionar a comentarios durante 15 minutos",
        "price": 72,
        "period": "weekly",
        "unit": "bloque de 15 min",
        "defaultQty": 1,
        "min": 1,
        "max": 10,
        "checked": false
      },
      {
        "id": "mensajesredes",
        "name": "Contestar mensajes durante 10 minutos",
        "price": 45,
        "period": "weekly",
        "unit": "bloque de 10 min",
        "defaultQty": 1,
        "min": 1,
        "max": 10,
        "checked": false
      }
    ]
  },
  {
    "cat": "Estrategia",
    "items": [
      {
        "id": "retro",
        "name": "Sesión de retroalimentación con el gestor de redes",
        "price": 180,
        "period": "monthly",
        "unit": "sesión de 30 min",
        "defaultQty": 1,
        "min": 1,
        "max": 10,
        "detail": "Sesión mensual de 30 minutos para revisar propuestas de mejora, ajustes de contenido y necesidades de las redes.",
        "checked": false
      },
      {
        "id": "campana",
        "name": "Campaña publicitaria en Facebook e Instagram",
        "price": 720,
        "period": "monthly",
        "unit": "campaña",
        "defaultQty": 1,
        "min": 1,
        "max": 3,
        "detail": "Incluye edición del video creativo, creación, gestión, optimización y medición del anuncio. No incluye responder mensajes generados por la campaña ni la inversión publicitaria directa en Meta.",
        "checked": false
      }
    ]
  },
  {
    "cat": "Soporte básico Shopify",
    "items": [
      {
        "id": "shopifybasica",
        "name": "Carga básica de producto",
        "price": 144,
        "period": "onetime",
        "unit": "producto",
        "defaultQty": 1,
        "min": 1,
        "max": 100,
        "detail": "Carga de producto con la información e imágenes proporcionadas. Pago único por producto.",
        "checked": false
      },
      {
        "id": "shopifyopt",
        "name": "Carga de producto + optimización",
        "price": 261,
        "period": "onetime",
        "unit": "producto",
        "defaultQty": 1,
        "min": 1,
        "max": 100,
        "detail": "Carga del producto y optimización de textos, estructura y presentación. Pago único por producto.",
        "checked": false
      }
    ]
  },
  {
    "cat": "Atención WhatsApp",
    "items": [
      {
        "id": "waauto",
        "name": "Configurar respuestas automáticas",
        "price": 28,
        "period": "onetime",
        "unit": "respuesta",
        "defaultQty": 1,
        "min": 1,
        "max": 100,
        "detail": "Pago único por respuesta automática. Puedes configurar hasta 100 respuestas.",
        "checked": false
      },
      {
        "id": "waresp",
        "name": "Responder mensajes por un humano",
        "price": 3.15,
        "period": "monthly",
        "unit": "minuto",
        "defaultQty": 20,
        "special": "humanHours",
        "detail": "Atención humana mensual. Puedes seleccionar diferentes cantidades de minutos según el nivel de atención que necesites.",
        "checked": false
      },
      {
        "id": "chatbot",
        "name": "Configurar chatbot para responder WhatsApp con IA",
        "price": 3510,
        "period": "onetime",
        "unit": "configuración",
        "defaultQty": 1,
        "detail": "Configuración inicial del chatbot con IA.",
        "checked": false
      },
      {
        "id": "chatbotmonthly",
        "name": "Mantenimiento y operación mensual del chatbot con IA",
        "price": 400,
        "period": "monthly",
        "unit": "mes",
        "defaultQty": 1,
        "detail": "Costo mensual posterior a la configuración.",
        "checked": false
      }
    ]
  },
  {
    "cat": "Distribución y crecimiento",
    "items": [
      {
        "id": "colabs",
        "name": "Búsqueda de colaboraciones en Instagram",
        "price": 56,
        "period": "weekly",
        "unit": "búsqueda",
        "defaultQty": 1,
        "min": 1,
        "max": 10,
        "checked": false
      },
      {
        "id": "dms",
        "name": "Contacto con cuentas mediante mensajes directos",
        "price": 42,
        "period": "weekly",
        "unit": "contacto",
        "defaultQty": 1,
        "min": 1,
        "max": 20,
        "checked": false
      },
      {
        "id": "grupos",
        "name": "Compartir en grupos de Facebook",
        "price": 36,
        "period": "weekly",
        "unit": "20 grupos",
        "defaultQty": 1,
        "min": 1,
        "max": 10,
        "detail": "",
        "checked": false
      },
      {
        "id": "metricas",
        "name": "Investigación de contenido",
        "price": 295,
        "period": "monthly",
        "unit": "reporte mensual",
        "defaultQty": 1,
        "detail": "Incluye análisis de métricas y reporte corto de recomendaciones.",
        "checked": false
      }
    ]
  },
  {
    "cat": "Creación de cuentas — pago único",
    "items": [
      {
        "id": "tiktok",
        "name": "TikTok",
        "price": 90,
        "period": "onetime",
        "unit": "cuenta",
        "defaultQty": 1,
        "checked": false
      },
      {
        "id": "youtube",
        "name": "YouTube",
        "price": 90,
        "period": "onetime",
        "unit": "cuenta",
        "defaultQty": 1,
        "checked": false
      },
      {
        "id": "fbig",
        "name": "Facebook e Instagram",
        "price": 150,
        "period": "onetime",
        "unit": "cuentas",
        "defaultQty": 1,
        "checked": false
      },
      {
        "id": "google",
        "name": "Google Business",
        "price": 120,
        "period": "onetime",
        "unit": "cuenta",
        "defaultQty": 1,
        "detail": "Incluye 5 reseñas.",
        "checked": false
      },
      {
        "id": "wabiz",
        "name": "WhatsApp Business",
        "price": 90,
        "period": "onetime",
        "unit": "cuenta",
        "defaultQty": 1,
        "checked": false
      },
      {
        "id": "pinterestcta",
        "name": "Pinterest",
        "price": 90,
        "period": "onetime",
        "unit": "cuenta",
        "defaultQty": 1,
        "checked": false
      }
    ]
  }
];

export const PLANOS = CATALOGO.flatMap(c => c.items.map(i => ({ ...i, cat: c.cat })));
export const porId = id => PLANOS.find(s => s.id === id);
