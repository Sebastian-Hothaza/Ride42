import { NavLink, useOutletContext } from "react-router-dom";


import Login from "./Login";
import ControlPanel from "./ControlPanel";



const Dashboard = () => {
	const { loggedIn } = useOutletContext();
	const { APIServer } = useOutletContext();
	return (
		<>
			{loggedIn ? <ControlPanel APIServer={APIServer} /> : <Login />} 
		</>
	);
};

export default Dashboard;