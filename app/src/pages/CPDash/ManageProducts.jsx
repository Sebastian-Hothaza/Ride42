import { useState, useEffect } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import styles from './stylesheets/ManageProducts.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'

const ManageProducts = ({ APIServer }) => {

    const [allProducts, setAllProducts] = useState([]);
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    async function fetchProducts() {
        try {
            const response = await fetch(APIServer + 'products', {
                method: 'GET',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },

            })
            if (response.ok) {
                const data = await response.json();
                setAllProducts(data);
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



    async function handleCreateProduct(e) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Creating product' });

        // Build variants array based on form data
        let variants = [];
        if (e.target.category.value === 'tire') {
            variants.push({
                size: e.target.tireSize.value,
                compound: e.target.tireCompound.value,
                price: e.target.tirePrice.value,
                stock: e.target.tireStock.value
            })
        } else if (e.target.category.value === 'gear') {
            // Handle gear variants when they are implemented
        }
        try {
            const response = await fetch(APIServer + 'products', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                    name: e.target.name.value,
                    category: e.target.category.value,
                    variants: variants,
                })
            })
            await fetchProducts();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Product created' });
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

    async function handleEditProduct(productID) {
        console.log('editing product with id: ' + productID);
        setActiveModal('')
    }

    async function handleDeleteProduct(productID) {
        setActiveModal({ type: 'loading', msg: 'Deleting product' });
        try {
            const response = await fetch(APIServer + 'products/' + productID, {
                method: 'DELETE',
                credentials: "include",
            })
            await fetchProducts();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Product deleted' });
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
                <h1>Manage Products</h1>
                <h2>Tires</h2>
                <div>
                    {allProducts.filter(product => product.category === "tire").map(product => (
                        <div key={product._id} className={styles.productEntry}>
                            <div className={styles.productHeading}>
                                {product.name}
                                <div className={styles.buttonContainer}>
                                    <button className={styles.editBtn} style={{ color: '#0099ff' }} onClick={() => setActiveModal({ type: 'editProduct', product: product })}><span className='material-symbols-outlined'>edit</span></button>
                                    <button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteProduct', product: product })}><span className='material-symbols-outlined'>delete</span></button>
                                </div>
                            </div>

                            <div className={styles.variantsListing}>
                                {product.variants.map((variant, index) => (
                                    <div key={index} className={styles.productEntryControls}>
                                        <span>{variant.size}-{variant.compound}</span>
                                        <span>${variant.price}</span>
                                        <span>Stock: {variant.stock}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <h2>Gear</h2>
                <div>
                    Under development...
                </div>
                <button className={styles.createButton} onClick={() => setActiveModal({ type: 'createProduct' })}>Create Product</button>
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

            <Modal open={activeModal.type === 'createProduct'}>
                <>
                    <h2>Create New Product</h2>
                    <form id={styles.createProductForm} onSubmit={(e) => handleCreateProduct(e)}>
                        <div>
                            <label htmlFor="name">Name</label>
                            <input type='text' id="name" name="name" required></input>
                            <label htmlFor="category">Category</label>
                            <select id="category" name="category" required>
                                <option value="">Select a category</option>
                                <option value="tire">Tire</option>
                                <option value="gear">Gear</option>
                            </select>
                        </div>





                        <h4>Variants</h4>

                        <div className={styles.createVariant}>
                            <label htmlFor="tireSize">Tire Size</label>
                            <select id="tireSize" name="tireSize" required>
                                <option value="">Select a size</option>
                                <option value="200/60">200/60</option>
                                <option value="180/60">180/60</option>
                            </select>
                            <label htmlFor="tireCompound">Tire Compound</label>
                            <select id="tireCompound" name="tireCompound" required>
                                <option value="">Select a compound</option>
                                <option value="SC1">SC1</option>
                                <option value="SC2">SC2</option>
                                <option value="SC3">SC3</option>
                            </select>
                            <label htmlFor="tirePrice">Tire Price</label>
                            <input type='number' id="tirePrice" name="tirePrice" required></input>
                            <label htmlFor="tireStock">Tire Stock</label>
                            <input type='number' id="tireStock" name="tireStock" required></input>
                        </div>



                        <button className={`actionButton confirmBtn`} type="submit">Confirm</button>
                        <button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
                    </form>
                </>
            </Modal>

            <Modal open={activeModal.type === 'deleteProduct'}>
                <h3>Are you sure you want to delete this product?</h3>
                <button className={`actionButton confirmBtn`} onClick={() => handleDeleteProduct(activeModal.product._id)}>Delete</button>
                <button className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
            </Modal>
        </>
    )
}

export default ManageProducts;