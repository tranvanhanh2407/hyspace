import { Box } from '@rocket.chat/fuselage';
import { useAttachmentAutoLoadEmbedMedia, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useCollapse } from '../../../../../components/message/Attachments/hooks/useCollapse';
import type { UrlPreview as UrlPreviewType } from './PreviewList';
import UrlPreviewResolver from './UrlPreviewResolver';

const UrlPreview = (props: UrlPreviewType): ReactElement => {
	const autoLoadMedia = useAttachmentAutoLoadEmbedMedia();
	const [collapsed, collapse] = useCollapse(!autoLoadMedia);
	const t = useTranslation();

	return (
		<>
			<Box display='flex' flexDirection='row' color='hint' fontScale='c1' alignItems='center'>
				{t('Link_Preview')} {collapse}
			</Box>
			{!collapsed && <UrlPreviewResolver {...props} />}
		</>
	);
};

export default UrlPreview;
