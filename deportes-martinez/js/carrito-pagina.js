import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=96";
import { setProductos, initCart } from "./cart.js?v=96";
catalogoRapido(list => setProductos(list));
import("./db.js?v=96").then(({ db }) => db.onProducts(list => { guardarCatalogo(list); setProductos(list); })).catch(() => {});
initCart();
