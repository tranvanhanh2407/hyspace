import type { AppPricingPlan } from '@rocket.chat/core-typings';
import { Box, Tag, Margins } from '@rocket.chat/fuselage';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo } from 'react';

import { formatPricingPlan, formatPrice } from './helpers';

type PriceDisplayProps = {
	purchaseType: string;
	pricingPlans: AppPricingPlan[];
	price: number;
	showType?: boolean;
	marginInline?: string;
};

type PlanType = 'Subscription' | 'Paid' | 'Free';

type FormattedPriceAndPlan = {
	type: PlanType;
	price: string;
};

const formatPriceAndPurchaseType = (purchaseType: string, pricingPlans: AppPricingPlan[], price: number): FormattedPriceAndPlan => {
	if (purchaseType === 'subscription') {
		const type = 'Subscription';
		if (!pricingPlans || !Array.isArray(pricingPlans) || pricingPlans.length === 0) {
			return { type, price: '-' };
		}

		return { type, price: formatPricingPlan(pricingPlans[0]) };
	}

	if (price > 0) {
		return { type: 'Paid', price: formatPrice(price) };
	}

	return { type: 'Free', price: '-' };
};

const PriceDisplay: FC<PriceDisplayProps> = ({ purchaseType, pricingPlans, price, showType = true }) => {
	const t = useTranslation();

	const { type, price: formattedPrice } = useMemo(
		() => formatPriceAndPurchaseType(purchaseType, pricingPlans, price),
		[purchaseType, pricingPlans, price],
	);

	return (
		<Margins inlineStart='x8'>
			<Tag medium>
				{showType && (
					<Box color='default' withTruncatedText>
						{t(type as TranslationKey)}
					</Box>
				)}
				<Box withTruncatedText>{!showType && type === 'Free' ? t(type) : formattedPrice}</Box>
			</Tag>
		</Margins>
	);
};

export default PriceDisplay;
