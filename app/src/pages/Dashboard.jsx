import { NavLink, useOutletContext } from "react-router-dom";

import './stylesheets/dashboard.css'
import Login from "./Login";
import ControlPanel from "./ControlPanel";



const Dashboard = () => {
	const { loggedIn } = useOutletContext();
	const { APIServer } = useOutletContext();
	return (
		<div className="dashboard">
			{loggedIn ? <ControlPanel APIServer={APIServer} /> : <Login />} 
		</div>
	);
};

export default Dashboard;