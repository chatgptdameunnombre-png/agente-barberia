import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=103";
import { setProductos, initCart } from "./cart.js?v=103";
catalogoRapido(list => setProductos(list));
initCart();
