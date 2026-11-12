import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=116";
import { setProductos, initCart } from "./cart.js?v=116";
catalogoRapido(list => setProductos(list));
initCart();
