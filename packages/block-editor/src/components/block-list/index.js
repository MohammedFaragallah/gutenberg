/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import { useRef, createContext, useState } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import useBlockDropZone from '../use-block-drop-zone';
import useInsertionPoint from './insertion-point';
import BlockPopover from './block-popover';
import { store as blockEditorStore } from '../../store';
import { useScrollSelectionIntoView } from '../selection-scroll-into-view';
import { LayoutProvider, defaultLayout } from './layout';

export const BlockNodes = createContext();
export const SetBlockNodes = createContext();

export default function BlockList( { className, __experimentalLayout } ) {
	const ref = useRef();
	const [ blockNodes, setBlockNodes ] = useState( {} );
	const insertionPoint = useInsertionPoint( ref );
	useScrollSelectionIntoView( ref );

	const isLargeViewport = useViewportMatch( 'medium' );
	const { isTyping, isOutlineMode, isFocusMode } = useSelect( ( select ) => {
		const { isTyping: _isTyping, getSettings } = select( blockEditorStore );
		const { outlineMode, focusMode } = getSettings();
		return {
			isTyping: _isTyping(),
			isOutlineMode: outlineMode,
			isFocusMode: focusMode,
		};
	}, [] );

	return (
		<BlockNodes.Provider value={ blockNodes }>
			{ insertionPoint }
			<BlockPopover />
			<div
				ref={ ref }
				className={ classnames(
					'block-editor-block-list__layout is-root-container',
					className,
					{
						'is-typing': isTyping,
						'is-outline-mode': isOutlineMode,
						'is-focus-mode': isFocusMode && isLargeViewport,
					}
				) }
			>
				<SetBlockNodes.Provider value={ setBlockNodes }>
					<BlockListItems
						wrapperRef={ ref }
						__experimentalLayout={ __experimentalLayout }
					/>
				</SetBlockNodes.Provider>
			</div>
		</BlockNodes.Provider>
	);
}

function Items( {
	placeholder,
	rootClientId,
	renderAppender,
	__experimentalAppenderTagName,
	__experimentalLayout: layout = defaultLayout,
	wrapperRef,
} ) {
	function selector( select ) {
		const {
			getBlockOrder,
			getBlockListSettings,
			getSelectedBlockClientId,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
		} = select( blockEditorStore );
		return {
			blockClientIds: getBlockOrder( rootClientId ),
			selectedBlockClientId: getSelectedBlockClientId(),
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
			orientation: getBlockListSettings( rootClientId )?.orientation,
			hasMultiSelection: hasMultiSelection(),
		};
	}

	const {
		blockClientIds,
		selectedBlockClientId,
		multiSelectedBlockClientIds,
		orientation,
		hasMultiSelection,
	} = useSelect( selector, [ rootClientId ] );

	const dropTargetIndex = useBlockDropZone( {
		element: wrapperRef,
		rootClientId,
	} );

	const isAppenderDropTarget = dropTargetIndex === blockClientIds.length;

	return (
		<LayoutProvider value={ layout }>
			{ blockClientIds.map( ( clientId, index ) => {
				const isBlockInSelection = hasMultiSelection
					? multiSelectedBlockClientIds.includes( clientId )
					: selectedBlockClientId === clientId;

				const isDropTarget = dropTargetIndex === index;

				return (
					<AsyncModeProvider
						key={ clientId }
						value={ ! isBlockInSelection }
					>
						<BlockListBlock
							rootClientId={ rootClientId }
							clientId={ clientId }
							// This prop is explicitely computed and passed down
							// to avoid being impacted by the async mode
							// otherwise there might be a small delay to trigger the animation.
							index={ index }
							className={ classnames( {
								'is-drop-target': isDropTarget,
								'is-dropping-horizontally':
									isDropTarget &&
									orientation === 'horizontal',
							} ) }
						/>
					</AsyncModeProvider>
				);
			} ) }
			{ blockClientIds.length < 1 && placeholder }
			<BlockListAppender
				tagName={ __experimentalAppenderTagName }
				rootClientId={ rootClientId }
				renderAppender={ renderAppender }
				className={ classnames( {
					'is-drop-target': isAppenderDropTarget,
					'is-dropping-horizontally':
						isAppenderDropTarget && orientation === 'horizontal',
				} ) }
			/>
		</LayoutProvider>
	);
}

export function BlockListItems( props ) {
	// This component needs to always be synchronous as it's the one changing
	// the async mode depending on the block selection.
	return (
		<AsyncModeProvider value={ false }>
			<Items { ...props } />
		</AsyncModeProvider>
	);
}
