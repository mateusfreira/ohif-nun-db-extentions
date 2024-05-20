import { connect } from 'nun-db-react';

import React from 'react';
import * as cornerstone from '@cornerstonejs/core';

const config = window.config;

type NunDbEvent = {
  value: {
    openTime: number;
  };
};
type EventState = {
  pedding: number;
};
const nunDbStateHolder = {
  isRemoteControlEnabled: true,
  openTime: new Date().getTime(),
  changedDisplaySetsIndex: ['default'],
  eventsState: new Map<string, EventState>(),
};

function hasPeddingEvent(eventName: string) {
  const eventsState = nunDbStateHolder.eventsState.get(eventName) || { pedding: 0 };
  return eventsState.pedding > 0;
}

function resolvePeddingEvent(eventName: string) {
  const eventsState = nunDbStateHolder.eventsState.get(eventName) || { pedding: 0 };
  eventsState.pedding = eventsState.pedding - 1;
}

function eventTriggedBYNundb(eventName: string) {
  const eventsState = nunDbStateHolder.eventsState.get(eventName) || { pedding: 0 };
  eventsState.pedding = eventsState.pedding + 1;
  nunDbStateHolder.eventsState.set(eventName, eventsState);
}

function sendEvent(eventName: string, data: any) {
  if (hasPeddingEvent(eventName)) {
    resolvePeddingEvent(eventName);
    console.log('Ignoring this event from this client');
    return;
  }
  return nunDb.set(eventName, data);
}

function watchEvent(eventName: string, callback: (event: NunDbEvent) => void) {
  nunDb.watch(eventName, (event: NunDbEvent) => {
    eventTriggedBYNundb(eventName);
    if (isFromThisClient(event)) {
      console.warn('Ignoring this event from this client');
      return;
    }
    callback(event);
  });
}

function isFromThisClient(event: { value: { openTime: number } }) {
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

const getCommandsModule = ({ servicesManager }) => {
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
    nunDb.watch(`${config.nunDb.key}-modeOpen`, (event: { value: string | URL }) => {
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
  async onModeEnter({ servicesManager }) {
    const ViewportGridService = servicesManager.services.ViewportGridService;
    const DisplaySetService = servicesManager.services.DisplaySetService;
    watchGridStateEvent(ViewportGridService, DisplaySetService);

    nunDb.set(`${config.nunDb.key}-modeOpen`, document.location.href);
    scheduleCornestoneCameraWatch();
  },
  async onModeExit() {
    nunDb.set(`${config.nunDb.key}-modeOpen`, document.location.href);
  },
};

export default NunDbExtentionConfig;

function watchGridStateEvent(ViewportGridService: any, DisplaySetService: any) {
  ViewportGridService.subscribe(ViewportGridService.EVENTS.GRID_STATE_CHANGED, e => {
    setTimeout(() => {
      const gridState = ViewportGridService.getState();
      const gridViewports = gridState.viewports.values().toArray();

      const activeDisplaySets = DisplaySetService.activeDisplaySets;
      const displaysetIdList = activeDisplaySets.map(adi => adi.displaySetInstanceUID);
      const changedDisplaySetsIndex = gridViewports.map(vp =>
        displaysetIdList.indexOf(vp.displaySetInstanceUIDs[0])
      );

      const eventPropagate = {
        ...e,
        changedDisplaySetsIndex,
        openTime: nunDbStateHolder.openTime,
      };
      if (
        nunDbStateHolder.changedDisplaySetsIndex.every(
          dsi => !changedDisplaySetsIndex.includes(dsi)
        )
      ) {
        nunDb.set(`${config.nunDb.key}-grid-state`, eventPropagate);
        nunDbStateHolder.changedDisplaySetsIndex = changedDisplaySetsIndex;
      }
    }, 1);
  });

  nunDb.watch(`${config.nunDb.key}-grid-state`, nunDbEvent => {
    if (isFromThisClient(nunDbEvent)) {
      return;
    }
    nunDbStateHolder.changedDisplaySetsIndex = nunDbEvent.value.changedDisplaySetsIndex;

    ViewportGridService.setDisplaySetsForViewports([
      {
        viewportId: nunDbEvent.value.state.activeViewportId,
        displaySetInstanceUIDs: [
          DisplaySetService.activeDisplaySets.map(adi => adi.displaySetInstanceUID)[
            nunDbEvent.value.changedDisplaySetsIndex[0]
          ],
        ],
        viewportOptions: {
          viewportType: 'stack',
          viewportId: 'default',
          toolGroupId: 'default',
        },
        displaySetOptions: [
          {
            id: 'defaultDisplaySetId',
            options: {},
          },
        ],
      },
    ]);
  });
}

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
      sendEvent(`${key}`, eventPropagate);
      const currentImageIdIndex = viewport.getCurrentImageIdIndex();
      sendEvent(`${config.nunDb.key}-currentImageIdIndex`, {
        openTime: nunDbStateHolder.openTime,
        currentImageIdIndex,
      });
    } else {
      state.ignore = false;
    }
  });

  watchEvent(`${key}`, (event: { value: any; openTime: number }) => {
    if (nunDbStateHolder.isRemoteControlEnabled && !isFromThisClient(event)) {
      state.ignore = true;
      !viewport.isDisabled && viewport.setCamera(event['value']);
      !viewport.isDisabled && viewport.render();
    }
  });
}

function scheduleCornestoneCameraWatch() {
  setTimeout(() => {
    const cornestoneElement = cornerstone.getEnabledElements()[0];
    const isReady = !!cornestoneElement;
    if (isReady) {
      const viewport = getViewport();
      // Todo test event listener on OHIF
      cornestoneEventListener(
        viewport,
        cornerstone.Enums.Events.CAMERA_MODIFIED,
        `${config.nunDb.key}-camera`
      );

      watchEvent(`${config.nunDb.key}-currentImageIdIndex`, event => {
        console.log('Here will watch current index');
        if (nunDbStateHolder.isRemoteControlEnabled && !isFromThisClient(event)) {
          !viewport.isDisabled && viewport.setImageIdIndex(event.value.currentImageIdIndex);
        }
      });
    } else {
      console.log('not ready yet, will retry again in 500ms');
      scheduleCornestoneCameraWatch();
    }
  }, 500);
}
function getViewport() {
    const viewport = cornerstone.getEnabledElements()[0].viewport;
    const element = viewport.element;
    return viewport;
}

