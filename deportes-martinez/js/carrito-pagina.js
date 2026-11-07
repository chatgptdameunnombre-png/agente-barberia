import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=95";
import { setProductos, initCart } from "./cart.js?v=95";
catalogoRapido(list => setProductos(list));
import("./db.js?v=95").then(({ db }) => db.onProducts(list => { guardarCatalogo(list); setProductos(list); })).catch(() => {});
initCart();
