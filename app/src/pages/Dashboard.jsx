import { NavLink } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import './stylesheets/dashboard.css'
import Login from "./Login";

/*
Depending on if user logged in, show long in page or control panel
*/

const Dashboard = () => {

	return (
		<>
			<Navbar />
			<Login />
			<Footer />
		</>
	);
};

export default Dashboard;