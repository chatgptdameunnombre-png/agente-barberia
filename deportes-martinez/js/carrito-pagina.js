import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=98";
import { setProductos, initCart } from "./cart.js?v=98";
catalogoRapido(list => setProductos(list));
initCart();
