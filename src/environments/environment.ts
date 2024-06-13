import packageInfo from '../../package.json';

export const environment = {
  production: false,
  cordova: false,
  environment: 'development',
  firebase: {
    apiKey: 'AIzaSyDx4rLh46AWV-lVQW6zGAo5bUjKQSKtZfI',
    authDomain: 'bonjour-notalone-dev.firebaseapp.com',
    databaseURL: 'https://bonjour-notalone-dev.firebaseio.com',
    projectId: 'bonjour-notalone-dev',
    storageBucket: 'bonjour-notalone-dev.appspot.com',
    messagingSenderId: '1086335673175',
    appId: '1:1086335673175:web:c34e0562bb151cc04f1412',
    measurementId: 'G-8NSMVVNB26',
    vapidKey: 'BFHi5gtr2trQf8ikiVhSOdctoma4N6-1IT_kpal_1w-4SIlB1O-Iil-4Mf13f-S3JnmyJ0RQWN0y8T0Qn8HLgQU',
    webClientId: '1086335673175-1paac7l16rql203g1e3bk0feidjlg194.apps.googleusercontent.com'
  },
  name: packageInfo.name,
  version: packageInfo.version
};
