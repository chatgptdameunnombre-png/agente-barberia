import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=99";
import { setProductos, initCart } from "./cart.js?v=99";
catalogoRapido(list => setProductos(list));
initCart();
