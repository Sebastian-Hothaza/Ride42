import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const Home = () => {
	return (
		<div>
			<Navbar />
			<h1>Home</h1>
			<Link to="/dates">See dates</Link>
		</div>
	);
};

export default Home;