export const ICONO_ARMA = {
  portales: ['cuerno', 1], guante: ['guante', 2], gancho: ['hilo', 1], pico: ['pico', 0],
  manoP: ['mano', 2], cazador: ['insignias', 7], cuchillos: ['cuchillo', 0],
  hachaArma: ['hacha', 0], jabalina: ['jabalina', 1]
};

export function texturaIcono(recursos, art, suelo) {
  const celda = (hoja, i) => (recursos[hoja] && recursos[hoja][i]) || null;
  const fijo = ICONO_ARMA[art.id];
  let t = fijo ? celda(fijo[0], fijo[1]) : null;
  if (!t && art.hoja) t = celda(art.hoja, art.celda);
  if (!t && suelo) t = celda('items', art.celda);
  if (!t && art.delSuelo !== undefined) t = celda('items', art.delSuelo);
  if (!t) t = celda('tienda', art.celda) || celda('items', art.respaldo);
  return t && t.image ? t : null;
}

export function urlIcono(recursos, art, suelo) {
  const t = texturaIcono(recursos, art, suelo);
  return t ? `url(${t.image.toDataURL()})` : '';
}
