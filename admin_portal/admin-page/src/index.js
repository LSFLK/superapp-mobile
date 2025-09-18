import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
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
            signInRedirectURL: "https://a96477cc-362b-4509-95ad-fcdb6507c34a.e1-us-east-azure.choreoapps.dev",
            signOutRedirectURL: "https://a96477cc-362b-4509-95ad-fcdb6507c34a.e1-us-east-azure.choreoapps.dev",
            clientID: "Bj8K5_LUYGGGy8lvc2xtSvfbj3ca",
            baseUrl: "https://api.asgardeo.io/t/jayathunga",
            scope: [ "openid","profile" ]
        } }

     /* config={ {
            signInRedirectURL: "http://localhost:3000",
            signOutRedirectURL: "http://localhost:3000",
            clientID: "lwGgwFMsB86wdJlPLHUmmteWZf0a",
            baseUrl: "https://api.asgardeo.io/t/jayathunga",
            scope: [ "openid","profile" ]
        } }  */      
  >
      <App />
    </AuthProvider>
    

  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
