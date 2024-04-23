import React from 'react'
import ReactDOM from 'react-dom/client'
import Router from "./Router";

import './index.css'

/*
TODO:
dates page should indicate if trackday is cancelled (layout should say cancelled in that case)
*/

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<Router />
	</React.StrictMode>,
)