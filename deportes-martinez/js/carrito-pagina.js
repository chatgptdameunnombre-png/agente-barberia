import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=119";
import { setProductos, initCart } from "./cart.js?v=119";
catalogoRapido(list => setProductos(list));
initCart();
