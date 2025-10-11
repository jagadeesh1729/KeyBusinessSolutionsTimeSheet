import CustomListItem from "../mocules/CustomListItem"
import EmployeeView from "../mocules/EmployeeView"
import ProjectManagerView from "../mocules/ProjectManagerView"
import ProjectsView from "../mocules/ProjectsView"
const AdminHomePage = () => {
  return (
    <div className="p-4">
      <CustomListItem/>
      <h1 className="text-3xl font-bold underline">Projects</h1>
      <ProjectsView/>
      <h1 className="text-3xl font-bold underline">Pms</h1>
      <ProjectManagerView/>
      <h1 className="text-3xl font-bold underline mt-4">Employees</h1>
      <EmployeeView />
    </div>
  )
}

export default AdminHomePage
