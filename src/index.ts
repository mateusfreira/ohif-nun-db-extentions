import { connect } from 'nun-db-react';


export default {
	id: 'ohif-nun-db',

  /**
   * @param {object} params
   * @param {object} params.configuration
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns void
   */
  async preRegistration({ servicesManager, commandsManager, configuration }) {
    console.log('you will win sooner or latter!!');
    // Registering new services
    //servicesManager.registerService(MyNewService(servicesManager));
    //const React = { useLayoutEffect: () =>{}};
    // Todo fix connect int he nun-db react lib
    //console.log(React);
  },
};
