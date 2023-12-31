# OHIF Nun-db

## Nun-db and OHIF Integration POC

 This repository contains a proof-of-concept (POC) integration between Nun-db and OHIF (Open Health Imaging
Foundation). The purpose of this experiment is to explore how Nun-db can facilitate multi-user interactions within
OHIF, a widely-used open-source platform for medical imaging.

## Overview

 The integration aims to leverage Nun-db, a real-time browser-based database, to enhance the collaborative capabilities of OHIF. By utilizing Nun-db's real-time synchronization and data sharing features, we can enable multiple users to interact with OHIF simultaneously, providing a seamless and collaborative experience.

## Features

 - Real-time data synchronization: Nun-db allows real-time synchronization of data across multiple users, ensuring that any changes made by one user are immediately reflected for others.
 - Multi-user interactions: With Nun-db, multiple users can simultaneously interact with OHIF, enabling collaborative viewing, annotation, and analysis of medical images.


### Install Nun-db lib
```bash
yarn cli add-extension ohif-nun-db
```

* Add your Nun-db config to your `platform/app/public/config/default.js`

```javascript
window.config = {
  //.. Omitted for simplicity
  dataSources: [
  //... Omitted for simplicity
  ],
  hotkeys: [
  //... Omitted for simplicity
  ],
  nunDb: {
    URL: 'wss://ws-staging.nundb.org', // Nun-db server address
    db: 'features-of-db',// Nun-db Db instance
    user: 'client', // Nun-db db user
    token: 'client-pwd',// Nun-db user token
    key: 'client-YOUR_NAME_HERE', // Replace this key to a unique one
  },
};
```

# Demo
https://github.com/mateusfreira/ohif-nun-db-extentions/assets/234049/88a99874-678e-4b82-a4b1-cab934af27b6


## Tutorial
* Checkout the full tutorial in my blog [Here](https://mateusfreira.github.io/@mateusfreira-real-time-medical-image-collaboration-ohif-nun-db/).
