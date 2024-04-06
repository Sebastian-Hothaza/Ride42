
import Card from "../components/Card"
import './stylesheets/faq.css'
import pageContent from './Pagecontent'

const Faq = () => {
	return (
		<div className="main">
			<Card heading='FAQ' body={pageContent.HTML_Faq} inverted={false} />
		</div>
	);
};

export default Faq;