import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, viewToModelPositionOutsideModelElement, setHighlightHandling } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import GridCommand from './gridcommand'


export default class GridEditing extends Plugin {
    static get requires() {
        return [ Widget ];
    }


    init() {
        this._defineSchema();
        this._defineConverters();
        this._defineClipboardInputOutput();

        this.editor.editing.mapper.on(
			'viewToModelPosition',
			viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( 'product-grid'))
		);

        this.editor.commands.add( 'insertGrid', new GridCommand( this.editor ) );
    }

    _defineSchema() {
        const schema = this.editor.model.schema;
		schema.register( 'grid-schema', {
			allowWhere: '$block',
			isInline: true,
			isObject: true,
			allowAttributes: [ 'id' ]
		});
	}

    _defineConverters() {
        const editor = this.editor;
        const conversion = editor.conversion;
        const renderProduct = editor.config.get( 'gridSell' ).gridRenderer;

        // <productPreview> converters ((data) view → model)
        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'section',
                classes: 'gridElement'
            },
            model: ( viewElement, { writer: modelWriter } ) => {
                // Read the "data-id" attribute from the view and set it as the "id" in the model.
                return modelWriter.createElement( 'grid-schema', {
                    id: parseInt( viewElement.getAttribute( 'data-id' ) )
                } );
            }
        } );

        // <productPreview> converters (model → data view)
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'grid-schema',
            view: ( modelElement, { writer: viewWriter } ) => {
                const id = modelElement.getAttribute( 'id' );
                const section = viewWriter.createContainerElement( 'section', {
                    class: 'gridElement',
                    'data-id': id
                } );
                // In the data view, the model <productPreview> corresponds to:
                //
                // <section class="gridElement" data-id="..."></section>
                return viewWriter.createEmptyElement( 'section', {
                    class: 'gridElement',
                    'data-id': modelElement.getAttribute( 'id' )
                } );
            }
        } );


        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'grid-schema',
            view: ( modelElement, { writer: viewWriter } ) => {
                // In the editing view, the model <productPreview> corresponds to:
                //
                // <section class="product" data-id="...">
                //     <div class="product__react-wrapper">
                //         <ProductPreview /> (React component)
                //     </div>
                // </section>
                const id = modelElement.getAttribute( 'id' );

                // The outermost <section class="product" data-id="..."></section> element.
                const section = viewWriter.createContainerElement( 'section', {
                    class: 'gridElement',
                    'data-id': id
                } );

                // The inner <div class="product__react-wrapper"></div> element.
                // This element will host a React <ProductPreview /> component.
                const reactWrapper = viewWriter.createRawElement( 'div', {
                    class: 'product__react-wrapper'
                }, function( domElement ) {
                    // This the place where React renders the actual product preview hosted
                    // by a UIElement in the view. You are using a function (renderer) passed as
                    // editor.config.products#productRenderer.
                    renderProduct( id, domElement );
                } );
                setHighlightHandling( section, viewWriter, () => console.log('added'), () => console.log('removed') );

                viewWriter.insert( viewWriter.createPositionAt( section, 0 ), reactWrapper );

                return toWidget( section, viewWriter, { label: 'product preview widget' } );
            }
        } );

    }

    _defineClipboardInputOutput() {
		const view = this.editor.editing.view;
		const viewDocument = view.document;

		// Processing pasted or dropped content.
		this.listenTo( viewDocument, 'clipboardInput', ( evt, data ) => {
			// The clipboard content was already processed by the listener on the higher priority
			// (for example while pasting into the code block).

            this.editor.execute( 'insertGrid', '1' );
		} );

		// Processing copied, pasted or dragged content.
		this.listenTo( document, 'clipboardOutput', ( evt, data ) => {
			if ( data.content.childCount != 1 ) {
				return;
			}

			const viewElement = data.content.getChild( 0 );

			if ( viewElement.is( 'element', 'span' ) && viewElement.hasClass( 'h-card' ) ) {
				data.dataTransfer.setData( 'contact', JSON.stringify( getCardDataFromViewElement( viewElement ) ) );
			}
		} );
	}

}