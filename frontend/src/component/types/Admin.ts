import type Employee from "./employee";
import type ProductManager from "./ProductManager";

export default interface Admin{
    prdouctManager: ProductManager[];
    employee: Employee[];
}