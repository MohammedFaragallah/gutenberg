/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { customLink as linkIcon } from '@wordpress/icons';
import { InnerBlocks } from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';
import { enhanceNavigationLinkVariations } from './hooks';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Link', 'block title' ),

	icon: linkIcon,

	description: __( 'Add a page, link, or another item to your navigation.' ),

	__experimentalLabel: ( { label } ) => label,

	merge( leftAttributes, { label: rightLabel = '' } ) {
		return {
			...leftAttributes,
			label: leftAttributes.label + rightLabel,
		};
	},

	edit,

	save,

	example: {
		attributes: {
			label: _x( 'Example Link', 'navigation link preview example' ),
			url: 'https://example.com',
		},
	},

	deprecated: [
		{
			isEligible( attributes ) {
				return attributes.nofollow;
			},

			attributes: {
				label: {
					type: 'string',
				},
				type: {
					type: 'string',
				},
				nofollow: {
					type: 'boolean',
				},
				description: {
					type: 'string',
				},
				id: {
					type: 'number',
				},
				opensInNewTab: {
					type: 'boolean',
					default: false,
				},
				url: {
					type: 'string',
				},
			},

			migrate( { nofollow, ...rest } ) {
				return {
					rel: nofollow ? 'nofollow' : '',
					...rest,
				};
			},

			save() {
				return <InnerBlocks.Content />;
			},
		},
	],
};

// ensure that we import and use this from hooks.js, so code is not shaken out in final build.
addFilter(
	'blocks.registerBlockType',
	'core/navigation-link',
	enhanceNavigationLinkVariations
);
