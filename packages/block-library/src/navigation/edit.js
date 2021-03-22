/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	InnerBlocks,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	InspectorControls,
	JustifyToolbar,
	BlockControls,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, withSelect, withDispatch } from '@wordpress/data';
import {
	Button,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { close, menu, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';

import NavigationPlaceholder from './placeholder';
import PlaceholderPreview from './placeholder-preview';

function Navigation( {
	selectedBlockHasDescendants,
	attributes,
	setAttributes,
	clientId,
	hasExistingNavItems,
	isImmediateParentOfSelectedBlock,
	isSelected,
	updateInnerBlocks,
	className,
	hasSubmenuIndicatorSetting = true,
	hasItemJustificationControls = attributes.orientation === 'horizontal',
} ) {
	const [ isPlaceholderShown, setIsPlaceholderShown ] = useState(
		! hasExistingNavItems
	);
	const [ isResponsiveMenuOpen, setResponsiveMenuOpen ] = useState( false );

	const { selectBlock } = useDispatch( blockEditorStore );

	const blockProps = useBlockProps( {
		className: classnames( className, {
			[ `items-justified-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
			'is-vertical': attributes.orientation === 'vertical',
		} ),
	} );

	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator(
		clientId
	);

	const responsiveContainerClasses = classnames(
		'wp-block-navigation__responsive-container',
		{
			'is-open': isResponsiveMenuOpen,
		}
	);

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-navigation__container',
		},
		{
			allowedBlocks: [
				'core/navigation-link',
				'core/search',
				'core/social-links',
				'core/page-list',
				'core/spacer',
			],
			orientation: attributes.orientation || 'horizontal',
			renderAppender:
				( isImmediateParentOfSelectedBlock &&
					! selectedBlockHasDescendants ) ||
				isSelected
					? InnerBlocks.DefaultAppender
					: false,
			__experimentalAppenderTagName: 'li',
			__experimentalCaptureToolbars: true,
			// Template lock set to false here so that the Nav
			// Block on the experimental menus screen does not
			// inherit templateLock={ 'all' }.
			templateLock: false,
			__experimentalLayout: {
				type: 'default',
				alignments: [],
			},
			placeholder: <PlaceholderPreview />,
		}
	);

	if ( isPlaceholderShown ) {
		return (
			<div { ...blockProps }>
				<NavigationPlaceholder
					onCreate={ ( blocks, selectNavigationBlock ) => {
						setIsPlaceholderShown( false );
						updateInnerBlocks( blocks );
						if ( selectNavigationBlock ) {
							selectBlock( clientId );
						}
					} }
				/>
			</div>
		);
	}

	return (
		<>
			<BlockControls>
				{ hasItemJustificationControls && (
					<JustifyToolbar
						value={ attributes.itemsJustification }
						onChange={ ( value ) =>
							setAttributes( { itemsJustification: value } )
						}
						popoverProps={ {
							position: 'bottom right',
							isAlternate: true,
						} }
					/>
				) }
				<ToolbarGroup>{ navigatorToolbarButton }</ToolbarGroup>
			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				{ hasSubmenuIndicatorSetting && (
					<PanelBody title={ __( 'Display settings' ) }>
						<ToggleControl
							checked={ attributes.showSubmenuIcon }
							onChange={ ( value ) => {
								setAttributes( {
									showSubmenuIcon: value,
								} );
							} }
							label={ __( 'Show submenu indicator icons' ) }
						/>
					</PanelBody>
				) }
			</InspectorControls>
			<nav { ...blockProps }>
				<Button
					className="wp-block-navigation__responsive-container-open "
					aria-label="Close menu"
					data-micromodal-trigger="modal-1"
					onClick={ () =>
						setResponsiveMenuOpen( ! isResponsiveMenuOpen )
					}
				>
					<Icon icon={ menu } />
				</Button>

				<div
					className={ responsiveContainerClasses }
					id={ `${ clientId }-modal` }
					aria-hidden="true"
				>
					<div
						className="wp-block-navigation__responsive-close"
						tabIndex="-1"
						data-micromodal-close
					>
						<div
							className="wp-block-navigation__responsive-dialog"
							role="dialog"
							aria-modal="true"
							aria-labelledby="modal-1-title"
						>
							<Button
								className="wp-block-navigation__responsive-container-close"
								aria-label="Close menu"
								data-micromodal-close
								onClick={ () => {
									setResponsiveMenuOpen( false );
								} }
							>
								<Icon icon={ close } />
							</Button>
							<div
								className="wp-block-navigation__responsive-container-content"
								id={ `${ clientId }-modal-content` }
							>
								<ul { ...innerBlocksProps }></ul>
							</div>
						</div>
					</div>
				</div>
			</nav>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( blockEditorStore ).getBlocks( clientId );
		const {
			getClientIdsOfDescendants,
			hasSelectedInnerBlock,
			getSelectedBlockClientId,
		} = select( blockEditorStore );
		const isImmediateParentOfSelectedBlock = hasSelectedInnerBlock(
			clientId,
			false
		);
		const selectedBlockId = getSelectedBlockClientId();
		const selectedBlockHasDescendants = !! getClientIdsOfDescendants( [
			selectedBlockId,
		] )?.length;
		return {
			isImmediateParentOfSelectedBlock,
			selectedBlockHasDescendants,
			hasExistingNavItems: !! innerBlocks.length,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateInnerBlocks( blocks ) {
				if ( blocks?.length === 0 ) {
					return false;
				}
				dispatch( blockEditorStore ).replaceInnerBlocks(
					clientId,
					blocks,
					true
				);
			},
		};
	} ),
] )( Navigation );
