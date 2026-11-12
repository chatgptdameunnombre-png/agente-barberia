import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=114";
import { setProductos, initCart } from "./cart.js?v=114";
catalogoRapido(list => setProductos(list));
initCart();
