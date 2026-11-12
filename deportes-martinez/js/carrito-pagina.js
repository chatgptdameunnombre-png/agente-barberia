import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=121";
import { setProductos, initCart } from "./cart.js?v=121";
catalogoRapido(list => setProductos(list));
initCart();
