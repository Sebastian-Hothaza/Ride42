import styles from './stylesheets/ShopGear.module.css'
import Card from "../components/Card"
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react"

import modalStyles from '../components/stylesheets/Modal.module.css'

import Modal from "../components/Modal";
import Loading from '../components/Loading';

import checkmark from './../assets/checkmark.png'
import errormark from './../assets/error.png'

import cover from '../assets/shopGear/cover.jpg'
import heliteAirbag from './../assets/helite.png'
import stingray from '../assets/shopGear/stingray.jpg'
import tpu from '../assets/shopGear/tpu.jpg'
import kangaroo from '../assets/shopGear/kangaroo.png'
import twoPiece from '../assets/shopGear/2piece.png'
import plusLogo from '../assets/shopGear/plusLogo.png'





// Glove pictures
import gloveBlack from '../assets/shopGear/gloves/Black.webp'
import gloveRed from '../assets/shopGear/gloves/Red.webp'
import gloveBlue from '../assets/shopGear/gloves/Blue.webp'
import gloveWhite from '../assets/shopGear/gloves/White.webp'
import gloveFluo from '../assets/shopGear/gloves/Fluo.webp'
import gloveGreen from '../assets/shopGear/gloves/Green.webp'
import gloveWhite2 from '../assets/shopGear/gloves/White_2.webp'
import gloveSizingGuide from '../assets/shopGear/gloves/sizing.png'
import gloveShowcase from '../assets/shopGear/gloves/gloveShowcase.jpg'

// Sponsored Riders
import David from '../assets/shopGear/david.jpg'
import Chris from '../assets/shopGear/chris.jpg'
import Zoli from '../assets/shopGear/zoli.jpg'
import Nathan from '../assets/shopGear/nathan.jpeg'
import Cole from '../assets/shopGear/cole.jpg'
import Chopper from '../assets/shopGear/chopper.jpg'

// Suit add-on choices used by the custom suit wizard.
// The page intentionally uses a fixed list so the same options can be rendered in a consistent order.
const SUIT_ADDON_OPTIONS = [
  {
    key: 'airbagReady',
    label: 'Airbag Ready',
    description: (
      <>
        A huge part of reducing injuries in a crash. This add on will prepare your suit to work with a variety of airbags. We will contact you to discuss available airbag options.
      </>
    ),
    imagePath: heliteAirbag
  },
  {
    key: 'stingrayArmor',
    label: 'Stingray',
    description: (
      <>
        Stingray armor package for extra abrasion protection in high-wear zones. Designed to slide and reduce tumbling in a crash while also protecting the suit. <strong>Highly recommended!</strong>
      </>
    ),
    imagePath: stingray
  },
  {
    key: 'TPUCaps',
    label: 'TPU Caps',
    description: (
      <>
        Mostly a cosmetic add-on, TPU caps are a lightweight and flexible alternative to the standard
      </>
    ),
    imagePath: tpu
  },
  {
    key: 'kangarooLeather',
    label: 'Kangaroo Hide',
    description: (
      <>
        More supple than cowhide, kangaroo leather is a premium option for your suit. Requires considerably more care and maintenance.
      </>
    ),
    imagePath: kangaroo
  },
  {
    key: '2-piece',
    label: '2-Piece',
    description: (
      <>
        Pants and jacket zip together. Ideal for suits being used on the street. Not recommended for track use.
      </>
    ),
    imagePath: twoPiece
  },
];

// Normalizes option names before comparing them to product metadata.
const normalizeAddOnName = (name = '') => String(name).replace(/\s+/g, '').replace(/-/g, '').toLowerCase();

// ShopGear handles both standard gear selection and the custom Superman suit flow.
// The component is responsible for product selection, size/color logic, pricing, checkout payload formation,
// and the suit-bundle wizard that can add gloves as part of the build process.
const ShopGear = ({ APIServer }) => {
  // Shared product/search helpers so the same lookup patterns are not repeated throughout the page.
  const formatMoney = (value = 0) => Math.round(Number(value || 0));
  const isCustomSizeValue = (value = '') => String(value).trim().toLowerCase() === 'custom';
  const getGearProductById = (productId) => gearProducts.find((product) => product._id === productId);
  const getGloveProduct = () => gearProducts.find((item) => (item.name || '').trim().toLowerCase() === 'race gloves');
  const getCustomPremium = (gear, sizeValue = '') => {
    if (!gear || !isCustomSizeValue(sizeValue)) return 0;
    return (gear.addOnOptions ?? []).find((option) => String(option.name).trim().toLowerCase() === 'custom')?.priceAdjustment || 0;
  };
  const getOrderedSizes = (sizes = []) => {
    const standardSizes = sizes.filter((size) => !isCustomSizeValue(size));
    const customSizes = sizes.filter((size) => isCustomSizeValue(size));
    return [...standardSizes, ...customSizes];
  };
  const getSuitAddOnPrice = (optionKey = '') => {
    const suitProduct = getGearProductById(selectedGear)
      || gearProducts.find((item) => {
        const name = (item.name || '').trim().toLowerCase();
        return name.includes('suit') && !name.includes('glove');
      });
    const matchingOption = (suitProduct?.addOnOptions ?? []).find((option) =>
      normalizeAddOnName(option.name) === normalizeAddOnName(optionKey)
    );
    return Number(matchingOption?.priceAdjustment || 0);
  };
  const getCartEntryId = (item = {}) => {
    const addOnKey = Array.isArray(item.addOns) ? item.addOns.join('|') : '';
    const tag = item.isSuitGloves ? 'suit-glove' : 'gear';
    return [item.product ?? '', item.size ?? '', item.color ?? '', addOnKey, tag].join('::');
  };

  // User and order state.
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(loggedInUser?.id);
  const [activeModal, setActiveModal] = useState('');
  const [suitBuilderOpen, setSuitBuilderOpen] = useState(false);
  const [suitBuilderStep, setSuitBuilderStep] = useState(0);
  const [pendingSuitAddOns, setPendingSuitAddOns] = useState([]);

  const [gearProducts, setGearProducts] = useState([]);
  const [sizesAvailable, setSizesAvailable] = useState([]);
  const [colorsAvailable, setColorsAvailable] = useState([]);

  const [selectedGear, setSelectedGear] = useState('');
  const [selectedGearPrice, setSelectedGearPrice] = useState(9999);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedaddOns, setSelectedaddOns] = useState([]);
  const [qtyOrder, setQtyOrder] = useState(1);
  const [suitGlovesSelected, setSuitGlovesSelected] = useState(false);
  const [suitGloveSize, setSuitGloveSize] = useState('');
  const [suitGloveColor, setSuitGloveColor] = useState('');

  const navigate = useNavigate();
  const [userCart, setUserCart] = useState([]);

  // Bundle pricing logic: a $20 order discount applies only when a suit and gloves are both in the cart.
  // The discount is calculated at the order-total level instead of mutating the glove item itself.
  const hasSuitInCart = userCart.some(item => {
    const product = gearProducts.find(p => p._id === item.product);
    const productName = (product?.name || '').trim().toLowerCase();
    return productName.includes('suit') && !productName.includes('glove');
  });
  const hasSuitAndGlovesInCart = userCart.some(item => item.isSuitGloves === true) && hasSuitInCart;
  const orderSubtotal = userCart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const bundleDiscount = hasSuitAndGlovesInCart ? 20 : 0;
  const balanceDue = orderSubtotal - bundleDiscount;

  const gearNameMap = {
    'helite cartridge': 'HELITE Cartridge',
    'helite airbag': 'HELITE Airbag',
    'race gloves': 'Predator Gloves',
    'race suit': 'PLUS Custom Suit',
  };
  const gearDropdownOrder = {
    'race suit': 0,
    'superman suit': 0,
    'race gloves': 1,
    'helite airbag': 2,
    'helite cartridge': 3,
  };

  const selectedGearDetails = getGearProductById(selectedGear);
  const isSupermanSuit = selectedGearDetails && ['race suit', 'superman suit'].includes((selectedGearDetails.name || '').toLowerCase());
  const isCustomSizeSelected = !!selectedSize && isCustomSizeValue(selectedSize);

  const formatSizeLabel = (size) => {
    const sizeText = String(size ?? '').trim();
    if (!sizeText) return '';
    return isCustomSizeValue(sizeText) ? 'Custom' : sizeText.toUpperCase();
  };

  const formatColorLabel = (color) => {
    const colorText = String(color ?? '').trim();
    if (!colorText) return '';
    return isCustomSizeValue(colorText) ? 'Custom' : colorText.charAt(0).toUpperCase() + colorText.slice(1).toLowerCase();
  };

  // Fetch product catalog and keep the gear dropdown in a consistent custom order.
  async function fetchProducts() {
    try {
      const response = await fetch(APIServer + 'products?getAll=true', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sortedGear = data
          .filter(p => p.category === 'gear')
          .sort((a, b) => {
            const aKey = (a.name || '').trim().toLowerCase();
            const bKey = (b.name || '').trim().toLowerCase();
            const aOrder = gearDropdownOrder[aKey] ?? 999;
            const bOrder = gearDropdownOrder[bKey] ?? 999;
            return aOrder - bOrder || aKey.localeCompare(bKey);
          });
        setGearProducts(sortedGear);
      } else {
        console.error('failed to fetch products');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch(APIServer + 'users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      });

      if (response.ok) {
        const data = await response.json();
        data.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setAllUsers(data);
      } else {
        console.error('failed to fetch users');
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Initial data hydration.
  useEffect(() => {
    fetchProducts();
    if (loggedInUser && loggedInUser.memberType === 'admin') fetchUsers();
  }, []);

  // When the selected gear item changes, reset the size/color state and recalculate the configured price.
  useEffect(() => {
    if (!selectedGear) {
      setSizesAvailable([]);
      setColorsAvailable([]);
      setSelectedaddOns([]);
      return;
    }

    const gear = getGearProductById(selectedGear);
    if (!gear) return;

    const customPremium = getCustomPremium(gear, selectedSize);
    setSizesAvailable(getOrderedSizes(gear.sizes ?? []));
    setColorsAvailable(gear.colors ?? []);
    setSelectedaddOns([]);
    setSelectedGearPrice((gear.basePrice ?? 9999) + customPremium);
  }, [selectedGear, gearProducts, selectedSize]);

  // Custom sizing is treated as a special case: color is set to "custom" and the color selector is hidden.
  useEffect(() => {
    if (isCustomSizeSelected) {
      setSelectedColor('custom');
    } else if (selectedColor === 'custom') {
      setSelectedColor('');
    }
  }, [isCustomSizeSelected]);

  // Adds a standard gear item to the cart with size, color, add-on values, and the correct base price.
  function addGearToCart(addOnNames = selectedaddOns) {

    const gear = getGearProductById(selectedGear);
    const basePrice = gear?.basePrice ?? selectedGearPrice;
    const customSizePremium = getCustomPremium(gear, selectedSize);

    const effectiveAddOnNames = Array.isArray(addOnNames) ? [...addOnNames] : [];
    if (customSizePremium && !effectiveAddOnNames.some(name => normalizeAddOnName(name) === 'custom')) {
      effectiveAddOnNames.push('custom');
    }

    const addOnTotal = (gear?.addOnOptions ?? []).reduce((sum, option) => {
      const isSelected = effectiveAddOnNames.some(name => normalizeAddOnName(option.name) === normalizeAddOnName(name));
      return sum + (isSelected ? (option.priceAdjustment || 0) : 0);
    }, 0);

    setUserCart(current => [
      ...current,
      {
        cartId: getCartEntryId({
          product: selectedGear,
          size: selectedSize,
          color: selectedColor,
          addOns: effectiveAddOnNames,
        }),
        product: selectedGear,
        ...(selectedSize ? { size: selectedSize } : {}),
        ...(selectedColor ? { color: selectedColor } : {}),
        ...(effectiveAddOnNames.length ? { addOns: effectiveAddOnNames } : {}),
        price: basePrice + addOnTotal,
        quantity: qtyOrder,
      },
    ]);

    setSelectedGear('');
    setSelectedSize('');
    setSelectedColor('');
    setSelectedaddOns([]);
    setQtyOrder(1);
    setSelectedGearPrice(9999);
    setPendingSuitAddOns([]);
    setSuitBuilderStep(0);
    setSuitBuilderOpen(false);
  }

  // Adds the glove item created by the suit-builder flow.
  // This is stored as a separate cart entry with a marker so the bulk discount logic can detect it.
  function addSuitGlovesToCart() {
    const gloveProduct = getGloveProduct();
    if (!gloveProduct) return;

    const customPremium = getCustomPremium(gloveProduct, suitGloveSize);

    setUserCart(current => {
      const existingIndex = current.findIndex(item => item.product === gloveProduct._id);
      if (existingIndex !== -1) {
        return current;
      }

      return [
        ...current,
        {
          cartId: getCartEntryId({
            product: gloveProduct._id,
            size: suitGloveSize,
            color: suitGloveColor,
            isSuitGloves: true,
          }),
          product: gloveProduct._id,
          price: (gloveProduct.basePrice ?? 0) + customPremium,
          quantity: 1,
          size: suitGloveSize || undefined,
          color: suitGloveColor || undefined,
          isSuitGloves: true,
        },
      ];
    });
  }

  // Entry point for the add-to-cart form. Superman suit selection opens the custom builder flow instead of adding immediately.
  function handleAddGear(e) {
    e.preventDefault();
    if (isSupermanSuit) {
      setPendingSuitAddOns([]);
      setSuitGlovesSelected(false);
      setSuitBuilderStep(0);
      setSuitBuilderOpen(true);
      return;
    }

    addGearToCart(selectedaddOns);
  }

  // Moves the custom suit wizard through its fixed step order.
  // Depending on the current step, this either records an add-on decision or advances into the glove prompt.
  function handleSuitBuilderChoice(addToSuit) {
    const isGlovePrompt = suitBuilderStep === SUIT_ADDON_OPTIONS.length + 1;

    if (isGlovePrompt) {
      setSuitGlovesSelected(addToSuit);
      if (addToSuit) {
        setSuitGloveSize('');
        setSuitGloveColor('');
        setSuitBuilderStep(SUIT_ADDON_OPTIONS.length + 2);
      } else {
        setSuitBuilderStep(SUIT_ADDON_OPTIONS.length + 3);
      }
      return;
    }

    const currentOption = SUIT_ADDON_OPTIONS[suitBuilderStep - 1];
    if (!currentOption) return;

    const nextAddOns = addToSuit
      ? [...pendingSuitAddOns, currentOption.key]
      : pendingSuitAddOns;

    const isLastStep = suitBuilderStep === SUIT_ADDON_OPTIONS.length;

    setPendingSuitAddOns(nextAddOns);
    setSelectedaddOns(nextAddOns);

    if (isLastStep) {
      setSuitBuilderStep(SUIT_ADDON_OPTIONS.length + 1);
      return;
    }

    setSuitBuilderStep(step => step + 1);
  }

  // Finalizes the custom suit flow by committing the selected add-ons and then adding the suit to the cart.
  // If the user opted for gloves, the glove bundle is added as a separate cart item before the suit item.
  function handleFinalizeSuitBuild() {
    setSelectedaddOns(pendingSuitAddOns);
    if (suitGlovesSelected) {
      addSuitGlovesToCart();
    }
    addGearToCart(pendingSuitAddOns);
  }

  function handleRemoveGear(itemToRemove) {
    const targetId = itemToRemove?.cartId || getCartEntryId(itemToRemove);
    setUserCart(current => current.filter(item => (item.cartId || getCartEntryId(item)) !== targetId));
  }

  // Converts the current cart into the exact payload expected by the API checkout route.
  async function handleCheckOut() {
    const orderItems = userCart.map(item => {
      const product = gearProducts.find(p => p._id === item.product);
      return {
        product: item.product,
        quantity: item.quantity,
        ...(product?.category === 'gear' ? {
          size: item.size,
          color: item.color,
          ...(item.addOns ? { addOns: item.addOns } : {}),
        } : {}),
      };
    });

    try {
      const response = await fetch(APIServer + 'orders/' + selectedUser, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({ items: orderItems }),
      });

      if (response.ok) {
        setActiveModal({ type: 'success', msg: 'Order created, taking you to your dashboard...' });
        setTimeout(() => navigate('/dashboard?tab=orders'), 3000);
      } else {
        const data = await response.json();
        setActiveModal({ type: 'failure', msg: data.msg.join('\n') });
      }
    } catch (err) {
      setActiveModal({ type: 'failure', msg: 'API Failure' });
      console.error(err);
    }
  }

  // Main gear ordering form and cart summary. This drives the product selector, size/color fields,
  // and the live cart display used to review the order before checkout.
  const HTML_Order = (
    <div className={styles.rulesCard}>
      {loggedInUser && loggedInUser.memberType === 'admin' && (
        <>
          <br />
          <div className={styles.inputPairing}>
            <label htmlFor="userName">Select User: </label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              {allUsers.map(u => (
                <option key={u._id} value={u._id}>{u.firstName}, {u.lastName}</option>
              ))}
            </select>
          </div>
        </>
      )}
      <h2>The winter order is currently LIVE! </h2>
      <br></br>
      <p>We are now accepting orders with delivery estimated by end of April 2027; submit your order today!</p>
      <br />
      <form id={styles.addTireForm} onSubmit={(e) => handleAddGear(e)}>
        <div className={styles.inputPairing}>
          <label htmlFor="gearName">Select Gear: </label>
          <select value={selectedGear} onChange={(e) => setSelectedGear(e.target.value)}>
            <option key="gearNone" value=""></option>
            {gearProducts.map(gear => (
              <option key={gear._id} value={gear._id}>
                {gearNameMap[gear.name] || gear.name}
              </option>
            ))}
          </select>
        </div>

        {selectedGear && sizesAvailable.length > 0 && (
          <div className={styles.inputPairing}>
            <label htmlFor="gearSize">Size: </label>
            <select value={selectedSize} onChange={(e) => {
              const nextSize = e.target.value;
              setSelectedSize(nextSize);
              if (String(nextSize).trim().toLowerCase() === 'custom') {
                setSelectedColor('custom');
              } else {
                setSelectedColor('');
              }
            }}>
              <option key="sizeNone" value=""></option>
              {sizesAvailable.map(size => (
                <option key={size} value={size}>{formatSizeLabel(size)}</option>
              ))}
            </select>
          </div>
        )}

        {selectedGear && selectedSize && colorsAvailable.length > 0 && (
          <div className={styles.inputPairing}>
            <label htmlFor="gearColor">Color: </label>
            {isCustomSizeSelected ? (
              <div aria-label="Custom color" style={{ fontWeight: 600 }}>{formatColorLabel('custom')}</div>
            ) : (
              <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
                <option key="colorNone" value=""></option>
                {colorsAvailable
                  .filter(color => String(color).trim().toLowerCase() !== 'custom')
                  .map(color => (
                    <option key={color} value={color}>{formatColorLabel(color)}</option>
                  ))}
              </select>
            )}
          </div>
        )}

        {(selectedColor || (selectedSize && colorsAvailable.length === 0) || (selectedGear && sizesAvailable.length === 0 && colorsAvailable.length === 0)) && (
          <>
            <div className={styles.inputPairing}>
              <label>Price: ${formatMoney(selectedGearPrice)}</label>
            </div>

            {loggedInUser ? (
              <>
                <div className={styles.inputPairing}>
                  <label htmlFor="tireQty">Quantity: </label>
                  <button type="button" id={styles.qtyButton} onClick={() => setQtyOrder(q => Math.max(1, q - 1))}>
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    step={1}
                    value={qtyOrder}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val)) setQtyOrder(Math.max(1, val));
                    }}
                  />
                  <button id={styles.qtyButton} type="button" onClick={() => setQtyOrder(q => q + 1)}>
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>

                <button type="submit">{isSupermanSuit ? 'Build my suit' : 'Add To Cart'}</button>
              </>
            ) : (
              <div>
                Please <a href="/dashboard?redirect=ShopGear" style={{ color: 'blue', textDecoration: 'underline' }}>log in</a> to create an order.
              </div>
            )}
          </>
        )}
      </form>

      {userCart.length > 0 && (
        <div id={styles.cart}>
          <h3>Your Cart</h3>

          {/* The cart is intentionally simple: each line shows the selected item and its total value.
              When a suit + glove bundle is present, the subtotal is struck through and the discounted total is shown next to it. */}

          {userCart.map(item => {
            const cartProduct = getGearProductById(item.product);
            return (
              <div id={styles.cartEntry} key={item.cartId || getCartEntryId(item)}>
                <div>
                  {item.quantity}x {gearNameMap[cartProduct?.name] || cartProduct?.name}
                  {item.size ? ` (${formatSizeLabel(item.size)})` : ''}
                  {item.color ? ` (${formatColorLabel(item.color)})` : ''}
                  {item.addOns && item.addOns.length > 0 ? ` (${item.addOns.join(', ')})` : ''}
                  <span> - ${formatMoney(item.price * item.quantity)}</span>
                </div>
                <button onClick={() => handleRemoveGear(item)}>Remove Item</button>
              </div>
            );
          })}

          <div className={styles.inputPairing}>
            {/* Cart totals are intentionally displayed as subtotal + discounted total when the suit/glove bundle applies. */}
            Balance Due:
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <span style={{ textDecoration: hasSuitAndGlovesInCart ? 'line-through' : 'none' }}>${formatMoney(orderSubtotal)}</span>
              {hasSuitAndGlovesInCart && (
                <strong>${formatMoney(balanceDue)}</strong>
              )}
            </div>
          </div>
          <button id={styles.checkoutButton} onClick={() => handleCheckOut()}>Submit Order</button>
        </div>
      )}
    </div>
  );

  const HTML_Welcome = <div className={styles.rulesCard}>
    <p>Your safety on track is something that is important to us. We have been working with PLUS Racing Gear since 2018 and are committed to providing you with the highest quality gear for
      your riding needs. We offer a wide range of products to suit your specific requirements; from airbag-ready race suits, to street jackets and gloves, we got you covered. 😎</p>
    <br></br>
    <p>Below, you will find more information about PLUS Racing Gear and the products we offer.</p>
  </div>


  const HTML_Suit = <div className={styles.rulesCard}>
    <p>Our race suits are all bespoke and custom made for you to ensure maximum comfort and protection while on track. They are available either as
      airbag ready, standard or 2-piece zippered design for those planning to ride on the street as well. We also offer a wide range of add-ons to customize your suit to your liking.
    </p>
    <br></br>
    <h2>Standard Included Features</h2>
    <br></br>
    <ul>
      <li>Cowhide 1.2-1.3 mm high grade leather (CE approved)</li>
      <li>SAS-TEC Germany CE level II EN 1621-2 Body Armor (Back, shoulders, elbows, hips, knees)</li>
      <li>Keprotec abrasion resistant fabric with maximum mobility in key areas</li>
      <li>Soft Neoprene wrists and ankles for comfort</li>
      <li>Double leather layer in exposed areas for maximum abrasion resistance</li>
      <li>Polyester removable mesh lining</li>
      <li>YKK zippers</li>
    </ul>

    <br></br>
    <h2>Helpful Links</h2>
    <br></br>
    <ul>
      <li><a href='https://youtu.be/P5jJX3lxRq4' target="_blank" rel="noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>How to design your suit</a></li>
      <li><a href='https://files.ride42.ca/api/public/dl/fYeWTL9O?inline=true' download="PLUS Templates.zip" target="_blank" rel="noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>Download Design Template</a></li>
      <li><a href='https://youtu.be/0HLv8ZIwWdg' target="_blank" rel="noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>HELITE Airbag Usage</a></li>
      <li><a href='https://youtu.be/EmLXZcRJD1U' target="_blank" rel="noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>HELITE Airbag Install</a></li>

    </ul>
    <br></br>
    <h2>Starting at: $1200</h2>
  </div>

  const HTML_Gloves = <div className={styles.rulesCard}>
    <p>An amazing value, our kangaroo leather gloves fit... like a glove! Balanced combination of kangaroo and cowhide creates the right blend of comfort and durability.
      Available in a wide range of sizes and colors, they are perfect for track or street use. Also available as a custom size/design for those with additional or missing fingers.
    </p>
    <br></br>

    <a href={gloveSizingGuide} target="_blank" rel="noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>View Size Guide</a>
    <br></br>
    <br></br>
    <h2>Key Features</h2>
    <br></br>
    <ul>
      <li>Cowhide 1.2-1.3 mm high grade leather (CE approved)</li>
      <li>KNOX SPS palm sliders (CE approved)</li>
      <li>High tensile Aramid palm inserts for extra layer of protection</li>
      <li>DFS (dual finger seams) system to avoid ripping</li>
      <li>Pinky finger bridge to avoid distortion</li>
      <li>Pre-curved fingers for race fit</li>
    </ul>
    <br></br>
    <h2>Starting at: $200</h2>
  </div>


  const HTML_Support = <div className={styles.rulesCard}>
    <p>While PLUS Racing has several sponsored racers in MotoAmerica and various European series, we wanted to extend the rider support to Canada. Since 2020, Ride42 & PLUS have
      been working together to support out local racers through sponsorships and contingency programs. We are proud to support the sport and help riders achieve their goals on track.
    </p>

    <br></br>
    <h2>Notable Pro Riders in CSBK & SOAR</h2>
    <br></br>
    <ul>
      <li>David MacKay — Honda</li>
      <li>Zoltan Frast — BMW Motorad</li>
      <li>Christopher Pletsch — Honda</li>
      <li>Nathan Playford — Ducati</li>
      <li>Cole Alexander — Suzuki</li>
      <li>Norbert Joo — Kawasaki</li>
    </ul>
    <br></br>
    <h2>2027 Rider Support Program</h2>
    <br></br>

    <p><em>The program is currently under development. Please check back soon for updates.</em></p>

  </div>





  return (
    <>
      <div className={styles.content}>
        <Card heading={loggedInUser ? `Welcome ${loggedInUser?.firstName.charAt(0).toUpperCase() + loggedInUser?.firstName.slice(1)}!` : 'Welcome!'} body={HTML_Welcome} inverted={false} />

        <Card heading='PLUS Racing Suit' body={HTML_Suit} img={cover} inverted={true} />
        <Card heading='PLUS Racing Gloves' body={HTML_Gloves} img={[gloveRed, gloveBlack, gloveWhite, gloveWhite2, gloveFluo, gloveBlue, gloveGreen]} inverted={false} />
        <Card heading='We Support The Sport' body={HTML_Support} img={[David, Zoli, Chris, Nathan, Cole, Chopper]} inverted={true} />
        <Card heading="Submit your order" body={HTML_Order} />

      </div>

      <Loading open={activeModal.type === 'loading'}>
        {activeModal.msg}
      </Loading>

      {/* Suit builder modal flow:
          0 = intro
          1..N = per-addon prompts
          N+1 = glove prompt
          N+2 = glove size/color selection
          N+3 = final summary
        This step index pattern is a little implicit, but it keeps the wizard simple and linear for review.
      */}
      <Modal open={suitBuilderOpen}>
        {!suitBuilderOpen ? null : (
          <div className={styles.suitBuilderModal}>
            <div className={styles.suitBuilderImage}>
              {(() => {
                const currentOption = SUIT_ADDON_OPTIONS[suitBuilderStep - 1];
                const isGlovePrompt = suitBuilderStep === SUIT_ADDON_OPTIONS.length + 1;
                const imageSrc = isGlovePrompt
                  ? gloveShowcase
                  : currentOption?.imagePath || plusLogo;
                const altText = isGlovePrompt ? 'Predator Gloves preview' : currentOption?.label || 'Suit build preview';

                const shouldContain = imageSrc === plusLogo;

                return (
                  <img
                    src={imageSrc}
                    alt={altText}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: shouldContain ? 'contain' : 'cover',
                      display: 'block',
                      borderRadius: '12px',
                      backgroundColor: '#fff'
                    }}
                  />
                );
              })()}
            </div>

            {suitBuilderStep === 0 ? (
              <div className={styles.suitBuilderContent}>
                <h3>Selecting your suit options</h3>
                <p>Time to build your suit, let's get started!</p>
                <button type="button" className="actionButton" onClick={() => setSuitBuilderStep(1)}>Next</button>
              </div>
            ) : suitBuilderStep === SUIT_ADDON_OPTIONS.length + 3 ? (
              <div className={styles.suitBuilderContent}>
                <h3>Nice work!</h3>
                <p>You have completed selecting your suit options. Here is a summary:</p>
                <ul className={styles.suitSummaryList}>
                  {pendingSuitAddOns.length > 0 ? (
                    pendingSuitAddOns.map(addOnKey => (
                      <li key={addOnKey}>{SUIT_ADDON_OPTIONS.find(option => option.key === addOnKey)?.label || addOnKey}</li>
                    ))
                  ) : (
                    <li>No suit add-ons selected</li>
                  )}
                  {suitGlovesSelected && (
                    <li>
                      Predator Gloves{` ${formatSizeLabel(suitGloveSize)}${suitGloveColor ? ` / ${formatColorLabel(suitGloveColor)}` : ''}`}
                    </li>
                  )}
                </ul>
                <button type="button" className="actionButton" onClick={handleFinalizeSuitBuild}>Add to cart</button>
              </div>
            ) : suitBuilderStep === SUIT_ADDON_OPTIONS.length + 2 ? (
              <div className={styles.suitBuilderContent}>
                <h3>Choose your gloves</h3>
                

                <div className={styles.inputPairing}>
                  <label htmlFor="suitGloveSize">Size: </label>
                  <select id="suitGloveSize" value={suitGloveSize} onChange={(e) => {
                    const nextSize = e.target.value;
                    setSuitGloveSize(nextSize);
                    if (String(nextSize).trim().toLowerCase() === 'custom') {
                      setSuitGloveColor('custom');
                    } else {
                      setSuitGloveColor('');
                    }
                  }}>
                    <option value="">Select Size</option>
                    {getOrderedSizes((getGloveProduct()?.sizes ?? [])).map(size => (
                      <option key={size} value={size}>{formatSizeLabel(size)}</option>
                    ))}
                  </select>
                </div>

                {suitGloveSize && (gearProducts.find(item => (item.name || '').trim().toLowerCase() === 'race gloves')?.colors ?? []).length > 0 && (
                  <div className={styles.inputPairing}>
                    <label htmlFor="suitGloveColor">Color: </label>
                    {String(suitGloveSize).trim().toLowerCase() === 'custom' ? (
                      <div aria-label="Custom color" style={{ fontWeight: 600 }}>{formatColorLabel('custom')}</div>
                    ) : (
                      <select id="suitGloveColor" value={suitGloveColor} onChange={(e) => setSuitGloveColor(e.target.value)}>
                        <option value="">Select Color</option>
                        {(gearProducts.find(item => (item.name || '').trim().toLowerCase() === 'race gloves')?.colors ?? [])
                          .filter(color => String(color).trim().toLowerCase() !== 'custom')
                          .map(color => (
                            <option key={color} value={color}>{formatColorLabel(color)}</option>
                          ))}
                      </select>
                    )}
                  </div>
                )}

                <div className={styles.suitBuilderActions}>
                  <button
                    type="button"
                    className="actionButton"
                    disabled={!suitGloveSize || (String(suitGloveSize).trim().toLowerCase() !== 'custom' && !suitGloveColor)}
                    onClick={() => {
                      if (!suitGloveSize) return;
                      if (String(suitGloveSize).trim().toLowerCase() === 'custom') {
                        setSuitGloveColor('custom');
                      }
                      setSuitBuilderStep(SUIT_ADDON_OPTIONS.length + 3);
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : suitBuilderStep === SUIT_ADDON_OPTIONS.length + 1 ? (
              <div className={styles.suitBuilderContent}>
                <h3>Need a pair of gloves?</h3>
                <p>We’ll add them to your cart and apply a $20 discount.</p>
                <div className={styles.suitBuilderActions}>
                  <button type="button" className="actionButton" onClick={() => handleSuitBuilderChoice(true)}>Yes, add gloves (+$180)</button>
                  <button type="button" className="actionButton confirmBtn" onClick={() => handleSuitBuilderChoice(false)}>No thanks</button>
                </div>
              </div>
            ) : (
              <div className={styles.suitBuilderContent}>
                <h3>{SUIT_ADDON_OPTIONS[suitBuilderStep - 1]?.label || 'Custom option'}</h3>
                <p>{SUIT_ADDON_OPTIONS[suitBuilderStep - 1]?.description || 'Would you like to add this option to your suit?'}</p>
                <div className={styles.suitBuilderActions}>
                  <button
                    type="button"
                    className="actionButton"
                    onClick={() => handleSuitBuilderChoice(true)}
                  >
                    Yes, add to my suit (+${formatMoney(getSuitAddOnPrice(SUIT_ADDON_OPTIONS[suitBuilderStep - 1]?.key || ''))})
                  </button>
                  <button type="button" className="actionButton confirmBtn" onClick={() => handleSuitBuilderChoice(false)}>No thanks</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={activeModal.type === 'success'}>
        <div className={modalStyles.modalNotif}></div>
        <img id={modalStyles.modalCheckmarkIMG} src={checkmark} alt="checkmark icon" />
        {activeModal.msg}
      </Modal>

      <Modal open={activeModal.type === 'failure'}>
        <div className={modalStyles.modalNotif}></div>
        <img id={modalStyles.modalCheckmarkIMG} src={errormark} alt="error icon" />
        {activeModal.msg}
        <button className="actionButton" onClick={() => setActiveModal('')}>Close</button>
      </Modal>
    </>
  );
};

export default ShopGear;
