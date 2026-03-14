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
    const [variants, setVariants] = useState([{ size: "", compound: "", price: "", stock: "" }]); // Used for both create and edit modals to track variant inputs

    const TIRE_SIZES = ["110/70", "120/70", "125/70", "140/70", "150/60", "160/60", "180/55", "180/60", "190/60", "200/55", "200/60", "200/65"];
    const TIRE_COMPOUNDS = ["SC1", "SC2", "SC3"];

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



    // helper to strip out empty compound values so they don't end up as an empty string in the payload
    const cleanVariants = (list) => {
        return list.map(v => {
            const { compound, ...rest } = v;
            if (compound && compound !== "") {
                return { ...rest, compound };
            }
            return rest;
        });
    };

    async function handleCreateProduct(e, category) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Creating product' });
        try {
            const payload = {
                name: e.target.name.value,
                category: category,
                variants: cleanVariants(variants),
            };

            const response = await fetch(APIServer + 'products', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(payload)
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

    async function handleEditProduct(e, productID) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Editing product' });
        try {
            const payload = {
                name: e.target.name.value,
                category: activeModal.product.category,
                variants: cleanVariants(variants),
            };

            const response = await fetch(APIServer + 'products/' + productID, {
                method: 'PUT',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(payload)
            })
            await fetchProducts();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Product edited' });
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

    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
    };

    const addVariant = () => {
        setVariants([
            ...variants,
            { size: "", compound: "", price: "", stock: "" }
        ]);
    };

    const removeVariant = (index) => {
        const updated = variants.filter((_, i) => i !== index);
        setVariants(updated);
    };

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Manage Products</h1>
                <h2>Tires <button className={styles.editBtn} style={{ color: '#00ff00' }} onClick={() => setActiveModal({ type: 'createProduct_Tire' })}><span className='material-symbols-outlined'>add_circle</span></button> </h2>
                <div>
                    {allProducts.filter(product => product.category === "tire").map(product => (
                        <div key={product._id} className={styles.productEntry}>
                            <div className={styles.productHeading}>
                                {product.name}
                                <div className={styles.buttonContainer}>
                                    <button className={styles.editBtn} style={{ color: '#0099ff' }} onClick={() => {
                                        setActiveModal({ type: 'editProduct_Tire', product: product });
                                        // make sure controlled fields have string values
                                        setVariants(product.variants.map(v => ({
                                            size: v.size || "",
                                            compound: v.compound || "",
                                            price: v.price || "",
                                            stock: v.stock || ""
                                        })));
                                    }}><span className='material-symbols-outlined'>edit</span></button>
                                    <button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteProduct', product: product })}><span className='material-symbols-outlined'>delete</span></button>
                                </div>
                            </div>

                            <div className={styles.variantsListing}>
                                {product.variants.map((variant, index) => (
                                    <div key={index} className={styles.productEntryControls}>
                                        <span>{variant.size}{variant.compound ? `-` + variant.compound : ''}</span>
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

            <Modal open={activeModal.type === 'createProduct_Tire'}>
                <>
                    <h2>Create New Tire Product</h2>
                    <form id={styles.createProductForm} onSubmit={(e) => handleCreateProduct(e, 'tire')}>
                        <div>
                            <label htmlFor="name">Name</label>
                            <input type='text' id="name" name="name" required></input>
                        </div>



                        <h4>Variants</h4>

                        {variants.map((variant, index) => (
                            <div key={index} className={styles.createVariant}>
                                <div>
                                    <label>Size</label>
                                    <select value={variant.size} onChange={(e) => handleVariantChange(index, "size", e.target.value)} required>
                                        <option value=""></option>
                                        {TIRE_SIZES.map(tire => <option key={tire} value={tire}>{tire}</option>)}
                                    </select>
                                </div>


                                <div>
                                    <label>Compound</label>
                                    <select value={variant.compound} onChange={(e) => handleVariantChange(index, "compound", e.target.value)}>
                                        <option value=""></option>
                                        {TIRE_COMPOUNDS.map(tire => <option key={tire} value={tire}>{tire}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Price</label>
                                    <input type="number" value={variant.price} onChange={(e) => handleVariantChange(index, "price", e.target.value)} required />
                                </div>
                                <div>
                                    <label>Stock</label>
                                    <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, "stock", e.target.value)} required />
                                </div>
                                {variants.length > 1 && (<button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => removeVariant(index)}><span className='material-symbols-outlined'>delete</span></button>)}
                            </div>
                        ))}

                        <button type="button" className='actionButton' onClick={addVariant}>
                            + Add Variant
                        </button>


                        <button className={`actionButton confirmBtn`} type="submit">Confirm</button>
                        <button type="button" className='actionButton' onClick={() => { setActiveModal(''), setVariants([]) }}>Cancel</button>
                    </form>
                </>
            </Modal>

            <Modal open={activeModal.type === 'editProduct_Tire'}>
                <>
                    <h2>Edit Tire Product</h2>
                    <form id={styles.createProductForm} onSubmit={(e) => handleEditProduct(e, activeModal.product._id)}>
                        <div>
                            <label htmlFor="name">Name</label>
                            <input type='text' id="name" name="name" defaultValue={activeModal.product?.name} required></input>
                        </div>



                        <h4>Variants</h4>

                        {variants.map((variant, index) => (
                            <div key={index} className={styles.createVariant}>
                                <div>
                                    <label>Size</label>
                                    <select value={variant.size} onChange={(e) => handleVariantChange(index, "size", e.target.value)} required>
                                        <option value=""></option>
                                        {TIRE_SIZES.map(tire => <option key={tire} value={tire}>{tire}</option>)}
                                    </select>
                                </div>


                                <div>
                                    <label>Compound</label>
                                    <select value={variant.compound} onChange={(e) => handleVariantChange(index, "compound", e.target.value)}>
                                        <option value=""></option>
                                        {TIRE_COMPOUNDS.map(tire => <option key={tire} value={tire}>{tire}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Price</label>
                                    <input type="number" value={variant.price} onChange={(e) => handleVariantChange(index, "price", e.target.value)} required />
                                </div>
                                <div>
                                    <label>Stock</label>
                                    <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, "stock", e.target.value)} required />
                                </div>
                                {variants.length > 1 && (<button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => removeVariant(index)}><span className='material-symbols-outlined'>delete</span></button>)}
                            </div>
                        ))}

                        <button type="button" className='actionButton' onClick={addVariant}>
                            + Add Variant
                        </button>


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