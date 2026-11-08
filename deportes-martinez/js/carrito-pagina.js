import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=100";
import { setProductos, initCart } from "./cart.js?v=100";
catalogoRapido(list => setProductos(list));
initCart();
