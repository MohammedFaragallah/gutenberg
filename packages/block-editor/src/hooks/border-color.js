/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../components/colors-gradients/control';
import {
	getColorClassName,
	getColorObjectByColorValue,
} from '../components/colors';
import useEditorFeature from '../components/use-editor-feature';
import { BORDER_SUPPORT_KEY } from './border';
import { cleanEmptyObject } from './utils';

const BORDER_COLOR_SUPPORT_KEY = 'color';
const EMPTY_ARRAY = [];

/**
 * Inspector control panel containing the border color related configuration.
 *
 * There is deliberate overlap between the colors and borders block supports
 * relating to border color. It can be argued the border color controls could
 * be included within either, or both, the colors and borders panels in the
 * inspector controls. If they share the same block attributes it should not
 * matter.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Border color edit element.
 */
export function BorderColorEdit( props ) {
	const {
		attributes: { borderColor, style },
		setAttributes,
	} = props;
	const colors = useEditorFeature( 'color.palette' ) || EMPTY_ARRAY;

	const disableCustomColors = ! useEditorFeature( 'color.custom' );
	const disableCustomGradients = ! useEditorFeature( 'color.customGradient' );

	if ( useIsBorderColorDisabled( props ) ) {
		return null;
	}

	const onChangeColor = ( value ) => {
		const colorObject = getColorObjectByColorValue( colors, value );
		const newStyle = {
			...style,
			border: {
				...style?.border,
				color: colorObject?.slug ? undefined : value,
			},
		};

		const newNamedColor = colorObject?.slug ? colorObject.slug : undefined;

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
			borderColor: newNamedColor,
		} );
	};

	return (
		<ColorGradientControl
			label={ __( 'Border color' ) }
			value={ borderColor || style?.border?.color }
			colors={ colors }
			gradients={ undefined }
			disableCustomColors={ disableCustomColors }
			disableCustomGradients={ disableCustomGradients }
			onColorChange={ onChangeColor }
		/>
	);
}

/**
 * Determines if there is border color support.
 *
 * @param  {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                 Whether there is support.
 */
export function hasBorderColorSupport( blockType ) {
	const support = getBlockSupport( blockType, BORDER_SUPPORT_KEY );
	return !! ( true === support || support?.color );
}

/**
 * Custom hook that checks if border color settings have been disabled.
 *
 * @param  {string} name The name of the block.
 * @return {boolean}     Whether border color setting is disabled.
 */
export function useIsBorderColorDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useEditorFeature( 'border.customColor' );
	return ! hasBorderColorSupport( blockName ) || isDisabled;
}

/**
 * Filters registered block settings, extending attributes to include
 * `borderColor` if needed.
 *
 * @param  {Object} settings Original block settings.
 * @return {Object}          Updated block settings.
 */
function addAttributes( settings ) {
	if ( ! hasBlockSupport( settings, BORDER_COLOR_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify default value if needed.
	if ( ! settings.attributes.borderColor ) {
		Object.assign( settings.attributes, {
			borderColor: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject border color.
 *
 * @param  {Object} props      Additional props applied to save element.
 * @param  {Object} blockType  Block type definition.
 * @param  {Object} attributes Block's attributes
 * @return {Object}            Filtered props to apply to save element.
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, BORDER_COLOR_SUPPORT_KEY ) ) {
		return props;
	}

	const { borderColor, style } = attributes;
	const borderColorClass = getColorClassName( 'border-color', borderColor );

	const newClassName = classnames( props.className, {
		'has-border-color': borderColor || style?.border?.color,
		[ borderColorClass ]: !! borderColorClass,
	} );

	props.className = newClassName ? newClassName : undefined;

	return props;
}

/**
 * Filters the registered block settings to apply border color styles and
 * classnames to the block edit wrapper.
 *
 * @param {Object} settings Original block settings.
 * @return {Object}         Filtered block settings.
 */
function addEditProps( settings ) {
	if ( ! hasBlockSupport( settings, BORDER_COLOR_SUPPORT_KEY ) ) {
		return settings;
	}

	const existingGetEditWrapperProps = settings.getEditWrapperProps;
	settings.getEditWrapperProps = ( attributes ) => {
		let props = {};

		if ( existingGetEditWrapperProps ) {
			props = existingGetEditWrapperProps( attributes );
		}

		return addSaveProps( props, settings, attributes );
	};

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/border/addAttributes',
	addAttributes
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/border/addSaveProps',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/border/addEditProps',
	addEditProps
);
