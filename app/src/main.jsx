import React from 'react'
import ReactDOM from 'react-dom/client'
import Router from "./Router";

import './index.css'

/*
TODO:
mobile navbar position adj (helmet padding)
navbar make it sticky or fixed but avoid janky arbitraty margin on main class

*/

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<Router />
	</React.StrictMode>,
)