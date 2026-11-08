import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=101";
import { setProductos, initCart } from "./cart.js?v=101";
catalogoRapido(list => setProductos(list));
initCart();
