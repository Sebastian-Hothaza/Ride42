import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card"
import './stylesheets/faq.css'
import pageContent from './Pagecontent'

const Faq = () => {
	return (
		<div>
			<Navbar />
			<div className="main">
				<Card heading='FAQ' body={pageContent.HTML_Faq} inverted={false} />
			</div>
			<Footer />
		</div>
	);
};

export default Faq;