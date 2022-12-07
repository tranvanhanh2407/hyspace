import { Box, Modal, Button, TextInput, Icon, Field, ToggleSwitch, FieldGroup } from '@rocket.chat/fuselage';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation, TranslationKey, useEndpoint } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import { useHasLicenseModule } from '../../../ee/client/hooks/useHasLicenseModule';
import UserAutoCompleteMultipleFederated from '../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';

export type CreateChannelProps = {
	values: {
		name: string;
		type: boolean;
		federated?: boolean;
		readOnly?: boolean;
		encrypted?: boolean;
		broadcast?: boolean;
		users: string[];
		description?: string;
	};
	handlers: {
		handleName?: () => void;
		handleDescription?: () => void;
		handleEncrypted?: () => void;
		handleReadOnly?: () => void;
		handleUsers: (users: Array<string>) => void;
	};
	hasUnsavedChanges: boolean;
	onChangeType: React.FormEventHandler<HTMLElement>;
	onChangeBroadcast: React.FormEventHandler<HTMLElement>;
	onChangeFederated: React.FormEventHandler<HTMLElement>;
	canOnlyCreateOneType?: false | 'p' | 'c';
	e2eEnabledForPrivateByDefault?: boolean;
	onCreate: () => void;
	onClose: () => void;
};

const getFederationHintKey = (licenseModule: ReturnType<typeof useHasLicenseModule>, featureToggle: boolean): TranslationKey => {
	if (licenseModule === 'loading' || !licenseModule) {
		return 'error-this-is-an-ee-feature';
	}
	if (!featureToggle) {
		return 'Federation_Matrix_Federated_Description_disabled';
	}
	return 'Federation_Matrix_Federated_Description';
};

const CreateChannel = ({
	values,
	handlers,
	hasUnsavedChanges,
	onChangeType,
	onChangeBroadcast,
	canOnlyCreateOneType,
	onChangeFederated,
	e2eEnabledForPrivateByDefault,
	onCreate,
	onClose,
}: CreateChannelProps): ReactElement => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const namesValidation = useSetting('UTF8_Channel_Names_Validation');
	const allowSpecialNames = useSetting('UI_Allow_room_names_with_special_chars');
	const federationEnabled = useSetting('Federation_Matrix_enabled');
	const channelNameExists = useEndpoint('GET', '/v1/rooms.nameExists');

	const channelNameRegex = useMemo(() => new RegExp(`^${namesValidation}$`), [namesValidation]);

	const [nameError, setNameError] = useState<string>();

	const federatedModule = useHasLicenseModule('federation');

	const canUseFederation = federatedModule !== 'loading' && federatedModule && federationEnabled;

	const checkName = useDebouncedCallback(
		async (name: string) => {
			setNameError(undefined);
			if (hasUnsavedChanges) {
				return;
			}
			if (!name || name.length === 0) {
				return setNameError(t('Field_required'));
			}
			if (!allowSpecialNames && !channelNameRegex.test(name)) {
				return setNameError(t('error-invalid-name'));
			}
			const { exists } = await channelNameExists({ roomName: name });

			if (exists) {
				return setNameError(t('Channel_already_exist', name));
			}
		},
		100,
		[channelNameRegex],
	);

	useEffect(() => {
		checkName(values.name);
	}, [checkName, values.name]);

	const e2edisabled = useMemo<boolean>(
		() => !values.type || values.broadcast || Boolean(!e2eEnabled) || Boolean(e2eEnabledForPrivateByDefault),
		[e2eEnabled, e2eEnabledForPrivateByDefault, values.broadcast, values.type],
	);

	const canSave = useMemo(() => hasUnsavedChanges && !nameError, [hasUnsavedChanges, nameError]);

	return (
		<Modal data-qa='create-channel-modal'>
			<Modal.Header>
				<Modal.Title>{t('Create_channel')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Name')}</Field.Label>
						<Field.Row>
							<TextInput
								data-qa-type='channel-name-input'
								error={hasUnsavedChanges ? nameError : undefined}
								addon={<Icon name={values.type ? 'lock' : 'hash'} size='x20' />}
								placeholder={t('Channel_name')}
								onChange={handlers.handleName}
							/>
						</Field.Row>
						{hasUnsavedChanges && nameError && <Field.Error>{nameError}</Field.Error>}
					</Field>
					<Field>
						<Field.Label>
							{t('Topic')}{' '}
							<Box is='span' color='annotation'>
								({t('optional')})
							</Box>
						</Field.Label>
						<Field.Row>
							<TextInput
								placeholder={t('Channel_what_is_this_channel_about')}
								onChange={handlers.handleDescription}
								data-qa-type='channel-topic-input'
							/>
						</Field.Row>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Private')}</Field.Label>
								<Field.Description>
									{values.type ? t('Only_invited_users_can_acess_this_channel') : t('Everyone_can_access_this_channel')}
								</Field.Description>
							</Box>
							<ToggleSwitch
								checked={!!values.type}
								disabled={!!canOnlyCreateOneType}
								onChange={onChangeType}
								data-qa-type='channel-private-toggle'
							/>
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Federation_Matrix_Federated')}</Field.Label>
								<Field.Description>{t(getFederationHintKey(federatedModule, Boolean(federationEnabled)))}</Field.Description>
							</Box>
							<ToggleSwitch checked={values.federated} onChange={onChangeFederated} disabled={!canUseFederation} />
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Read_only')}</Field.Label>
								<Field.Description>
									{values.readOnly
										? t('Only_authorized_users_can_write_new_messages')
										: t('All_users_in_the_channel_can_write_new_messages')}
								</Field.Description>
							</Box>
							<ToggleSwitch checked={values.readOnly} disabled={values.broadcast || values.federated} onChange={handlers.handleReadOnly} />
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Encrypted')}</Field.Label>
								<Field.Description>{values.type ? t('Encrypted_channel_Description') : t('Encrypted_not_available')}</Field.Description>
							</Box>
							<ToggleSwitch checked={values.encrypted} disabled={e2edisabled || values.federated} onChange={handlers.handleEncrypted} />
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Broadcast')}</Field.Label>
								<Field.Description>{t('Broadcast_channel_Description')}</Field.Description>
							</Box>
							<ToggleSwitch checked={values.broadcast} onChange={onChangeBroadcast} disabled={!!values.federated} />
						</Box>
					</Field>
					<Field>
						<Field.Label>{`${t('Add_members')} (${t('optional')})`}</Field.Label>
						<UserAutoCompleteMultipleFederated value={values.users} onChange={handlers.handleUsers} />
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!canSave} onClick={onCreate} primary data-qa-type='create-channel-confirm-button'>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateChannel;
