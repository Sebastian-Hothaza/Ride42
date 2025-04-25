import { useOutletContext, useNavigate } from "react-router-dom";

import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import SignaturePad from 'signature_pad';


import Card from "../components/Card"
import Modal from "../components/Modal";
import Loading from '../components/Loading';

import styles from './stylesheets/Waiver.module.css'
import modalStyles from '../components/stylesheets/Modal.module.css'

import checkmark from './../assets/checkmark.png'
import errormark from './../assets/error.png'


const Waiver = () => {
	const { loggedIn } = useOutletContext();
	const { APIServer } = useOutletContext();
	const navigate = useNavigate();
	const canvasRef = useRef(null);
	const signaturePadRef = useRef(null);

	const loggedInUser = JSON.parse(localStorage.getItem("user"))
	const CURRENT_YEAR = '2025'; // Hardcoded year for the waiver; DO NOT FETCH DYNAMICALLY
	const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown


	if (!loggedIn) return window.location.replace('/dashboard');

	// Initialize Signature Pad
	React.useEffect(() => {
		const canvas = canvasRef.current;
		signaturePadRef.current = new SignaturePad(canvas, {
			backgroundColor: 'rgba(255, 255, 255, 1)', // White background
		});
	}, []);

	// Submit PDF
	async function submit(name, date) {
		setActiveModal({ type: 'loading', msg: 'Sending secure waiver pdf...' });

		const signatureImage = signaturePadRef.current.toDataURL(); // Get the signature as an image
		const doc = new jsPDF(); // The default size is 'A4' (210mm x 297mm) in portrait orientation.


		doc.setFont('helvetica', 'bold');


		// Title
		doc.setFontSize(12); // Slightly larger for the title
		doc.text('RELEASE OF LIABILITY, WAIVER OF CLAIMS, ASSUMPTION OF RISKS AND INDEMNITY AGREEMENT', 5, 10, { maxWidth: 200 }); // Start closer to the left edge
		doc.text('BY SIGNING THIS DOCUMENT YOU WILL WAIVE CERTAIN LEGAL RIGHTS, INCLUDING THE RIGHT TO SUE.', 5, 22, { maxWidth: 200 });
		doc.text('PLEASE READ CAREFULLY!', 5, 34);

		// Event description
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(10);
		doc.text('Description and location of scheduled event(s) (the "EVENT"): Motorcycle Lapping - Grand Bend Motorplex - Raceway Circuit', 5, 43, { maxWidth: 200 });

		doc.text('In full or partial consideration for allowing me to participate in all related events and activities of the EVENT, I hereby warrant and agree that:', 5, 53, { maxWidth: 200 });

		doc.text('1. I am familiar with and accept that there is the risk of serious injury and death in participation, whether as a competitor, student,official, or worker, in all forms of motor sport and in particular in being allowed to enter, for any reason, any restricted area.', 5, 63, { maxWidth: 200 });
		doc.text('2. I have satisfied myself and believe that I am physically, emotionally, and mentally able to participate in this EVENT, and that my protective clothing, gear, and equipment is fit and appropriate for my role as a participant.', 5, 78, { maxWidth: 200 });
		doc.text('3. I understand that all applicable rules for participation must be followed, regardless of my role, and that at all times during the EVENT the sole responsibility for my personal safety remains with me.', 5, 88, { maxWidth: 200 });
		doc.text('4. I will immediately remove myself from participation and notify the nearest official if at any time I sense or observe any unusual hazard or unsafe condition, or if I feel that I have experienced any deterioration in my physical, emotional, or mental fitness, or that of my protective clothing, gear, or equipment, for continued safe participation in the EVENT.', 5, 98, { maxWidth: 200 });

		// Signature section
		doc.setFontSize(12);
		doc.text('I UNDERSTAND AND AGREE, ON BEHALF OF MYSELF, MY HEIRS, ASSIGNS, PERSONAL REPRESENTATIVES AND NEXT OF KIN THAT MY EXECUTION OF THIS DOCUMENT CONSTITUTES:', 5, 113, { maxWidth: 200 });
		doc.setFontSize(10);

		doc.text('1. AN UNQUALIFIED ASSUMPTION BY ME OF ALL RISKS associated with my participation in the EVENT even if arising from the negligence or gross negligence, including any compounding or aggravation of injuries caused by negligent rescue operations or procedures, of the Releasees, as that term is defined below, and any persons associated therewith or otherwise participating in the EVENT in any capacity; and', 5, 124, { maxWidth: 200 });
		doc.text('2. A FULL AND FINAL RELEASE AND WAIVER OF LIABILITY AND ALL CLAIMS that I have, or may in the future have, against any person(s), entities or organization(s) associated in any way with the EVENT including the track owners and lessees, promoters, sanctioning bodies, racing associations or any subdivision thereof, track operators, sponsors, advertisers, car owners and other participants, rescue personnel, event inspectors, underwriters, consultants and others who give recommendations, directions or instructions or engage in risk evaluation and loss control activities, regarding the EVENT or event premises, or any one or more of them and their respective directors, officers, employees, guides, contractors, agents and representatives (all of whom are collectively referred to as "the Releasees"). from any and all liability for any loss, damage, injury or expense that I may suffer as a result of my use of or my presence at the event facilities or my participation in any part of, or my presence in any capacity at, the EVENT, due to any cause whatsoever, INCLUDING NEGLIGENCE, GROSS NEGLIGENCE, BREACH OF CONTRACT, OR BREACH OF ANY STATUTORY OR OTHER DUTY OF CARE, INCLUDING ANY DUTY OF CARE OWED UNDER THE RELEVANT OCCUPIERS LIABILITY ACT ON THE PART OF THE RELEASEES.', 5, 142, { maxWidth: 200 });
		doc.text('3. AN AGREEMENT NOT TO SUE THE RELEASEES for any loss, injury, costs or damages of any form or type, howsoever caused or arising, and whether directly or indirectly from my participation in any aspect(s) of the EVENT; and', 5, 190, { maxWidth: 200 });
		doc.text('4. AN AGREEMENT TO INDEMNIFY, and to SAVE and HOLD HARMLESS the RELEASEES, and each of them, from any litigation expense, legal fees, liability, damage, award or cost, of any form or type whatsoever, they may incur due to any claim made against them or any one of them by me or on my behalf, or that of my estate, whether the claim is based on the negligence or the gross negligence of the Releasees or otherwise as stated above.', 5, 200, { maxWidth: 200 });
		doc.text('5. AN AGREEMENT that this document be governed by the laws, and in the courts, of the Province in which the EVENT occurs.', 5, 218, { maxWidth: 200 });
		doc.text('6. AN AGREEMENT to extend this document to apply to ALL 2025 EVENT(s) hosted by Ride42.', 5, 225, { maxWidth: 200 });



		doc.setFontSize(12);



		// Add signature
		if (!signaturePadRef.current.isEmpty() && name) {
			doc.text(`Name: ${name.toUpperCase()}`, 5, 285);
			doc.text(`Date: ${date}`, 95, 285);
			doc.addImage(signatureImage, 'PNG', 140, 270, 60, 20); // Adjust positioning and size

			doc.setDrawColor(0, 0, 0); // Set color to black
			doc.setLineWidth(0.5); // Set line width
			doc.line(135, 288, 205, 288); // Draw a line under the signature image

			doc.setFont('helvetica', 'bold');
			doc.text('I HAVE READ AND UNDERSTAND THIS AGREEMENT AND I AM AWARE THAT BY SIGNING THIS AGREEMENT I AM WAIVING CERTAIN SUBSTANTIAL LEGAL RIGHTS WHICH I AND MY HEIRS, NEXT OF KIN, EXECUTORS, ADMINISTRATORS AND ASSIGNS MAY HAVE AGAINST THE RELEASEES.', 5, 240, { maxWidth: 200 });

			doc.text('I SIGN THIS DOCUMENT VOLUNTARILY AND WITHOUT INDUCEMENT.', 5, 268);
		} else {
			alert('Please add your full name & sign the waiver before submitting.');
			return;
		}

		// Send PDF to server
		try {
			const payload = {
				waiver: doc.output('datauristring').split(',')[1], // Extract Base64 string
				name,
				date,
			};

			const response = await fetch(APIServer + 'waiverSubmit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Waiver submitted & pending verification. Taking you to dashboard...' });
				setTimeout(() => navigate("/dashboard"), 4000);
			} else {
				const data = await response.json();
				setActiveModal({ type: 'failure', msg: data.msg.join('\n') });
			}
		} catch (err) {
			setActiveModal({ type: 'failure', msg: 'API Failure' });
			console.log(err.message);
		}
	}

	const HTML_Waiver = <div className={styles.waiverCard} >
		<h2>RELEASE OF LIABILITY, WAIVER OF CLAIMS, ASSUMPTION OF RISKS AND INDEMNITY AGREEMENT<br></br><br></br>
			BY SIGNING THIS DOCUMENT YOU WILL WAIVE CERTAIN LEGAL RIGHTS, INCLUDING THE RIGHT TO SUE.<br></br><br></br>
			<span className={styles.highlight}>PLEASE READ CAREFULLY!</span>
		</h2>
		<br></br>
		<p>Description and location of scheduled event(s) (the ''<em><b>EVENT</b></em>"): <em>Motorcycle Lapping - Grand Bend Motorplex - Raceway Circuit</em></p>
		<br></br>

		<div>
			In full or partial consideration for allowing me to participate in all related events and activities of the <em><b>EVENT</b></em>, I hereby warrant and agree that:
			<br></br><br></br>
			<ol>
				<li>
					I am familiar with and accept that there is the risk of serious injury and death in participation, whether as a competitor, student, official
					or worker, in all forms of motor sport and in particular in being allowed to enter, for any reason, any restricted area; and
				</li>
				<li>
					I have satisfied myself and believe that I am physically, emotionally and mentally able to participate in this <em><b>EVENT</b></em>, and that my
					protective clothing, gear and equipment is fit and appropriate for my role as a participant in this <em><b>EVENT</b></em>, and
				</li>
				<li>
					I understand that all applicable rules for participation must be followed, regardless of my role, and that at all times during the <em><b>EVENT</b></em>
					the sole responsibility for my personal safety remains with me; and
				</li>
				<li>
					I will immediately remove myself from participation, and notify the nearest official, if at any time I sense or observe any unusual hazard
					or unsafe condition or if I feel that I have experienced any deterioration in my physical, emotional or mental fitness, or that of my
					protective clothing, gear or equipment, for continued safe participation in the <em><b>EVENT</b></em>.
				</li>
			</ol>
		</div>

		<h3>I UNDERSTAND AND AGREE, ON BEHALF OF MYSELF, MY HEIRS, ASSIGNS, PERSONAL REPRESENTATIVES AND NEXT OF KIN THAT MY EXECUTION OF THIS DOCUMENT CONSTITUTES:</h3>
		<br></br><br></br>
		<ol>
			<li>AN UNQUALIFIED ASSUMPTION BY ME OF ALL RISKS associated with my participation in the <em><b>EVENT</b></em> even if arising from
				the negligence or gross negligence, including any compounding or aggravation of injuries caused by negligent rescue operations or
				procedures, of the Releasees, as that term is defined below, and any persons associated therewith or otherwise participating in the
				<em><b>EVENT</b></em> in any capacity; and</li>
			<li>A FULL AND FINAL RELEASE AND WAIVER OF LIABILITY AND ALL CLAIMS that I have, or may in the future have,
				against any person(s), entities or organization(s) associated in any way with the <em><b>EVENT</b></em> including the track owners and lessees,
				promoters, sanctioning bodies, racing associations or any subdivision thereof, track operators, sponsors, advertisers, car owners and
				other participants, rescue personnel, event inspectors, underwriters, consultants and others who give recommendations, directions or
				instructions or engage in risk evaluation and loss control activities, regarding the <em><b>EVENT</b></em> or event premises, or any one or more of
				them and their respective directors, officers, employees, guides, contractors, agents and representatives (all of whom are collectively
				referred to as "the Releasees"). from any and all liability for any loss, damage, injury or expense that I may suffer as a result of my use of
				or my presence at the event facilities or my participation in any part of, or my presence in any capacity at, the <em><b>EVENT</b></em>, due to any
				cause whatsoever, INCLUDING NEGLIGENCE, GROSS NEGLIGENCE, BREACH OF CONTRACT, OR BREACH OF ANY
				STATUTORY OR OTHER DUTY OF CARE, INCLUDING ANY DUTY OF CARE OWED UNDER THE RELEVANT
				OCCUPIERS LIABILITY ACT ON THE PART OF THE RELEASEES.</li>
			<li>AN AGREEMENT NOT TO SUE THE RELEASEES for any loss, injury, costs or damages of any form or type, howsoever caused
				or arising, and whether directly or indirectly from my participation in any aspect(s) of the <em><b>EVENT</b></em>; and
			</li>
			<li>AN AGREEMENT TO INDEMNIFY, and to SAVE and HOLD HARMLESS the RELEASEES, and each of them, from any
				litigation expense, legal fees, liability, damage, award or cost, of any form or type whatsoever, they may incur due to any claim made
				against them or any one of them by me or on my behalf, or that of my estate, whether the claim is based on the negligence or the gross
				negligence of the Releasees or otherwise as stated above.</li>
			<li>AN AGREEMENT that this document be governed by the laws, and in the courts, of the Province in which the <em><b>EVENT</b></em> occurs.</li>
			<li>AN AGREEMENT to extend this document to apply to ALL {CURRENT_YEAR} <em><b>EVENT(s)</b></em> hosted by Ride42.</li>
		</ol>



		<h3>
			I HAVE READ AND UNDERSTAND THIS AGREEMENT AND I AM AWARE THAT BY SIGNING THIS AGREEMENT I
			AM WAIVING CERTAIN SUBSTANTIAL LEGAL RIGHTS WHICH I AND MY HEIRS, NEXT OF KIN, EXECUTORS,
			ADMINISTRATORS AND ASSIGNS MAY HAVE AGAINST THE RELEASEES.
		</h3>
		<br></br><br></br>
		<h2>I SIGN THIS DOCUMENT VOLUNTARILY AND WITHOUT INDUCEMENT</h2>
		<br></br><br></br>

		<div className={styles.signatureContainer}>
			<div className={styles.waiverPairing}>
				<label htmlFor="fullName">Full Name: </label>
				<input id='fullName' type="text" autoComplete="off"></input>
			</div>

			<div className={styles.waiverPairing}>
				<label htmlFor="date">Date: </label>
				<input id='date' type="date" value={today} disabled style={{ width: '8em' }}></input>
			</div>

			<div className={styles.signaturePad}>
				<canvas
					ref={canvasRef}
					width={300}
					height={100}
				></canvas>
				<div className={styles.buttonContainer}>
					<button className="actionButton" onClick={() => signaturePadRef.current.clear()}>Clear</button>
					<button className="actionButton" style={{ backgroundColor: 'var(--accent-color)' }} onClick={async () => submit(fullName.value, today)}>Submit</button>
				</div>
			</div>




		</div>
	</div>

	return (
		<>
			<div className="content">
				<Card heading='Liability Waiver' body={HTML_Waiver} inverted={false} />
			</div>

			<Loading open={activeModal.type === 'loading'}>
				{activeModal.msg}
			</Loading>

			<Modal open={activeModal.type === 'success'} >
				<div className={modalStyles.modalNotif}></div>
				<img id={modalStyles.modalCheckmarkIMG} src={checkmark} alt="checkmark icon" />
				{activeModal.msg}
			</Modal>

			<Modal open={activeModal.type === 'failure'} >
				<div className={modalStyles.modalNotif}></div>
				<img id={modalStyles.modalCheckmarkIMG} src={errormark} alt="error icon" />
				{activeModal.msg}
				<button className='actionButton' onClick={() => setActiveModal('')}>Ok</button>
			</Modal>
		</>

	);
};

export default Waiver;