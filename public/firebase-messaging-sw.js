self.addEventListener("install", function (e) {
    self.skipWaiting();
});

self.addEventListener("activate", function (e) {
    e.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (e) {
    //console.log("push: ", e.data.json());
    if (!e.data.json()) 
        return;

    const fcmMessageId = e.data.json().fcmMessageId;
    const resultData = e.data.json().notification;
    const data = e.data.json().data;
    const notificationTitle = resultData.title;

    const notificationOptions = {
        body: resultData.body,
        icon: resultData.image,
        data: data, 
        //tag: fcmMessageId,
        ...resultData,
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyBklbzZwlt7ZW2BC6_RMmQRWE4TsCSQUJg",
    authDomain: "pluswin6-webpush.firebaseapp.com",
    projectId: "pluswin6-webpush",
    storageBucket: "pluswin6-webpush.appspot.com",
    messagingSenderId: "353787056033",
    appId: "1:353787056033:web:94f496844387bb183105e0",
    measurementId: "G-0LBX8JS8D0",
  };
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(function(payload) {
	const title  =  payload.notification.title;
	const options  = {
		body: payload.notification.body,
	};
	return self.registration.showNotification(title, options);
})

self.addEventListener("notificationclick", function (event) {
    let url = "/";

    if (event.notification.data.hasOwnProperty('url'))
        url = event.notification.data['url']

    if (event.notification.data.hasOwnProperty('keyValue')) {
        url = `${url}?go=${event.notification.data['keyValue']}`
    }
    
    event.notification.close();
    event.waitUntil(clients.openWindow(url));
});
