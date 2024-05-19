import { connect } from 'nun-db-react';

import React from 'react';
import * as cornerstone from '@cornerstonejs/core';

const config = window.config;

const nunDbStateHolder = {
  isRemoteControlEnabled: true,
  openTime: new Date().getTime(),
};

function isFromThisClient(event: { value : { openTime: number } }) {
  return nunDbStateHolder.openTime === event.value.openTime;
}

const nunDb = connect(
  React,
  config.nunDb.url,
  config.nunDb.db,
  config.nunDb.user,
  config.nunDb.token,
  true
);

const getCommandsModule = ({ servicesManager: any }) => {
  return {
    definitions: {
      enalbeNunDb: {
        commandFn: () => {
          servicesManager.services.uiNotificationService.show({
            title: 'NunDb',
            message: 'Remote control enabled',
          });
          nunDbStateHolder.isRemoteControlEnabled = true;
        },
      },
      disableNunDb: {
        commandFn: () => {
          servicesManager.services.uiNotificationService.show({
            type: 'warning',
            title: 'NunDb',
            message: 'Remote control disabled',
          });
          nunDbStateHolder.isRemoteControlEnabled = false;
        },
      },
    },
    defaultContext: 'CORNERSTONE',
  };
};

const NunDbExtentionConfig = {
  id: 'ohif-nun-db',
  getCommandsModule,
  /**
   * @param {object} params
   * @param {object} params.configuration
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns void
   */
  async preRegistration() {
    nunDb.watch(`${window.config.nunDb.key}-modeOpen`, (event: { value: string | URL }) => {
      if (nunDbStateHolder.isRemoteControlEnabled) {
        console.log('client-modeOpen', event);
        const newAddress = new URL(event.value);
        //Only change the address if the path or search has changed
        if (
          newAddress.pathname !== document.location.pathname ||
          newAddress.search !== document.location.search
        ) {
          document.location.href = `${newAddress.pathname}${newAddress.search}`;
        }
      }
    });
  },
  async onModeEnter() {
    nunDb.set(`${config.nunDb.key}-modeOpen`, document.location.href);
    scheduleCornestoneCameraWatch();
  },
  async onModeExit() {
    nunDb.set(`${config.nunDb.key}-modeOpen`, document.location.href);
  },
};

export default NunDbExtentionConfig;

function cornestoneEventListener(viewport: any, event: string, key: string) {
  const element: Element = viewport.element;
  const state = {
    ignore: false,
  };

  element.addEventListener(event, evt => {
    if (!state.ignore) {
      state.ignore = true;
      const eventPropagate = {
        ...evt.detail.camera,
        openTime: nunDbStateHolder.openTime,
      };
      nunDb.set(`${key}`, eventPropagate);
      const currentImageIdIndex = viewport.getCurrentImageIdIndex();
      nunDb.set(`${config.nunDb.key}-currentImageIdIndex`, {
        openTime: nunDbStateHolder.openTime,
        currentImageIdIndex,
      });
    } else {
      state.ignore = false;
    }
  });

  nunDb.watch(`${key}`, (event: { value: any; openTime: number }) => {
    if (nunDbStateHolder.isRemoteControlEnabled && !isFromThisClient(event)) {
      state.ignore = true;
      viewport.setCamera(event['value']);
      viewport.render();
    }
  });
}

function scheduleCornestoneCameraWatch() {
  setTimeout(() => {
    const cornestoneElement = cornerstone.getEnabledElements()[0];
    const isReady = !!cornestoneElement;
    if (isReady) {
      const viewport = cornerstone.getEnabledElements()[0].viewport;
      const element = viewport.element;
      // Todo test event listener on OHIF
      cornestoneEventListener(
        viewport,
        cornerstone.Enums.Events.CAMERA_MODIFIED,
        `${config.nunDb.key}-camera`
      );

      nunDb.watch(`${config.nunDb.key}-currentImageIdIndex`, event => {
        console.log('Here will watch current index');
        if (nunDbStateHolder.isRemoteControlEnabled && !isFromThisClient(event)) {
          viewport.setImageIdIndex(event.value.currentImageIdIndex);
        }
      });
    } else {
      console.log('not ready yet, will retry again in 500ms');
      scheduleCornestoneCameraWatch();
    }
  }, 500);
}
