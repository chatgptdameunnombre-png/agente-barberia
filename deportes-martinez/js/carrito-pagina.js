import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=106";
import { setProductos, initCart } from "./cart.js?v=106";
catalogoRapido(list => setProductos(list));
initCart();
