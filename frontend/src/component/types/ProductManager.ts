import type Employee from "./employee";
import type Project from "./project";

export default interface ProductManager {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    project: Project[];
    employees: Employee[];
}