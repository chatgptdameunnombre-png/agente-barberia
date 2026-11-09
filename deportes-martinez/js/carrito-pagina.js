import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=111";
import { setProductos, initCart } from "./cart.js?v=111";
catalogoRapido(list => setProductos(list));
initCart();
