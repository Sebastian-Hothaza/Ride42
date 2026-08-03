import Card from "../components/Card"
import { useOutletContext } from "react-router-dom";

const Unsubscribed = () => {
	const { APIServer } = useOutletContext();

	const params = new URLSearchParams(location.search);
	const token = params.get('token');

	async function handleReturnToMailingList() {
		try {
			const response = await fetch(APIServer + 'updateSubscription/' + token + '?sub=true', {
				method: 'GET',
				headers: { 'Content-type': 'application/json; charset=UTF-8', },

			});
			if (response.ok) {
				alert('You have been re-subscribed to the mailing list!');
				window.location.href = '/';
			} else {
				const data = await response.json();
				alert('Error: ' + data.msg.join('\n'));
				window.location.href = '/';
			}
		} catch (err) {
			alert('API Failure');
			console.error(err);
			window.location.href = '/';
		}

	}
	const HTML_Confirm = <div><h2>We have removed your email from our mailing list.</h2></div>
	const HTML_Return = <div><h2>Spam sucks.</h2><br></br>
		<p>We only message you when there's something important to share; about once a month during the riding season with upcoming dates and other interesting updates.</p>
		<br></br>
		<p>Click the button below to stay updated!</p>
		<br></br>
		<button className='actionButton' onClick={handleReturnToMailingList}>
			Keep me in the loop
		</button>
	</div>

	return (
		<div className="content">
			<Card heading='Unsubscribed' body={HTML_Confirm} inverted={false} />
			<Card heading='Come back?' body={HTML_Return} inverted={true} />
		</div>
	);
};

export default Unsubscribed;