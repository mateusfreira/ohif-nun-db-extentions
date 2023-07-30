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


## Getting Started
...


### Install Nundb lib
* In bash command
```bash
yarn add ohif-nun-db
```
* platform/app/pluginConfig.json
```js
// Add this to the pluginConfig.json in extentions
    {
      "packageName": "ohif-nun-db"
    }
```

* Add your Nundb configs to your default.js
```json
  nunDb: {
    url: $nunDbUrl,
    db: $databaseName,
    user: 'client',
    token: 'client-pwd',
  },

```
