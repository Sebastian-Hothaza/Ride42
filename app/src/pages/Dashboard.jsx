import { NavLink, useOutletContext } from "react-router-dom";

import './stylesheets/dashboard.css'
import Login from "./Login";
import ControlPanel from "./ControlPanel";



const Dashboard = () => {
	const { loggedIn } = useOutletContext();
	return (
		<div className="dashboard">
			{/* {loggedIn ? <ControlPanel /> : <Login />}  */}
			<ControlPanel />
		</div>
	);
};

export default Dashboard;