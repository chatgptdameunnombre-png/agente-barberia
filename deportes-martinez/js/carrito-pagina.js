import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=104";
import { setProductos, initCart } from "./cart.js?v=104";
catalogoRapido(list => setProductos(list));
initCart();
