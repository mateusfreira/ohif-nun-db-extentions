import {
    connect
} from 'nun-db-react';
import React from 'react';
import * as cornerstone from '@cornerstonejs/core';

const nunDb = connect(
    React,
    window.config.nunDb.url,
    window.config.nunDb.db,
    window.config.nunDb.user,
    window.config.nunDb.token,
    true
);

export default {
    id: 'ohif-nun-db',

    /**
     * @param {object} params
     * @param {object} params.configuration
     * @param {ServicesManager} params.servicesManager
     * @param {CommandsManager} params.commandsManager
     * @returns void
     */
    async preRegistration({
        servicesManager,
        commandsManager,
        configuration
    }) {
        nunDb.watch('client-modeOpen', (event) => {
            // Open the same exam
            if (event.value === document.location.href) return;
            document.location.href = event.value;
        });
        // Registering new services
        //servicesManager.registerService(MyNewService(servicesManager));
        //const React = { useLayoutEffect: () =>{}};
        // Todo fix connect int he nun-db react lib
        //console.log(React);
    },
    async onModeEnter() {
        nunDb.set('client-modeOpen', document.location.href);
        setTimeout(() => {
            const viewport = cornerstone.getEnabledElements()[0].viewport;
            const element = viewport.element;
            console.log({
                element
            });

            let ignore = false;
            element.addEventListener(cornerstone.Enums.Events.CAMERA_MODIFIED, ((
                evt: cornerstone.Types.EventTypes.CameraModifiedEvent
            ) => {
              if(!ignore) {
                nunDb.set('client-camera', evt.detail.camera);
                const currentImageIdIndex = viewport.getCurrentImageIdIndex();
                nunDb.set('client-currentImageIdIndex', { currentImageIdIndex });
              } else {
                ignore = false;
              }
            }) as EventListener);
            nunDb.watch('client-currentImageIdIndex', (event) => {
                ignore = true;
                viewport.setImageIdIndex(event.value.currentImageIdIndex);
            })
            nunDb.watch('client-camera', (event) => {
                ignore = true;
              viewport.setCamera(event.value);
              viewport.render();
            });
        }, 500);
    },
    async onModeExit() {
        nunDb.set('client-modeOpen', '/');
    },
};
