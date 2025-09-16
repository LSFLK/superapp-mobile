import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
<<<<<<< HEAD
=======
import { AuthProvider } from '@asgardeo/auth-react';
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
<<<<<<< HEAD
    <App />
=======
  <AuthProvider 
  config={ {
      signInRedirectURL: window.location.origin,
      signOutRedirectURL: window.location.origin,
      clientID: "s89UtsqQ0_rTfwO783jZw51vHxoa",
      baseUrl: "https://api.asgardeo.io/t/jayathunga",
      scope: [ "openid","profile" ]
    } }
  >
      <App />
    </AuthProvider>
    
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
