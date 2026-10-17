import styles from './stylesheets/ShopGear.module.css'
import Card from "../components/Card"
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react"


import modalStyles from '../components/stylesheets/Modal.module.css'

import Modal from "../components/Modal";
import Loading from '../components/Loading';

import checkmark from './../assets/checkmark.png'
import errormark from './../assets/error.png'

const ShopGear = ({ APIServer }) => {

	const loggedInUser = JSON.parse(localStorage.getItem("user"))
	const [allUsers, setAllUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(loggedInUser?.id);
	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

	const [gearProducts, setGearProducts] = useState([]);
	const [sizesAvailable, setSizesAvailable] = useState([]);
	const [colorsAvailable, setColorsAvailable] = useState([]);

	const [selectedGear, setSelectedGear] = useState('');
	const [selectedGearPrice, setSelectedGearPrice] = useState(9999);
	const [selectedSize, setSelectedSize] = useState('');
	const [selectedColor, setSelectedColor] = useState('');
	const [selectedaddOns, setSelectedaddOns] = useState([]);

	const [qtyOrder, setQtyOrder] = useState(1);


	const navigate = useNavigate();

	const [userCart, setUserCart] = useState([]);
	const balanceDue = userCart.reduce((sum, item) => { return sum + item.price * item.quantity; }, 0);

	// used for formatting/nice display
	const gearNameMap = {
		'race gloves': 'Superman gloves',
		'race suit': 'Superman suit',
	};



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
				setGearProducts(data.filter(p => p.category === 'gear'));
			} else {
				const data = await response.json();
				console.error('failed to fetch products')
			}
		} catch (err) {
			console.error(err)
		}
	}

	async function fetchUsers() {
		try {
			const response = await fetch(APIServer + 'users', {
				method: 'GET',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			})
			if (response.ok) {
				const data = await response.json();
				data.sort((a, b) => {
					const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
					const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
					return nameA.localeCompare(nameB);
				});
				setAllUsers(data);
			} else {
				const data = await response.json();
				console.error('failed to fetch users')
			}
		} catch (err) {
			console.error(err)
		}
	}


	useEffect(() => {
		fetchProducts();
		if (loggedInUser && loggedInUser.memberType === 'admin') fetchUsers();
	}, [])

	// Once a gear item is selected, load in the available sizes & colors
	useEffect(() => {
		if (!selectedGear) {
			setSizesAvailable([]);
			setColorsAvailable([]);
			setSelectedaddOns([]);
			return;
		}

		const gear = gearProducts.find(t => t._id === selectedGear);
		if (!gear) return;
		

		setSizesAvailable(gear.sizes ?? []);
		setColorsAvailable(gear.colors ?? []);
		setSelectedaddOns(gear.addOnOptions ?? []);
		setSelectedGearPrice(gear.basePrice ?? 9999);
	}, [selectedGear, gearProducts]);


	function handleAddGear(e) {
		e.preventDefault();

		// Check if the selected gear is already in the cart
		const existingIndex = userCart.findIndex(item => item.product === selectedGear);
		if (existingIndex !== -1) {
			alert('This type of gear is already in your cart.')
			setSelectedGear('');
			return;
		}

		setUserCart(userCart => {
			return [...userCart, {
				product: selectedGear,
				...(selectedSize ? { size: selectedSize } : {}),
				...(selectedColor ? { color: selectedColor } : {}),
				price: selectedGearPrice,
				quantity: qtyOrder,
			}];
		});
		setSelectedGear('');
		setSelectedSize('');
		setSelectedColor('');
		setSelectedaddOns([]);
		setQtyOrder(1);
		setSelectedGearPrice(9999);

	}

	useEffect(() => {
		console.log('User cart updated:', userCart);
	}, [userCart]);

	function handleRemoveGear(selectedGear) {
		setUserCart(userCart => userCart.filter(item => item.product !== selectedGear));
	}

	async function handleCheckOut() {
		let orderItems = [];
		for (let item of userCart) {
			orderItems.push({
				product: item.product,
				quantity: item.quantity,
			})
		}


		try {
			const response = await fetch(APIServer + 'orders/' + selectedUser, {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({ items: orderItems, })
			})
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Order created, taking you to your dashboard...' });
				setTimeout(() => navigate("/dashboard?tab=orders"), 3000)
				// setUserCart([]);
				// setSelectedGear('');

			} else {
				const data = await response.json();
				setActiveModal({ type: 'failure', msg: data.msg.join('\n') })
			}
		} catch (err) {
			setActiveModal({ type: 'failure', msg: 'API Failure' })
			console.error(err)
		}
	}

	const HTML_Welcome = <div className={styles.rulesCard}>
		<p>Text </p>
	</div>

	const HTML_Order = <div className={styles.rulesCard}>

		{loggedInUser && loggedInUser.memberType === 'admin' &&
			<>
				<br></br>
				<div className={styles.inputPairing}>
					<label htmlFor="userName">Select User: </label>
					<select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
						{allUsers.map(u => <option key={u._id} value={u._id}>{u.firstName}, {u.lastName}</option>)}
					</select>
				</div>
			</>}

		<br></br>
		<form id={styles.addTireForm} onSubmit={(e) => handleAddGear(e)} >
			<div className={styles.inputPairing}>
				<label htmlFor="gearName">Select Gear: </label>
				<select value={selectedGear} onChange={(e) => setSelectedGear(e.target.value)}>
					<option key="gearNone" value=''></option>
					{gearProducts.map(gear => (
						<option key={gear._id} value={gear._id}>
							{gearNameMap[gear.name] || gear.name}
						</option>
					))}
				</select>
			</div>


			{selectedGear && sizesAvailable.length > 0 &&
				<div className={styles.inputPairing}>
					<label htmlFor="gearSize">Size: </label>
					<select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
						<option key="sizeNone" value=''></option>
						{sizesAvailable.map(size => (
							<option key={size} value={size}>{size}</option>
						))}
					</select>
				</div>
			}

			{selectedGear && selectedSize && colorsAvailable.length > 0 &&
				<div className={styles.inputPairing}>
					<label htmlFor="gearColor">Color: </label>
					<select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
						<option key="colorNone" value=''></option>
						{colorsAvailable.map(color => (
							<option key={color} value={color}>{color}</option>
						))}
					</select>
				</div>
			}



			{(selectedColor || selectedSize && colorsAvailable.length == 0 || (selectedGear && sizesAvailable.length == 0 && colorsAvailable.length == 0)) &&
				<>
					<div className={styles.inputPairing}>
						<label>Price: ${selectedGearPrice.toFixed(2)}</label>
					</div>
					{loggedInUser ? <><div className={styles.inputPairing}>

					</div>
						<div className={styles.inputPairing}>
							<label htmlFor="tireQty">Quantity: </label>
							<button type="button" id={styles.qtyButton} onClick={() => setQtyOrder(q => Math.max(1, q - 1))}><span className='material-symbols-outlined'>remove</span></button>
							<input type="number" min={1} max={25} step={1} value={qtyOrder} onChange={(e) => {
								const val = Number(e.target.value);
								if (!Number.isNaN(val)) setQtyOrder(Math.max(1, val));
							}}
							/>
							<button id={styles.qtyButton} type="button" onClick={() => setQtyOrder(q => q + 1)}><span className='material-symbols-outlined'>add</span></button>
						</div>



						<button type="submit">Add To Cart</button></>
						:
						<div>Please <a href="/dashboard?redirect=ShopGear" style={{ color: "blue", textDecoration: "underline" }}>log in</a> to create an order.</div>}


				</>

			}

		</form >


		{
			userCart.length > 0 &&
			<div id={styles.cart}>
				<h3>Your Cart</h3>

				{userCart.map(item =>
					<div id={styles.cartEntry} key={item.product}>
						<div>
							{item.quantity}x {gearNameMap[gearProducts.find(t => t._id === item.product)?.name] || gearProducts.find(t => t._id === item.product)?.name}
							{item.size ? ` (${item.size})` : ''}
							{item.color ? ` (${item.color})` : ''}
							<span> — ${(item.price * item.quantity).toFixed(2)}</span>
						</div>
						<button onClick={(e) => handleRemoveGear(item.product)}>Remove Item</button>
					</div>
				)}

				{userCart.filter(item => gearProducts.find(t => t._id === item.product)?.category === 'tire').map(item =>
					<div id={styles.cartEntry} key={item.product}>
						<button onClick={(e) => handleRemoveTire(item.product)}>Remove Item</button>
					</div>
				)}


				<div className={styles.inputPairing}>
					<label>Balance Due: ${balanceDue}</label>
				</div>
				<button id={styles.checkoutButton} onClick={(e) => handleCheckOut()}>Submit Order</button>
			</div>
		}
	</div >

	return (
		<>
			<div className={styles.content}>
				<Card heading={loggedInUser ? `Welcome ${loggedInUser?.firstName.charAt(0).toUpperCase() + loggedInUser?.firstName.slice(1)}!` : 'Welcome!'} body={HTML_Welcome} inverted={false} />
				<Card heading='Submit your order' body={HTML_Order} />
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

export default ShopGear;