import type { FederationRoomServiceSender } from './application/sender/RoomServiceSender';
import { FederationFactory } from './infrastructure/Factory';

export const FEDERATION_PROCESSING_CONCURRENCY = 1;

export const rocketSettingsAdapter = FederationFactory.buildRocketSettingsAdapter();
export const queueInstance = FederationFactory.buildFederationQueue();
rocketSettingsAdapter.initialize();
export const federationQueueInstance = FederationFactory.buildFederationQueue();
export const rocketFileAdapter = FederationFactory.buildRocketFileAdapter();
const federationBridge = FederationFactory.buildFederationBridge(rocketSettingsAdapter, federationQueueInstance);
const rocketRoomAdapter = FederationFactory.buildRocketRoomAdapter();
const rocketUserAdapter = FederationFactory.buildRocketUserAdapter();
export const rocketMessageAdapter = FederationFactory.buildRocketMessageAdapter();

const federationRoomServiceReceiver = FederationFactory.buildRoomServiceReceiver(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketMessageAdapter,
	rocketFileAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

const federationMessageServiceReceiver = FederationFactory.buildMessageServiceReceiver(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketMessageAdapter,
	rocketFileAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

const federationEventsHandler = FederationFactory.buildFederationEventHandler(
	federationRoomServiceReceiver,
	federationMessageServiceReceiver,
	rocketSettingsAdapter,
);

export let federationRoomServiceSender = FederationFactory.buildRoomServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketFileAdapter,
	rocketMessageAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

const federationRoomInternalHooksValidator = FederationFactory.buildRoomInternalHooksValidator(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketFileAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

export const federationUserServiceSender = FederationFactory.buildUserServiceSender(
	rocketUserAdapter,
	rocketFileAdapter,
	rocketSettingsAdapter,
	federationBridge,
);

const federationMessageServiceSender = FederationFactory.buildMessageServiceSender(
	rocketRoomAdapter,
	rocketUserAdapter,
	rocketSettingsAdapter,
	rocketMessageAdapter,
	federationBridge,
);

let cancelSettingsObserver: () => void;

export const runFederation = async (): Promise<void> => {
	federationRoomServiceSender = FederationFactory.buildRoomServiceSender(
		rocketRoomAdapter,
		rocketUserAdapter,
		rocketFileAdapter,
		rocketMessageAdapter,
		rocketSettingsAdapter,
		federationBridge,
	);
	FederationFactory.setupListeners(federationRoomServiceSender, federationRoomInternalHooksValidator, federationMessageServiceSender);
	federationQueueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), FEDERATION_PROCESSING_CONCURRENCY);
	cancelSettingsObserver = rocketSettingsAdapter.onFederationEnabledStatusChanged(
		federationBridge.onFederationAvailabilityChanged.bind(federationBridge),
	);
	if (!rocketSettingsAdapter.isFederationEnabled()) {
		return;
	}
	await federationBridge.start();
	federationBridge.logFederationStartupInfo('Running Federation V2');
	require('./infrastructure/rocket-chat/slash-commands');
};

const updateServiceSenderInstance = (federationRoomServiceSenderInstance: FederationRoomServiceSender) => {
	federationRoomServiceSender = federationRoomServiceSenderInstance;
};

export const stopFederation = async (federationRoomServiceSenderInstance: FederationRoomServiceSender): Promise<void> => {
	updateServiceSenderInstance(federationRoomServiceSenderInstance);
	FederationFactory.removeListeners();
	await federationBridge.stop();
	cancelSettingsObserver();
};

(async (): Promise<void> => {
	await runFederation();
})();
