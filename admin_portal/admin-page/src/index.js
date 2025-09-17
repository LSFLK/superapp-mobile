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
            signInRedirectURL: "https://b9852c74-bc78-48f6-9b02-bbd2da8fd972.e1-us-east-azure.choreoapps.dev",
            signOutRedirectURL: "https://b9852c74-bc78-48f6-9b02-bbd2da8fd972.e1-us-east-azure.choreoapps.dev",
            clientID: "Hza4f1SMGU1t6SiB8mRGm0jyoTYa",
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
