import { useState, useEffect, Fragment } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/Orders.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'



// Alow users to manage orders here including cancelling or changing delivery date.
const Orders = ({ APIServer }) => {
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
    const [allOrders, setallOrders] = useState([]);
    const [hideCompleted, setHideCompleted] = useState(false); // Track if completed orders should be hidden

    async function fetchOrders() {
        try {
            const response = await fetch(APIServer + 'orders', {
                method: 'GET',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },

            })
            if (response.ok) {
                const data = await response.json();
                // Sort orders by delivery date. Those without dates will be at end
                const sortedOrders = data.sort((a, b) => {
                    if (!a.deliveryDate) return 1;   // a goes after b
                    if (!b.deliveryDate) return -1;  // b goes after a
                    return new Date(a.deliveryDate) - new Date(b.deliveryDate);
                });
                setallOrders(sortedOrders);
            } else {
                const data = await response.json();
                console.error('failed to fetch products')
            }
        } catch (err) {
            console.log(err.message)
        }
    }

    useEffect(() => {
        fetchOrders();
    }, [])

    async function handleDeleteOrder(orderID) {
        setActiveModal({ type: 'loading', msg: 'Cancelling order' });
        try {
            const response = await fetch(APIServer + 'orders/' + orderID, {
                method: 'DELETE',
                credentials: "include",
            })
            await fetchOrders();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Order Cancelled' });
                setTimeout(() => setActiveModal(''), 1500)
            } else {
                const data = await response.json();
                setActiveModal({ type: 'failure', msg: data.msg })
            }
        } catch (err) {
            setActiveModal({ type: 'failure', msg: 'API Failure' })
            console.log(err.message)
        }
    }

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>My Orders</h1>
                <p>Orders you place in the shop will show up here. All payments should be sent via E-Transfer to sales@ride42.ca</p>
                <p>For delivery date changes, please email us at <a href="mailto:info@ride42.ca" style={{ color: "blue", textDecoration: "underline" }}>info@ride42.ca</a></p>
                <h2>Tire Orders</h2>



                {allOrders.length > 0 ?
                    <>
                        <div className={styles.filterControls}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={hideCompleted}
                                    onChange={(e) => setHideCompleted(e.target.checked)}
                                />
                                Hide Completed
                            </label>
                        </div>
                        <div className={styles.orderGrid}>

                            <div><b>Products</b></div>
                            <div><b>Order Date</b></div>
                            <div><b>Order Status</b></div>
                            <div><b>Due <em>(Status)</em></b></div>
                            <div><b>Delivery Date</b></div>


                            {allOrders.filter((order) => order.items[0].category === 'tire').filter((order) => hideCompleted ? order.orderStatus !== 'complete' : true).map((order, idx) => (
                                <Fragment key={idx}>
                                    <div>
                                        <div className={styles.orderItems}>
                                            {order.items.map((item, index) => (
                                                <div key={index}>
                                                    {item.quantity}x {item.name} ({item.size}{item.compound ? `-` + item.compound : ''})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>{new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                                    <div>{order.orderStatus}</div>
                                    <div>${order.balanceDue}<em>({order.paymentStatus})</em></div>
                                    <div className={styles.dateControl}>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : 'Kitchener Pickup'}
                                        {order.paymentStatus !== 'paid' &&
                                            <div className={styles.productActions}>
                                                <button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteOrder', order })}><span className='material-symbols-outlined'>delete</span></button>
                                            </div>}</div>
                                </Fragment>
                            ))}
                        </div>

                        <div className={styles.orderGrid_Mobile}>
                            {allOrders.filter((order) => order.items[0].category === 'tire').filter((order) => hideCompleted ? order.orderStatus !== 'complete' : true).map((order, idx) => (
                                <div className={styles.orderEntry} key={idx}>


                                    {order.items.map((item, index) => (
                                        <div key={index}>
                                            {item.quantity}x {item.name} ({item.size}{item.compound ? `-` + item.compound : ''})
                                        </div>
                                    ))}

                                    <br></br>

                                    <div className={styles.pairing}>
                                        <div>Order Date:</div>
                                        <div>{new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                                    </div>

                                    <div className={styles.pairing}>
                                        <div>Order Status:</div>
                                        <div>{order.orderStatus}</div>
                                    </div>

                                    <div className={styles.pairing}>
                                        <div>Order Balace:</div>
                                        <div>${order.balanceDue} <em>({order.paymentStatus})</em></div>
                                    </div>

                                    <div className={styles.pairing}>
                                        <div>Delivery Date:</div>
                                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : 'Kitchener Pickup'}
                                    </div>



                                    {order.orderStatus !== 'complete' &&
                                        <button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteOrder', order })}><span className='material-symbols-outlined'>delete</span></button>
                                    }
                                </div>
                            ))}
                        </div>
                    </>
                    :
                    <div>No orders placed</div>

                }
                <h2>Gear Orders</h2>
                <div>
                    Coming soon...
                </div>
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

            <Modal open={activeModal.type === 'deleteOrder'}>
                <h3>Are you sure you want to cancel this order?</h3>
                <button className={`actionButton confirmBtn`} onClick={() => handleDeleteOrder(activeModal.order._id)}>Cancel Order</button>
                <button className='actionButton' onClick={() => setActiveModal('')}>Keep Order</button>
            </Modal>
        </>


    );
};

export default Orders;