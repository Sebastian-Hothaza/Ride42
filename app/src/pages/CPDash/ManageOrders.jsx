import { useState, useEffect } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import styles from './stylesheets/ManageProducts.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'

const ManageProducts = ({ APIServer }) => {

    const [allOrders, setallOrders] = useState([]);
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown


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
                setallOrders(data);
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



    async function handleCreateOrder(e, category) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Creating order' });
        try {
            const response = await fetch(APIServer + 'orders', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                    user: e.target.uID.value,
                    items: [],
                    deliveryDate: e.target.deliveryDate.value,
                })
            })
            await fetchOrders();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Order created' });
                setTimeout(() => setActiveModal(''), 1500)
            } else {
                const data = await response.json();
                setActiveModal({ type: 'failure', msg: data.msg.join('\n') })
            }
        } catch (err) {
            setActiveModal({ type: 'failure', msg: 'API Failure' })
            console.log(err.message)
        }
    }

    async function handleEditOrder(e, orderID) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Editing order' });
        try {
            const response = await fetch(APIServer + 'orders/' + orderID, {
                method: 'PUT',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                    orderStatus: e.target.orderStatus.value,
                    paymentStatus: e.target.paymentStatus.value,
                    deliveryDate: e.target.deliveryDate.value,
                })
            })
            await fetchOrders();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Order edited' });
                setTimeout(() => setActiveModal(''), 1500)
            } else {
                const data = await response.json();
                setActiveModal({ type: 'failure', msg: data.msg.join('\n') })
            }
        } catch (err) {
            setActiveModal({ type: 'failure', msg: 'API Failure' })
            console.log(err.message)
        }
    }

    async function handleDeleteOrder(orderID) {
        setActiveModal({ type: 'loading', msg: 'Deleting order' });
        try {
            const response = await fetch(APIServer + 'orders/' + orderID, {
                method: 'DELETE',
                credentials: "include",
            })
            await fetchOrders();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Order deleted' });
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


    console.log(allOrders)
    console.log(allOrders[0]?.items[0]?.product.category)

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Manage Orders</h1>
                <h2>Tires <button className={styles.editBtn} style={{ color: '#00ff00' }} onClick={() => setActiveModal({ type: 'createOrder_Tire' })}><span className='material-symbols-outlined'>add_circle</span></button> </h2>
                <div>
                    {allOrders.filter((order) => order.items[0].product.category === 'tire').map((order) => (
                        <div key={order._id} className={styles.productCard}>
                            <div className={styles.productInfo}>
                                <p><b>Order ID:</b> {order._id}</p>
                                <p><b>User ID:</b> {order.user}</p>
                                <p><b>Order Status:</b> {order.orderStatus}</p>
                                <p><b>Payment Status:</b> {order.paymentStatus}</p>
                                <p><b>Delivery Date:</b> {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className={styles.productActions}>
                                <button className={styles.editBtn} onClick={() => setActiveModal({ type: 'editOrder', order })}><span className="material-symbols-outlined">edit</span></button>
                                <button className={styles.deleteBtn} onClick={() => setActiveModal({ type: 'deleteOrder', order })}><span className="material-symbols-outlined">delete</span></button>
                            </div>
                        </div>
                    ))}
                </div>
                <h2>Gear</h2>
                <div>
                    Under development...
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

            <Modal open={activeModal.type === 'createOrder_Tire'}>
                <>
                    <h2>Create New Order</h2>
                    <form id={styles.createProductForm} onSubmit={(e) => handleCreateOrder(e, 'tire')}>
                        <div>
                            <label htmlFor="uID">User ID</label>
                            <input type='text' id="uID" name="uID" required></input>
                        </div>
                        <button className={`actionButton confirmBtn`} type="submit">Confirm</button>
                        <button type="button" className='actionButton' onClick={() => { setActiveModal(''), setVariants([]) }}>Cancel</button>
                    </form>
                </>
            </Modal>

            <Modal open={activeModal.type === 'editOrder'}>
                <>
                    <h2>Edit Order</h2>
                    <form id={styles.createProductForm} onSubmit={(e) => handleEditOrder(e, activeModal.order._id)}>
                        <div>
                            <label htmlFor="orderStatus">Order Status</label>
                            <select id="orderStatus" name="orderStatus" defaultValue={activeModal.order?.orderStatus} required>
                                <option value="pending">Pending</option>
                                <option value="complete">Complete</option>
                                <option value="pending design">Pending Design</option>
                                <option value="pending measurements">Pending Measurements</option>
                                <option value="pending approval">Pending Approval</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="paymentStatus">Payment Status</label>
                            <select id="paymentStatus" name="paymentStatus" defaultValue={activeModal.order?.paymentStatus} required>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="deliveryDate">Delivery Date</label>
                            <input type="date" id="deliveryDate" name="deliveryDate" defaultValue={activeModal.order?.deliveryDate} />
                        </div>








                        <button className={`actionButton confirmBtn`} type="submit">Confirm</button>
                        <button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
                    </form>
                </>
            </Modal>



            <Modal open={activeModal.type === 'deleteOrder'}>
                <h3>Are you sure you want to delete this order?</h3>
                <button className={`actionButton confirmBtn`} onClick={() => handleDeleteOrder(activeModal.order._id)}>Delete</button>
                <button className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
            </Modal>
        </>
    )
}

export default ManageProducts;