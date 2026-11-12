import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=118";
import { setProductos, initCart } from "./cart.js?v=118";
catalogoRapido(list => setProductos(list));
initCart();
