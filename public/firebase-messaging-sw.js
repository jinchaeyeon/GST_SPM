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