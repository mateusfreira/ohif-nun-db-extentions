import {
    connect
} from 'nun-db-react';

import React from 'react';
import * as cornerstone from '@cornerstonejs/core';


const nunDbStateHolder = {
    isRemoteControlEnabled: true,
};
const nunDb = connect(
    React,
    window.config.nunDb.url,
    window.config.nunDb.db,
    window.config.nunDb.user,
    window.config.nunDb.token,
    true
);

const getCommandsModule = ({
    servicesManager,
}) => {
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
}

export default {
    id: 'ohif-nun-db',
    getCommandsModule,
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
        configuration,
    }) {
        nunDb.watch(`${window.config.nunDb.key}-modeOpen`, (event) => {
            if(nunDbStateHolder.isRemoteControlEnabled) {
                console.log('client-modeOpen', event);
                const newAddress = new URL(event.value);
                //Only change the address if the path or search has changed
                if (newAddress.pathname !== document.location.pathname || newAddress.search !== document.location.search) {
                    document.location.href = `${newAddress.pathname}${newAddress.search}`
                }
            }
        });
        // Registering new services
        //servicesManager.registerService(MyNewService(servicesManager));
        //const React = { useLayoutEffect: () =>{}};
        // Todo fix connect int he nun-db react lib
        //console.log(React);
    },
    async onModeEnter() {
        nunDb.set(`${window.config.nunDb.key}-modeOpen`, document.location.href);
        scheduleCornestoneCameraWatch();
;
    },
    async onModeExit() {
        nunDb.set(`${window.config.nunDb.key}-modeOpen`, document.location.href);
    },
};

function scheduleCornestoneCameraWatch() {
    setTimeout(() => {
        const cornestoneElement = cornerstone.getEnabledElements()[0];
        const isReady = !!cornestoneElement;
        if (isReady) {

            const viewport = cornerstone.getEnabledElements()[0].viewport;
            const element = viewport.element;
            console.log({
                element
            });

            let ignore = false;
            element.addEventListener(cornerstone.Enums.Events.CAMERA_MODIFIED, ((
                evt: cornerstone.Types.EventTypes.CameraModifiedEvent
            ) => {
                if (!ignore) {
                    nunDb.set(`${window.config.nunDb.key}-camera`, evt.detail.camera);
                    const currentImageIdIndex = viewport.getCurrentImageIdIndex();
                    nunDb.set(`${window.config.nunDb.key}-currentImageIdIndex`, {
                        currentImageIdIndex
                    });
                } else {
                    ignore = false;
                }
            }) as EventListener);
            nunDb.watch(`${window.config.nunDb.key}-currentImageIdIndex`, (event) => {
                if(nunDbStateHolder.isRemoteControlEnabled) {
                    ignore = true;
                    viewport.setImageIdIndex(event.value.currentImageIdIndex);
                }
            })
            nunDb.watch(`${window.config.nunDb.key}-camera`, (event) => {
                if(nunDbStateHolder.isRemoteControlEnabled) {
                    ignore = true;
                    viewport.setCamera(event.value);
                    viewport.render();
                }
            });
        } else {
            console.log('not ready yet, will retry again in 500ms');
            schedule();
        }
    }, 500);
}
