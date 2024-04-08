
import Card from "../components/Card"
import styles from './stylesheets/Faq.module.css'


const Faq = () => {
	const HTML_Faq = <div className={styles.faqCard}>
		<h2>For those new to track...</h2>
		<br></br>
		<h4>What do I need to do to my bike?</h4>
		<div>Very little; in most cases it essentially comes down to tape up your lights/mirror and change your coolant to water.
			For a full list of requirements, you can check out the rules tab.</div>
		<br></br>
		<h4>How about gear?</h4>
		<div>Full leather suit OR 2 piece that zips together. You can see the full requirements in the gear tab.</div>
		<br></br>
		<h4>How is the day setup?</h4>
		<div>In most cases, we will split into 3 groups: red(advanced), yellow(intermediate) and green(novice).
			Each group will go out for 15 minute sessions at a time. While this may sound really short, the reality is you will be exhausted!</div>
		<br></br>
		<h4>How fast is green?</h4>
		<div>This is impossible to really quantify, but chances are, you’re going to be fine. Passing is permitted only on straights, you won’t be spooked in a corner by someone trying to squeeze in.</div>
		<br></br>
		<h4>How do I get my bike there?</h4>
		<div>Trailering your bike is ideal; U-haul rents out trailers for $15/day. However, you might not have a hitch on your car. Riding there is an option that some choose to take.
			If you crash and your bike is unridable, chances are there’s going to be someone there that can help get your bike home.</div>
		<br></br>
		<h4>Do I need race slicks, suspension upgrades etc etc?</h4>
		<div>No, a perfectly stock bike will be more than capable for your first track day. If you insist on some upgrade for your bike, pads and braided brake lines are a great starting point!</div>
		<br></br>
		<h4>What if the forecast is showing a strong change of rain?</h4>
		<div>You can hold off as long as you want and complete a gate registration. Gate registrations are cash only and space permitting.</div>
		<br></br>


		<h2>Tips & Advice</h2>
		<br></br>
		<div><span style={{ fontWeight: 'bold' }}>BE PREDICTABLE</span> - If you’re going to do something out of the ordinary, stick an arm or leg out to let the person behind you know. Don’t commit to a line only to dive in out unexpectedly.</div>
		<div><span style={{ fontWeight: 'bold' }}>ASK QUESTIONS</span> - Everyone at our track days is (theoretically) friendly and there to have a good time. Talk to other riders, see what works for them and take advantage of others’ experience!
			Vast majority of riders would be more than happy to come out and join you on a lap to show you some lines/techiques.</div>
		<div><span style={{ fontWeight: 'bold' }}>WATCH THE MARSHALLS</span>  - They are scattered around the track and are your only source of information out there. Know the flags and what to do in each case.</div>
		<br></br>
		<ul>
			<li>Stay on the motorcycle</li>
			<li>Ride your own pace; don’t worry about trying to catch up with someone that passed you.</li>
			<li>Don’t be a straight line hero just to park it in the corners.</li>
			<li>Bring a variety of zipties. They can be very useful to patch up fairings.</li>
			<li>Don’t be afraid to run it off if you feel like you’re not making the corner. DO NOT touch the front brake if you run it off on the grass. Simply ride it out and drag the rear brake, there are large run offs.</li>
			<li>Prioritize race line over anything else, body position, braking techniques can all come later but to ensure safety for everyone, focus on using the correct racing line. If you are unsure, just ask!</li>
		</ul>
		<br></br>
		<h2>Still have questions?</h2>
		<div>Please reach out to us, we are more than happy to help!</div>

	</div>
	return (
		<div className="content">
			<Card heading='FAQ' body={HTML_Faq} inverted={false} />
		</div>
	);
};

export default Faq;