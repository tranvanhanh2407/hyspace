import { Box, IconButton } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

type HeaderProps = {
	title?: ReactNode;
	onClose?: () => void;
};

const Header: FC<HeaderProps> = ({ title, onClose, children, ...props }) => (
	<Box is='header' display='flex' flexDirection='column' pb='x16' {...props}>
		{(title || onClose) && (
			<Box display='flex' flexDirection='row' alignItems='center' pi='x24' justifyContent='space-between' flexGrow={1}>
				{title && (
					<Box color='default' fontSize='p2' fontWeight='p2' flexShrink={1} withTruncatedText>
						{title}
					</Box>
				)}
				{onClose && <IconButton small icon='cross' onClick={onClose} />}
			</Box>
		)}
		{children}
	</Box>
);

export default Header;
