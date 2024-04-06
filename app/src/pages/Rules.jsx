

import Card from "../components/Card"
import './stylesheets/rules.css'
import pageContent from './Pagecontent'
import square from '../assets/square.jpg'

const Rules = () => {
	return (
		<div className="main">
			<Card heading='Your Bike' body={pageContent.HTML_BikeRules} img={square} inverted={false} />
			<Card heading='Your Gear' body={pageContent.HTML_GearRules} img={square} inverted={true} />
			<Card heading='Our Policies' body={pageContent.HTML_OurPolicies} img={square} inverted={false} />
		</div>
	);
};

export default Rules;