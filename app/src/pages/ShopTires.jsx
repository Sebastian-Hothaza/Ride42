import styles from './stylesheets/ShopTires.module.css'
import Card from "../components/Card"
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from "react"
import pirelli from '../assets/pirelli.png'
import rosso4 from '../assets/rosso4.png'
import sc3 from '../assets/sc3.jpg'
import slick from '../assets/slick.jpg'
import React from 'react';


import modalStyles from '../components/stylesheets/Modal.module.css'

import Modal from "../components/Modal";
import Loading from '../components/Loading';

import checkmark from './../assets/checkmark.png'
import errormark from './../assets/error.png'

const ShopTires = ({ APIServer }) => {
	const loggedInUser = JSON.parse(localStorage.getItem("user"))
	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
	const [tireProducts, setTireProducts] = useState([]);

	const [selectedTire, setSelectedTire] = useState('');
	const [selectedSize, setSelectedSize] = useState('');
	const [selectedCompound, setSelectedCompound] = useState('');
	const [qtyOrder, setQtyOrder] = useState(1);
	const [installRequired, setInstallRequired] = useState(false);


	const [sizesAvailable, setSizesAvailable] = useState([]);
	const [compoundsAvailable, setCompoundsAvailable] = useState([]);


	const [userCart, setUserCart] = useState([]);

	async function fetchProducts() {
		try {
			const response = await fetch(APIServer + 'products?getAll=true', {
				method: 'GET',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},

			})
			if (response.ok) {
				const data = await response.json();
				setTireProducts(data);
			} else {
				const data = await response.json();
				console.error('failed to fetch products')
			}
		} catch (err) {
			console.log(err.message)
		}
	}

	useEffect(() => {
		fetchProducts();
	}, [])

	// Once a tire is selected, load in the available sizes
	useEffect(() => {
		if (!selectedTire) return;

		const tire = tireProducts.find(t => t._id === selectedTire);
		if (!tire) return;

		const sizes = [...new Set(tire.variants.map(v => v.size))];

		setSizesAvailable(sizes);

	}, [selectedTire]); // run only when selectedTire changes

	// Once a size is selected, load in the available compounds
	useEffect(() => {
		if (!selectedSize) return;

		const tire = tireProducts.find(t => t._id === selectedTire);
		if (!tire) return;

		const compounds = [...new Set(tire.variants.filter(v => v.size == selectedSize).map(v => v.compound))];

		setCompoundsAvailable(compounds);
	}, [selectedSize]); // run only when selectedSize changes

	// Reset dependent selects when parent changes
	useEffect(() => {
		setSelectedSize('');
		setSelectedCompound('');
		setQtyOrder(1);
		setInstallRequired(false);
	}, [selectedTire]);

	useEffect(() => {
		setSelectedCompound('');
		setQtyOrder(1);
		setInstallRequired(false);
	}, [selectedSize]);


	const variant = tireProducts
		.find(t => t._id === selectedTire)
		?.variants.find(v => v.size === selectedSize && v.compound === selectedCompound);

	const inventory = variant?.stock || 0;
	const price = variant?.price || 999;


	function handleAddTire(e) {
		e.preventDefault();

		const existingIndex = userCart.findIndex(
			item => item.product === selectedTire &&
				item.size === selectedSize &&
				item.compound === selectedCompound
		);
		if (existingIndex !== -1) {
			alert('This tire variant is already in cart. Please remove if you want to modify.')
			setSelectedTire('');
			return;
		}

		setUserCart(userCart => {
			return [...userCart, {
				uid: selectedTire + selectedSize + selectedCompound,
				name: tireProducts.find(t => t._id === selectedTire).name,
				product: selectedTire,
				size: selectedSize,
				compound: selectedCompound,
				price: price,
				quantity: qtyOrder,
				installRequired: installRequired
			}];
		});
		setSelectedTire('');
	}

	function handleRemoveTire(uid) {
		setUserCart(userCart => userCart.filter(item => item.uid !== uid));
	}

	async function handleCheckOut() {
		let orderItems = [];
		for (let item of userCart) {
			orderItems.push({
				product: item.product,
				variant: { size: item.size, compound: item.compound },
				quantity: item.quantity,
				installRequired: installRequired
			})
		}

		
		try {
			const response = await fetch(APIServer + 'orders/' + loggedInUser.id, {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({
					items: orderItems
				})
			})
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Order created, check it out in your dashboard!' });
				setTimeout(() => setActiveModal(''), 3000)
				setUserCart([]);
				setSelectedTire('');
			} else {
				const data = await response.json();
				setActiveModal({ type: 'failure', msg: data.msg.join('\n') })
			}
		} catch (err) {
			setActiveModal({ type: 'failure', msg: 'API Failure' })
			console.log(err.message)
		}
	}

	const HTML_Welcome = <div className={styles.rulesCard}>
		<p>We took great care on selecting a tire partner to make sure we can get you the best product possible that works well at our track and riding conditions.
			We wanted a brand that offers quick warm up, excellent feedback and outstanding grip. We now have an excellent product line for you to choose from to fit your requirements ✅ </p>
		<br></br>
		<p>Below, you will find more information on the 3 tire options. Here is a quick summary:</p>
		<br></br>
		<ol>
			<li><b>Diablo Rosso IV Corsa: </b>Perfect for riders who take their bikes out on public roads. Dual compound for increased longevity. </li>
			<li><b>SuperCorsa TD SC3: </b>Dedicated trackday tire for intermediate riders. Very quick warmup, does not require tire warmers.  </li>
			<li><b>Superbike Slicks: </b>For riders demanding WSBK-level grip & feedback. </li>
		</ol>
		<br></br>
		<p><em>You'll notice our sizing uses a 60 aspect ratio instead of 55 (Ie. 180/60 vs 180/55). The taller profile is something we <b>highly</b> recommend.
			It will provide sharper handling with a larger contact patch on the edge of the tire for more cornering grip. If you prefer to stick with 55, we can get them, though it
			is not a size we typically will stock.</em> </p>

	</div>

	const HTML_rosso4 = <div className={styles.rulesCard}>
		<p>DIABLO ROSSO™ IV Corsa is intended for thrill seekers and bike-tuning enthusiasts looking for the most out of their supersport tires.
			Factory optioned tire on many modern superbikes offering unparalled grip.</p>
		<br></br>
		<ul>
			<li>Designed for riders who also take their bikes out on public roads and want the absolute best grip performance possible</li>
			<li>Dual compound layout with wide soft shoulders for both front and rear tires.</li>
			<li>The front tire profile enhances handling, inviting the rider to lean in earlier and facilitating quick changes in direction. The wide contour provides outstanding stability
				thanks tothe extended contact patch area when leaning. </li>
			<li>The rear tire follows the same scheme and a similar geometry of the front to ensure a synchronized behavior of the set.</li>
			<li>Pirelli stiff chord technology: The stiffer chords feature a lower end-count and leave wide room for the compound, enhancing tire conformability and contact feeling with the road.
				This allows full control even when pushing hard.</li>
		</ul>
	</div>

	const HTML_TDSC3 = <div className={styles.rulesCard}>
		<p>
			The Pirelli Diablo Supercorsa SC3 is a semi-slick tire built for track days where durability and consistent performance are essential.
			Derived from Pirelli’s WorldSBK racing technology, the SC3 compound delivers predictable grip, precise feedback, and excellent stability throughout long track sessions, making it a
			popular choice for riders who want race-level performance without sacrificing longevity.
		</p>

		<br></br>

		<ul>
			<li>Fast warm-up characteristics that allow strong grip even without tire warmers</li>
			<li>Same aggressive racing profile used in Pirelli Superbike slicks</li>
			<li>SC3 compound designed for durability and consistent performance across long sessions</li>
			<li>Excellent stability and feedback at high lean angles</li>
			<li>Ideal for track days, endurance use, and intermediate riding</li>
		</ul>


	</div>

	const HTML_Slicks = <div className={styles.rulesCard}>
		<p>
			The Pirelli Diablo Superbike Slick is a pure racing tire developed directly from Pirelli’s WorldSBK championship-winning technology. Designed exclusively for track use,
			these slick tires deliver maximum grip, precise feedback, and exceptional cornering stability at the highest levels of performance. With multiple compound options available,
			riders can select the ideal balance of grip and durability to match track conditions and riding style.
		</p>

		<br></br>

		<ul>
			<li>WorldSBK-derived racing slick engineered for maximum track performance</li>
			<li>Slick tread design provides the largest possible contact patch for ultimate grip</li>
			<li>Multiple racing compounds available to suit different track conditions and temperatures</li>
			<li>Race-developed profile for extremely quick turn-in and high cornering stability</li>
			<li>Designed exclusively for closed-course racing and track use</li>
		</ul>
		<h3>Compounds Available</h3>
		<ul>
			<li><b>SC1:</b> Very wide operating range. Peak grip levels often used in racing. <em>*Recommended rear compound for Grand Bend*</em></li>
			<li><b>SC2:</b> Similar compound as SC1 with a harder carcass. <em>*Recommended front compound for Grand Bend*</em></li>
			<li><b>SC3:</b> Endurance compound; maximum longevity. </li>
		</ul>
		<br></br>
		<em>NOTE: These tires are <b>ONLY</b> available to non-SOAR racers. Racers, please purchase your tires from Kennedy Motorsports.</em>
	</div>

	const HTML_Order = <div className={styles.rulesCard}>
		<ul>
			<li>Your tires are <b>NOT</b> reserved in inventory until we receive your payment. Payments can be sent via E-Transfer to <b>sales@ride42.ca</b> </li>
			<li>We will send you an email once your order is processed. You can also track it in your rider dashboard.</li>
			<li>Tire service is available at all Ride42 trackdays for $30/wheel; paid in cash at time of service. You are responsible for dismounting your wheels.</li>
		</ul>

		<br></br>
		<form id={styles.addTireForm} onSubmit={(e) => handleAddTire(e)} >
			<label htmlFor="tireName">Select Tire: </label>
			<select value={selectedTire} onChange={(e) => setSelectedTire(e.target.value)}>
				<option key="tireNone" value=''>---Choose Tire---</option>
				{tireProducts.map(tire => (
					<option key={tire._id} value={tire._id}>
						{tire.name}
					</option>
				))}
			</select>

			{selectedTire &&
				<>
					<label htmlFor="tireSize">Tire Size: </label>
					<select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
						<option key="sizeNone" value=''>---Choose Size---</option>
						{sizesAvailable.map(size => (
							<option key={size} value={size}>{size}</option>
						))}
					</select>
				</>
			}

			{selectedSize && compoundsAvailable.length > 0 &&
				<>
					<label htmlFor="tireCompound">Tire Compound: </label>
					<select value={selectedCompound} onChange={(e) => setSelectedCompound(e.target.value)}>
						<option key="compoundNone" value=''>---Choose Compound---</option>
						{compoundsAvailable.map(compound => (
							<option key={compound} value={compound}>{compound}</option>
						))}
					</select>

					<label htmlFor="tireQty">Quantity: </label>
					<input type='number' value={qtyOrder} onChange={e => setQtyOrder(e.target.value)}></input>

					<label htmlFor="installReq" value={installRequired} onChange={e => setInstallRequired(e.target.checked)}>Install Required </label>
					<input type='checkbox'></input>
				</>
			}

			{selectedCompound &&
				<>
					<label>In Stock: {inventory}</label>
					<label>Price: {price}</label>
					<button type="submit">ADD</button>
				</>

			}

		</form>


		{userCart.length > 0 && <>
			<h3>Your Cart</h3>
			{userCart.map(item =>
				<div key={item.uid}>{item.name} {item.size}-{item.compound} x{item.quantity} ${item.price}<button onClick={(e) => handleRemoveTire(item.uid)}>remove</button></div>
			)}
			<button onClick={(e) => handleCheckOut()}>check out</button>
		</>}
	</div>

	const HTML_Deny = <div className={styles.rulesCard}>
		<h2>Our shop is exclusive to our members. You must have an account and be signed in to submit an order.</h2>
		<br></br><br></br>
		<NavLink className={styles.bookBtn} to="/dashboard">Get me access!</NavLink>
	</div>


	return (
		<>
			<div className={styles.content}>
				<Card heading={loggedInUser ? `Welcome ${loggedInUser?.firstName.charAt(0).toUpperCase() + loggedInUser?.firstName.slice(1)}!` : 'Welcome!'} body={HTML_Welcome} img={pirelli} inverted={false} />
				<Card heading='Diablo Rosso IV Corsa' body={HTML_rosso4} img={rosso4} inverted={true} />
				<Card heading='SuperCorsa TD SC3' body={HTML_TDSC3} img={sc3} inverted={false} />
				<Card heading='Superbike Slicks' body={HTML_Slicks} img={slick} inverted={true} />
				<Card heading='Submit your order' body={loggedInUser ? HTML_Order : HTML_Deny} />
			</div>

			<Loading open={activeModal.type === 'loading'}>
				{activeModal.msg}
			</Loading>

			<Modal open={activeModal.type === 'success'}>
				<div className={modalStyles.modalNotif}></div>
				<img id={modalStyles.modalCheckmarkIMG} src={checkmark} alt="checkmark icon" />
				{activeModal.msg}
			</Modal>

			<Modal open={activeModal.type === 'failure'}>
				<div className={modalStyles.modalNotif}></div>
				<img id={modalStyles.modalCheckmarkIMG} src={errormark} alt="error icon" />
				{activeModal.msg}
				<button className='actionButton' onClick={() => setActiveModal('')}>Close</button>
			</Modal>
		</>
	);
};

export default ShopTires;