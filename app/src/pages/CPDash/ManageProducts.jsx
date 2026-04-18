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
    const [addOns, setAddOns] = useState([]); // Used for both create and edit modals to track add-on inputs

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

    // helper to strip out empty add-on values so they don't end up as an empty string in the payload
    const cleanAddOns = (list) => {
        return list.map(a => {
            const { name, priceAdjustment, ...rest } = a;
            if (name && name !== "") {
                return { ...rest, name, priceAdjustment };
            }
            return rest;
        });
    };

    async function handleCreateProduct(e, category) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Creating product' });
        try {
            let payload;
            if (category === 'tire') {
                payload = {
                    name: e.target.name.value,
                    category: category,
                    variants: cleanVariants(variants),

                };
            } else if (category === 'gear') {
                let sizes = Array.from(e.target.sizes).filter(input => input.checked).map(input => input.value);
                let colors = Array.from(e.target.colors).filter(input => input.checked).map(input => input.value);
                let addOnOpts = cleanAddOns(addOns);
                payload = {
                    name: e.target.name.value,
                    category: category,
                    basePrice: e.target.price.value,
                };
                if (sizes.length > 0) payload.sizes = sizes;
                if (colors.length > 0) payload.colors = colors;
                if (addOnOpts.length > 0) payload.addOnOptions = addOnOpts;
            }

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

    async function handleEditProduct(e, productID, category) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Editing product' });
        try {
            let payload;
            if (category === 'tire') {
                payload = {
                    name: e.target.name.value,
                    category: category,
                    variants: cleanVariants(variants),

                };
            } else if (category === 'gear') {
                payload = {
                    name: e.target.name.value,
                    category: category,
                    basePrice: e.target.price.value,
                    sizes: Array.from(e.target.sizes).filter(input => input.checked).map(input => input.value),
                    colors: Array.from(e.target.colors).filter(input => input.checked).map(input => input.value),
                    addOnOptions: cleanAddOns(addOns)
                };
            
            }

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

    const handleAddOnChange = (index, field, value) => {
        const updated = [...addOns];
        updated[index][field] = value;
        setAddOns(updated);
    }

    const addAddOn = () => {
        setAddOns([
            ...addOns,
            { name: "", priceAdjustment: "" }
        ]);
    }

    const removeAddOn = (index) => {
        const updated = addOns.filter((_, i) => i !== index);
        setAddOns(updated);
    }



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


                        </div>
                    ))}
                </div>

                <h2>Gear <button className={styles.editBtn} style={{ color: '#00ff00' }} onClick={() => setActiveModal({ type: 'createProduct_Gear' })}><span className='material-symbols-outlined'>add_circle</span></button> </h2>
                <div>
                    {allProducts.filter(product => product.category === "gear").map(product => (
                        <div key={product._id} className={styles.productEntry}>
                            <div className={styles.productHeading}>
                                {product.name}
                                <div className={styles.buttonContainer}>
                                    <button className={styles.editBtn} style={{ color: '#0099ff' }} onClick={() => {
                                        setActiveModal({ type: 'editProduct_Gear', product: product });
                                        // make sure controlled fields have string values
                                        setAddOns(product.addOnOptions || []);
                                       
                                    }}><span className='material-symbols-outlined'>edit</span></button>
                                    <button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteProduct', product: product })}><span className='material-symbols-outlined'>delete</span></button>
                                </div>
                            </div>
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


            <Modal open={activeModal.type === 'createProduct_Tire'}>
                <>
                    <h2>Create New Tire Product</h2>
                    <form className={styles.createProductForm} onSubmit={(e) => handleCreateProduct(e, 'tire')}>
                        <div>
                            <label htmlFor="name">Name</label>
                            <input type='text' id="name" name="name" required></input>
                        </div>



                        <h4>Variants</h4>

                        {variants.map((variant, index) => (
                            <div key={index} className={styles.createVariant}>
                                <div className={styles.inputPairing}>
                                    <label>Size</label>
                                    <select value={variant.size} onChange={(e) => handleVariantChange(index, "size", e.target.value)} required>
                                        <option value=""></option>
                                        {TIRE_SIZES.map(tire => <option key={tire} value={tire}>{tire}</option>)}
                                    </select>
                                </div>


                                <div className={styles.inputPairing}>
                                    <label>Compound</label>
                                    <select value={variant.compound} onChange={(e) => handleVariantChange(index, "compound", e.target.value)}>
                                        <option value=""></option>
                                        {TIRE_COMPOUNDS.map(tire => <option key={tire} value={tire}>{tire}</option>)}
                                    </select>
                                </div>
                                <div className={styles.inputPairing}>
                                    <label>Price</label>
                                    <input type="number" value={variant.price} onChange={(e) => handleVariantChange(index, "price", e.target.value)} required />
                                </div>
                                <div className={styles.inputPairing}>
                                    <label>Stock</label>
                                    <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, "stock", e.target.value)} required />
                                </div>
                                {variants.length > 1 && (<button type="button" className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => removeVariant(index)}><span className='material-symbols-outlined'>delete</span></button>)}
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
                    <form className={styles.createProductForm} onSubmit={(e) => handleEditProduct(e, activeModal.product._id, 'tire')}>
                        <div>
                            <label htmlFor="name">Name</label>
                            <input type='text' id="name" name="name" defaultValue={activeModal.product?.name} required></input>
                        </div>



                        <h4>Variants</h4>

                        {variants.map((variant, index) => (
                            <div key={index} className={styles.createVariant}>

                                <div className={styles.inputPairing}>
                                    <label>Size</label>
                                    <select value={variant.size} onChange={(e) => handleVariantChange(index, "size", e.target.value)} required>
                                        <option value=""></option>
                                        {TIRE_SIZES.map(tire => <option key={tire} value={tire}>{tire}</option>)}
                                    </select>
                                </div>

                                <div className={styles.inputPairing}>
                                    <label>Compound</label>
                                    <select value={variant.compound} onChange={(e) => handleVariantChange(index, "compound", e.target.value)}>
                                        <option value=""></option>
                                        {TIRE_COMPOUNDS.map(tire => <option key={tire} value={tire}>{tire}</option>)}
                                    </select>
                                </div>

                                <div className={styles.inputPairing}>
                                    <label>Price</label>
                                    <input type="number" value={variant.price} onChange={(e) => handleVariantChange(index, "price", e.target.value)} required />
                                </div>

                                <div className={styles.inputPairing}>
                                    <label>Stock</label>
                                    <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, "stock", e.target.value)} required />
                                </div>

                                {variants.length > 1 && (<button type="button" className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => removeVariant(index)}><span className='material-symbols-outlined'>delete</span></button>)}
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

        
            <Modal open={activeModal.type === 'createProduct_Gear'}>
                <>
                    <h2>Create Gear Product</h2>
                    <form className={styles.createProductForm} onSubmit={(e) => handleCreateProduct(e, 'gear')}>
                        <div>
                            <label htmlFor="name">Name</label>
                            <input type='text' id="name" name="name" required></input>
                        </div>
                        <div>
                            <label htmlFor="price">Base Price</label>
                            <input type='number' id="price" name="price" required></input>
                        </div>

                        <div>
                            <label>Available Sizes</label>
                            <div className={styles.checkboxGroup}>
                                <div>
                                    <input type="checkbox" id="custom" name="sizes" value="custom" />
                                    <label htmlFor="custom">Custom</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="xs" name="sizes" value="xs" />
                                    <label htmlFor="xs">XS</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="s" name="sizes" value="s" />
                                    <label htmlFor="s">S</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="m" name="sizes" value="m" />
                                    <label htmlFor="m">M</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="l" name="sizes" value="l" />
                                    <label htmlFor="l">L</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="xl" name="sizes" value="xl" />
                                    <label htmlFor="xl">XL</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="xxl" name="sizes" value="xxl" />
                                    <label htmlFor="xxl">XXL</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="s/m" name="sizes" value="s/m" />
                                    <label htmlFor="s/m">S/M</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="l/xl" name="sizes" value="l/xl" />
                                    <label htmlFor="l/xl">L/XL</label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label>Available Colors</label>
                            <div className={styles.checkboxGroup}>
                                <div>
                                    <input type="checkbox" id="custom" name="colors" value="custom" />
                                    <label htmlFor="custom">Custom</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="black" name="colors" value="black" />
                                    <label htmlFor="black">Black</label>
                                </div>

                                <div>
                                    <input type="checkbox" id="white" name="colors" value="white" />
                                    <label htmlFor="white">White</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="red" name="colors" value="red" />
                                    <label htmlFor="red">Red</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="blue" name="colors" value="blue" />
                                    <label htmlFor="blue">Blue</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="green" name="colors" value="green" />
                                    <label htmlFor="green">Green</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="lime" name="colors" value="lime" />
                                    <label htmlFor="lime">Lime</label>
                                </div>

                            </div>
                        </div>

                        <h4>Add-On Options</h4>

                        {addOns.map((addon, index) => (
                            <div key={index} className={styles.createVariant}>
                                <div className={styles.inputPairing}>
                                    <label htmlFor={`addon-name-${index}`}>Name</label>
                                    <input
                                        type='text'
                                        id={`addon-name-${index}`}
                                        name={`addonName-${index}`}
                                        value={addon.name}
                                        onChange={(e) => handleAddOnChange(index, 'name', e.target.value)}
                                    />
                                </div>

                                <div className={styles.inputPairing}>
                                    <label htmlFor={`addon-price-${index}`}>Price</label>
                                    <input
                                        type='number'
                                        id={`addon-price-${index}`}
                                        name={`addonPriceAdjustment-${index}`}
                                        value={addon.priceAdjustment}
                                        onChange={(e) => handleAddOnChange(index, 'priceAdjustment', e.target.value)}
                                    />
                                </div>

                                {addOns.length > 1 && (<button type="button" className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => removeAddOn(index)}><span className='material-symbols-outlined'>delete</span></button>)}
                            </div>
                        ))}

                        <button type="button" className='actionButton' onClick={addAddOn}>
                            + Add Add-On
                        </button>

                        <button className={`actionButton confirmBtn`} type="submit">Confirm</button>
                        <button type="button" className='actionButton' onClick={() => { setActiveModal(''), setAddOns([]) }}>Cancel</button>
                    </form>
                </>
            </Modal>
            <Modal open={activeModal.type === 'editProduct_Gear'}>
                <>
                    <h2>Edit Gear Product</h2>
                    <form className={styles.createProductForm} onSubmit={(e) => handleEditProduct(e, activeModal.product._id, 'gear')}>
                        <div>
                            <label htmlFor="name">Name</label>
                            <input type='text' id="name" name="name" defaultValue={activeModal.product?.name} required></input>
                        </div>
                        <div>
                            <label htmlFor="price">Base Price</label>
                            <input type='number' id="price" name="price" defaultValue={activeModal.product?.basePrice} required></input>
                        </div>

                         <div>
                            <label>Available Sizes</label>
                            <div className={styles.checkboxGroup}>
                                <div>
                                    <input type="checkbox" id="custom" name="sizes" value="custom" defaultChecked={activeModal.product?.sizes?.includes('custom')} />
                                    <label htmlFor="custom">Custom</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="xs" name="sizes" value="xs" defaultChecked={activeModal.product?.sizes?.includes('xs')} />
                                    <label htmlFor="xs">XS</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="s" name="sizes" value="s" defaultChecked={activeModal.product?.sizes?.includes('s')} />
                                    <label htmlFor="s">S</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="m" name="sizes" value="m" defaultChecked={activeModal.product?.sizes?.includes('m')} />
                                    <label htmlFor="m">M</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="l" name="sizes" value="l" />
                                    <label htmlFor="l">L</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="xl" name="sizes" value="xl" />
                                    <label htmlFor="xl">XL</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="xxl" name="sizes" value="xxl" />
                                    <label htmlFor="xxl">XXL</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="s/m" name="sizes" value="s/m" defaultChecked={activeModal.product?.sizes?.includes('s/m')} />
                                    <label htmlFor="s/m">S/M</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="l/xl" name="sizes" value="l/xl" defaultChecked={activeModal.product?.sizes?.includes('l/xl')} />
                                    <label htmlFor="l/xl">L/XL</label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label>Available Colors</label>
                            <div className={styles.checkboxGroup}>
                                <div>
                                    <input type="checkbox" id="custom" name="colors" value="custom" defaultChecked={activeModal.product?.colors?.includes('custom')} />
                                    <label htmlFor="custom">Custom</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="black" name="colors" value="black" defaultChecked={activeModal.product?.colors?.includes('black')} />
                                    <label htmlFor="black">Black</label>
                                </div>

                                <div>
                                    <input type="checkbox" id="white" name="colors" value="white" defaultChecked={activeModal.product?.colors?.includes('white')} />
                                    <label htmlFor="white">White</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="red" name="colors" value="red" defaultChecked={activeModal.product?.colors?.includes('red')} />
                                    <label htmlFor="red">Red</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="blue" name="colors" value="blue" defaultChecked={activeModal.product?.colors?.includes('blue')} />
                                    <label htmlFor="blue">Blue</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="green" name="colors" value="green" defaultChecked={activeModal.product?.colors?.includes('green')} />
                                    <label htmlFor="green">Green</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="lime" name="colors" value="lime" defaultChecked={activeModal.product?.colors?.includes('lime')} />
                                    <label htmlFor="lime">Lime</label>
                                </div>

                            </div>
                        </div>

                        <h4>Add-On Options</h4>

                        {addOns.map((addon, index) => (
                            <div key={index} className={styles.createVariant}>
                                <div className={styles.inputPairing}>
                                    <label htmlFor={`addon-name-${index}`}>Name</label>
                                    <input
                                        type='text'
                                        id={`addon-name-${index}`}
                                        name={`addonName-${index}`}
                                        value={addon.name}
                                        onChange={(e) => handleAddOnChange(index, 'name', e.target.value)}
                                    />
                                </div>

                                <div className={styles.inputPairing}>
                                    <label htmlFor={`addon-price-${index}`}>Price</label>
                                    <input
                                        type='number'
                                        id={`addon-price-${index}`}
                                        name={`addonPriceAdjustment-${index}`}
                                        value={addon.priceAdjustment}
                                        onChange={(e) => handleAddOnChange(index, 'priceAdjustment', e.target.value)}
                                    />
                                </div>

                                {<button type="button" className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => removeAddOn(index)}><span className='material-symbols-outlined'>delete</span></button>}
                            </div>
                        ))}

                        <button type="button" className='actionButton' onClick={addAddOn}>
                            + Add Add-On
                        </button>

                        <button className={`actionButton confirmBtn`} type="submit">Confirm</button>
                        <button type="button" className='actionButton' onClick={() => { setActiveModal('') }}>Cancel</button>
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