import type Project from "./project";
import type ProductManager from "./ProductManager";
export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  PROJECT_MANAGER = 'project_manager',
}
export default  interface Employee{
    id:number;
    first_name:string; 
    last_name:string;
    email:string;
    phone:string;
    location?: string | null;
    college_name?:string | null;
    college_address?:string | null;
    degree?:string | null;
    college_Dso_name?: string | null;
    college_Dso_email?: string | null;
    college_Dso_phone?: string | null;
    // Primary Emergency Contact
    primary_emergency_contact_full_name?: string | null;
    primary_emergency_contact_relationship?: string | null;
    primary_emergency_contact_home_phone?: string | null;
    // Secondary Emergency Contact
    secondary_emergency_contact_full_name?: string | null;
    secondary_emergency_contact_relationship?: string | null;
    secondary_emergency_contact_home_phone?: string | null;
    job_title?:string;//rajan
    job_start_date?:string; //rajan
    employement_start_date?: string | null;
    start_date?:string
    end_date?:string;
    visa_status?:string;
    job_duties?:string;//rajan
    date_of_birth?: string;
    project: Project[];
    project_ids?: number[];
    project_manager?: ProductManager | null;
    project_manager_id?: number | null;
    compensation?: string | null; //rajan -no of hours vis type 
    Performance_review?: string | null; 
    reports?:string //rajan reports 
    role: UserRole;
    no_of_hours: number;
    offerLetter?: {
      content: string;
      lastEditedBy?: string;
      lastEditedAt?: string; // ISO string
    };

}
 
