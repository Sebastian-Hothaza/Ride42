import { useState, useEffect, Fragment } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import styles from './stylesheets/ManageOrders.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'

const gearNameMap = {
    'race suit': 'Suit',
    'race gloves': 'Gloves',
    'helite airbag': 'HELITE Airbag',
    'helite cartridge': 'HELITE Cartridge',
    'airbagready': 'Airbag',
    'stingrayarmor': 'Stingray',

    'tpucaps': 'TPU',
    'kangarooleather': 'Kangaroo',
    '2-piece': '2-Piece',
};

const normalizeGearLabel = (value = '') => String(value).trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
const formatGearName = (value = '') => gearNameMap[normalizeGearLabel(value)] || value;
const formatGearAddOn = (addOn = '') => {
    const name = typeof addOn === 'string' ? addOn : addOn?.name || '';
    return formatGearName(name);
};
const formatGearItemDisplay = (item = {}) => {
    const name = formatGearName(item.name || '');
    const size = item.size ? String(item.size).trim().toUpperCase() : '';
    const color = item.color ? String(item.color).trim() : '';
    const capitalizedColor = color ? color.charAt(0).toUpperCase() + color.slice(1).toLowerCase() : '';
    const addOns = Array.isArray(item.addOns) ? item.addOns.map(formatGearAddOn) : [];

    if ((item.name || '').trim().toLowerCase().includes('glove')) {
        const details = [size, capitalizedColor].filter(Boolean).join(', ');
        return `${name}${details ? ` (${details})` : ''}`;
    }

    const details = [
        addOns.length ? `(${addOns.join(', ')})` : '',
        size ? `(${size})` : '',
        color ? `(${capitalizedColor})` : '',
    ].filter(Boolean).join(' ');

    return details ? `${name} ${details}` : name;
};

const ManageOrders = ({ APIServer }) => {

    const [allOrders, setallOrders] = useState([]);
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
    const [showCompleted, setShowCompleted] = useState(false); // Track if completed orders should be hidden
    const [deliveryDates, setDeliveryDates] = useState('');



    async function fetchOrders() {
        try {
            const response = await fetch(APIServer + 'orders?getAll=true', {
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
            console.error(err)
        }
    }


    async function fetchDates() {
        try {
            const response = await fetch(APIServer + 'presenttrackdays', {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            })
            if (response.ok) {
                const data = await response.json();
                const now = new Date();
                const upcomingDates = data.filter(td => new Date(td.date) > now).map(td => td.date);
                setDeliveryDates(upcomingDates);
            } else {
                const data = await response.json();
                console.error('failed to fetch trackday dates')
            }
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchOrders();
        fetchDates();
    }, [])

    function renderOrderTotal(order) {
        const discountedBalance = Number(order.balanceDue ?? 0);
        const originalBalance = discountedBalance + Number(order.discount ?? 0);
        const hasDiscount = Number(order.discount ?? 0) > 0;

        return (
            <div>
                {hasDiscount ? (
                    <>
                        <span style={{ textDecoration: 'line-through' }}>${originalBalance}</span>
                        <span> ${discountedBalance}</span>
                    </>
                ) : (
                    <span>${discountedBalance}</span>
                )}
                {order.paymentStatus !== 'paid' && <em> ({order.paymentStatus})</em>}
            </div>
        );
    }

    function orderHasProgressTracking(order) {
        return (order?.items ?? []).some(item =>
            Object.prototype.hasOwnProperty.call(item, 'measurementsComplete')
            || Object.prototype.hasOwnProperty.call(item, 'designComplete')
        );
    }

    function orderHasDeliveryDate(order) {
        return order?.items?.[0]?.category !== 'gear';
    }

    async function handleEditOrder(e, orderID) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Editing order' });

        const body = {
            orderStatus: e.target.orderStatus.value,
        };

        // Attached paymentStatus only if its changed
        if (e.target.paymentStatus.value) body.paymentStatus = e.target.paymentStatus.value;

        if (e.target.deliveryDate) body.deliveryDate = e.target.deliveryDate.value;
        if (e.target.measurementsComplete) body.measurementsComplete = e.target.measurementsComplete.checked;
        if (e.target.designComplete) body.designComplete = e.target.designComplete.checked;

        body.discount = e.target.discount.value ? parseFloat(e.target.discount.value) : 0;


        try {
            const response = await fetch(APIServer + 'orders/' + orderID, {
                method: 'PUT',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(body),
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
            console.error(err)
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
            console.error(err)
        }
    }



    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Manage Orders</h1>
                <div className={styles.filterControls}>
                    <label>
                        <input
                            type="checkbox"
                            checked={showCompleted}
                            onChange={(e) => setShowCompleted(e.target.checked)}
                        />
                        Show Completed
                    </label>
                </div>
                <h2>Tire Orders</h2>

                <div className={styles.orderGrid}>
                    <div><b>Name</b></div>
                    <div><b>Products (* requires install)</b></div>
                    <div><b>Order Date</b></div>
                    <div><b>Order Status</b></div>
                    <div><b>Order Total</b></div>
                    <div><b>Delivery Date</b></div>


                    {allOrders
                        .filter((order) => order.items[0].category === 'tire')
                        .filter((order) => !showCompleted ? order.orderStatus !== 'complete' : order.orderStatus === 'complete')
                        .map((order, idx) => (
                            <Fragment key={idx}>
                                <div>{order.user.firstName} {order.user.lastName}</div>
                                <div>
                                    <div className={styles.orderItems}>
                                        {order.items.map((item, index) => (
                                            <div key={index}>
                                                {item.quantity}x {item.name} {item.size}{item.compound ? `-` + item.compound : ''}{item.installRequired && '(*)'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>{new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                                <div>{order.orderStatus}</div>
                                {renderOrderTotal(order)}
                                <div>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : 'Local Pickup'}{order.orderStatus !== 'complete' &&
                                    <div className={styles.productActions}>
                                        <button className={styles.editBtn} style={{ color: '#0099ff' }} onClick={() => setActiveModal({ type: 'editOrder', order })}><span className="material-symbols-outlined">edit</span></button>
                                        <button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteOrder', order })}><span className='material-symbols-outlined'>delete</span></button>
                                    </div>
                                }</div>




                            </Fragment>
                        ))}
                </div>

                <div className={styles.orderGrid_Mobile}>
                    {allOrders
                        .filter((order) => order.items[0].category === 'tire')
                        .filter((order) => !showCompleted ? order.orderStatus !== 'complete' : order.orderStatus === 'complete')
                        .map((order, idx) => (
                            <div className={styles.orderEntry} key={idx}>
                                <div className={styles.pairing}>
                                    <div>User:</div>
                                    <div>{order.user.firstName} {order.user.lastName}</div>
                                </div>
                                <br></br>
                                {order.items.map((item, index) => (
                                    <div key={index}>
                                        {item.quantity}x {item.name} ({item.size}{item.compound ? `-` + item.compound : ''}){item.installRequired && '(*)'}
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
                                    <div>Order Total:</div>
                                    <div>{renderOrderTotal(order)}</div>
                                </div>

                                <div className={styles.pairing}>
                                    <div>Delivery Date:</div>
                                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : 'Local Pickup'}
                                </div>



                                <div>{order.orderStatus !== 'complete' &&
                                    <div className={styles.productActions}>
                                        <button className={styles.editBtn} style={{ color: '#0099ff' }} onClick={() => setActiveModal({ type: 'editOrder', order })}><span className="material-symbols-outlined">edit</span></button>
                                        <button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteOrder', order })}><span className='material-symbols-outlined'>delete</span></button>
                                    </div>
                                }</div>
                            </div>
                        ))}
                </div>

                <h2>Gear Orders</h2>

                <div className={styles.orderGrid}>
                    <div><b>Name</b></div>
                    <div><b>Products</b></div>
                    <div><b>Order Date</b></div>
                    <div><b>Order Status</b></div>
                    <div><b>Order Total</b></div>
                    <div><b>Progresss</b></div>


                    {allOrders
                        .filter((order) => order.items[0].category === 'gear')
                        .filter((order) => !showCompleted ? order.orderStatus !== 'complete' : order.orderStatus === 'complete')
                        .map((order, idx) => (
                            <Fragment key={idx}>
                                <div>{order.user.firstName} {order.user.lastName}</div>
                                <div>
                                    <div className={styles.orderItems}>
                                        {order.items.map((item, index) => (
                                            <div key={index}>
                                                {item.quantity > 1 && `${item.quantity}x `}
                                                {formatGearItemDisplay(item)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>{new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                                <div>{order.orderStatus}</div>
                                {renderOrderTotal(order)}
                                <div>{order.orderStatus !== 'complete' &&
                                    <>
                                        {orderHasProgressTracking(order) && (
                                            <div>
                                                <div>Measurements: {order.items.some(item => item.measurementsComplete === true) ? '✅' : '❌'}</div>
                                                <div>Design: {order.items.some(item => item.designComplete === true) ? '✅' : '❌'}</div>
                                            </div>
                                        )}

                                        <div className={styles.productActions}>
                                            <button className={styles.editBtn} style={{ color: '#0099ff' }} onClick={() => setActiveModal({ type: 'editOrder', order })}><span className="material-symbols-outlined">edit</span></button>
                                            <button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteOrder', order })}><span className='material-symbols-outlined'>delete</span></button>
                                        </div>
                                    </>

                                }</div>




                            </Fragment>
                        ))}
                </div>

                <div className={styles.orderGrid_Mobile}>
                    {allOrders
                        .filter((order) => order.items[0].category === 'gear')
                        .filter((order) => !showCompleted ? order.orderStatus !== 'complete' : order.orderStatus === 'complete')
                        .map((order, idx) => (
                            <div className={styles.orderEntry} key={idx}>
                                <div className={styles.pairing}>
                                    <div>User:</div>
                                    <div>{order.user.firstName} {order.user.lastName}</div>
                                </div>
                                <br></br>
                                {order.items.map((item, index) => (
                                    <div key={index}>
                                        {item.quantity}x {formatGearItemDisplay(item)}
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
                                    <div>Order Total:</div>
                                    <div>{renderOrderTotal(order)}</div>
                                </div>

                                {orderHasProgressTracking(order) && (
                                    <div className={styles.pairing}>
                                        <div>Progress:</div>
                                        <div>
                                            <div>Measurements: {order.items.some(item => item.measurementsComplete === true) ? '✅' : '❌'}</div>
                                            <div>Design: {order.items.some(item => item.designComplete === true) ? '✅' : '❌'}</div>
                                        </div>
                                    </div>
                                )}

                                <div>{order.orderStatus !== 'complete' &&
                                    <div className={styles.productActions}>
                                        <button className={styles.editBtn} style={{ color: '#0099ff' }} onClick={() => setActiveModal({ type: 'editOrder', order })}><span className="material-symbols-outlined">edit</span></button>
                                        <button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteOrder', order })}><span className='material-symbols-outlined'>delete</span></button>
                                    </div>
                                }</div>
                            </div>
                        ))}
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

            <Modal open={activeModal.type === 'editOrder'}>
                <>
                    <h2>Edit Order</h2>
                    <form id={styles.createProductForm} onSubmit={(e) => handleEditOrder(e, activeModal.order._id)}>
                        <div>
                            <label htmlFor="orderStatus">Order Status</label>
                            <select id="orderStatus" name="orderStatus" defaultValue={activeModal.order?.orderStatus} required>
                                <option value="pending">Pending</option>
                                <option value="complete">Complete</option>
                                <option value="pending production">Pending Production</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="paymentStatus">Payment Status</label>
                            <select id="paymentStatus" name="paymentStatus" defaultValue={activeModal.order?.paymentStatus}>
                                <option value="">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>

                        {activeModal.order && orderHasDeliveryDate(activeModal.order) && <div>
                            <label htmlFor="deliveryDate">Delivery Date</label>
                            <select id="deliveryDate" name="deliveryDate" defaultValue={activeModal.order?.deliveryDate || ''}>
                                <option key="deliverDateNone" value=''>Kitchener Pickup</option>
                                {deliveryDates.map(date => (
                                    <option key={date} value={date}>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} Trackday</option>
                                ))}
                            </select>
                        </div>}

                        {activeModal.order && orderHasProgressTracking(activeModal.order) && (
                            <>
                                <div>
                                    <label>
                                        <input
                                            type="checkbox"
                                            id="measurementsComplete"
                                            name="measurementsComplete"
                                            defaultChecked={activeModal.order.items.some(item => item.measurementsComplete === true)}
                                        />
                                        Measurements complete
                                    </label>
                                </div>
                                <div>
                                    <label>
                                        <input
                                            type="checkbox"
                                            id="designComplete"
                                            name="designComplete"
                                            defaultChecked={activeModal.order.items.some(item => item.designComplete === true)}
                                        />
                                        Design complete
                                    </label>
                                </div>
                            </>
                        )}

                        <div>
                            <label htmlFor="discount">Discount</label>
                            <input type="number" id="discount" name="discount" defaultValue={activeModal.order?.discount || 0} />
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

export default ManageOrders;