import { NavLink, useOutletContext } from "react-router-dom";


import Login from "./Login";
import ControlPanel from "./ControlPanel";



const Dashboard = () => {
	const { loggedIn } = useOutletContext();
	const { APIServer } = useOutletContext();
	const { setLoggedIn } = useOutletContext();
	const { handleLogout } = useOutletContext();
	
	return (
		<>
			{loggedIn ? <ControlPanel APIServer={APIServer} setLoggedIn={setLoggedIn} handleLogout={handleLogout}/> : <Login APIServer={APIServer}/>} 
		</>
	);
};

export default Dashboard;