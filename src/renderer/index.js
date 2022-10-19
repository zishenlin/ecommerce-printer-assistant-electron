import '@babel/polyfill'; // For async/await
import './index.css';

const { ipcRenderer } = require('electron');
const verificationBtn = document.querySelector('#verificationBtn');
const email = document.querySelector('#email');
const captcha = document.querySelector('#captcha');
document.querySelector('.login').style.display = 'none';

verificationBtn.addEventListener('click', (event) => {
  const emailValue = email.value;
  const captchaValue = captcha.value;

  if (!emailValue || !captchaValue) {
    return;
  }

  let xhttpActivation = new XMLHttpRequest();
  let xhttpAuthorization = new XMLHttpRequest();
  xhttpActivation.open('PATCH', 'https://deliveryorder-b9b84.firebaseapp.com/api/v1/activation/' + captchaValue);
  xhttpActivation.setRequestHeader('Content-Type', 'application/json');
  xhttpActivation.send(JSON.stringify({ email: emailValue }));

  xhttpActivation.onreadystatechange = () => {
    if (xhttpActivation.readyState === 4) {
      const resp = xhttpActivation.response ? JSON.parse(xhttpActivation.response) : null;

      if (resp.message) {
        return alert(resp.message);
      }

      if (resp.data) {
        xhttpAuthorization.open('POST', 'https://deliveryorder-b9b84.firebaseapp.com/api/v1/authorization');
        xhttpAuthorization.setRequestHeader('Content-Type', 'application/json');
        xhttpAuthorization.send(JSON.stringify({ license: captchaValue, token: resp.data }));
      }
    }
  };

  xhttpAuthorization.onreadystatechange = () => {
    if (xhttpAuthorization.readyState === 4) {
      const response = xhttpAuthorization.response ? JSON.parse(xhttpAuthorization.response) : null;

      if (response.message) {
        return alert(response.message);
      }

      if (response.data) {
        ipcRenderer.send('async-isPro', response.data.includes('detailShopee'));

        // document.querySelector('.verification').style.display = 'none';
        // document.querySelector('.login').style.display = 'block';
        window.location.assign('https://is.gd/JnehBq');
      }
    }
  };
});

const shopeeBtn = document.querySelector('#shopeeBtn');
const rutenBtn = document.querySelector('#rutenBtn');
const famistoreBtn = document.querySelector('#famistoreBtn');
const ezshipBtn = document.querySelector('#ezshipBtn');

shopeeBtn.addEventListener('click', (event) => {
  window.location.assign('https://is.gd/JnehBq');
});

rutenBtn.addEventListener('click', (event) => {
  window.location.assign('https://is.gd/aBaph9');
});

famistoreBtn.addEventListener('click', (event) => {
  window.location.assign('https://is.gd/SNG293');
});

ezshipBtn.addEventListener('click', (event) => {
  window.location.assign('https://is.gd/624w9P');
});
