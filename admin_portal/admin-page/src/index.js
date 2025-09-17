import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { AuthProvider } from '@asgardeo/auth-react';


const root = ReactDOM.createRoot(document.getElementById('root'));
// Derive Asgardeo settings from CRA env (must be prefixed with REACT_APP_).
// Defaults fall back to current origin for local dev.


root.render(
  <React.StrictMode>

  <AuthProvider
  config={ {
            signInRedirectURL: "https://7207c220-dc36-4c12-80b7-f404f971c139.e1-us-east-azure.choreoapps.dev",
            signOutRedirectURL: "https://7207c220-dc36-4c12-80b7-f404f971c139.e1-us-east-azure.choreoapps.dev",
            clientID: "s89UtsqQ0_rTfwO783jZw51vHxoa",
            baseUrl: "https://api.asgardeo.io/t/jayathunga",
            scope: [ "openid","profile" ]
        } }
  >
      <App />
    </AuthProvider>
    

  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
