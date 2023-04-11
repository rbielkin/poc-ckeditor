// app.js

// Imports necessary to run a React application.
import React from 'react';
import ReactDOM from 'react-dom';
import { useState } from 'react';

import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';

// The official <CKEditor> component for React.
import { CKEditor } from '@ckeditor/ckeditor5-react';

// The official CKEditor 5 instance inspector. It helps understand the editor view and model.
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

// The base editor class and features required to run the editor.
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import Link from '@ckeditor/ckeditor5-link/src/link';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';

// CKEditor plugin implementing a product widget to be used in the editor content.
import GridEditing from './ckeditor/grideditting';

// React components to render the list of products and the product preview.
import { ProductTable } from './react/producttable';

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui/src';
import Command from '@ckeditor/ckeditor5-core/src/command';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import { ProductTableEditor } from "./react/producttabbleeditor";

const BitcoinLogoIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" preserveAspectRatio="xMidYMid" viewBox="0 0 1 1"><path d="M63.036 39.741c-4.274 17.143-21.637 27.576-38.782 23.301C7.116 58.768-3.317 41.404.959 24.262 5.23 7.117 22.594-3.317 39.734.957c17.144 4.274 27.576 21.64 23.302 38.784z" style="fill:#f7931a" transform="scale(.01563)"/><path d="M46.1 27.441c.638-4.258-2.604-6.547-7.037-8.074l1.438-5.768-3.511-.875-1.4 5.616c-.923-.23-1.871-.447-2.813-.662l1.41-5.653-3.51-.875-1.438 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.679 1.296 1.636 2.042l-3.94 15.801c-.174.432-.615 1.08-1.61.834.036.051-2.551-.637-2.551-.637l-1.743 4.019 4.569 1.139c.85.213 1.683.436 2.503.646l-1.453 5.834 3.507.875 1.439-5.772c.958.26 1.888.5 2.798.726l-1.434 5.745 3.51.875 1.454-5.823c5.987 1.133 10.489.676 12.384-4.739 1.527-4.36-.076-6.875-3.226-8.515 2.294-.529 4.022-2.038 4.483-5.155zM38.08 38.69c-1.085 4.36-8.426 2.003-10.806 1.412l1.928-7.729c2.38.594 10.012 1.77 8.878 6.317zm1.086-11.312c-.99 3.966-7.1 1.951-9.082 1.457l1.748-7.01c1.982.494 8.365 1.416 7.334 5.553z" style="fill:#fff" transform="scale(.01563)"/></svg>';

const RESOURCE_URL = 'https://api2.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT';

class ExternalDataWidgetCommand extends Command {
    execute() {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change( writer => {
            const externalWidget = writer.createElement(
                'externalElement', {
                    ...Object.fromEntries( selection.getAttributes() ),
                    'data-resource-url': RESOURCE_URL
                }
            );

            editor.model.insertObject( externalWidget, null, null, {
                setSelection: 'on'
            } );
        } );
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;

        const isAllowed = model.schema.checkChild( selection.focus.parent, 'externalElement' );

        this.isEnabled = isAllowed;
    }
}

class ExternalDataWidget extends Plugin {
    static get requires() {
        return [ ExternalDataWidgetEditing, ExternalDataWidgetUI ];
    }
}

class ExternalDataWidgetUI extends Plugin {
    init() {
        const editor = this.editor;
        const externalWidgetCommand = editor.commands.get( 'external' );

        editor.ui.componentFactory.add( 'external', locale => {
            const button = new ButtonView( locale );

            button.set( {
                label: 'Bitcoin rate',
                tooltip: true,
                withText: false,
                icon: BitcoinLogoIcon
            } );

            button.bind( 'isEnabled' ).to( externalWidgetCommand );

            button.on( 'execute', () => {
                editor.execute( 'external' );
                editor.editing.view.focus();
            } );

            return button;
        } );
    }
}

class ExternalDataWidgetEditing extends Plugin {
    constructor( editor ) {
        super( editor );

        this.intervalId = this._intervalFetch();

        this.externalDataValue = '';
    }

    static get requires() {
        return [ Widget ];
    }

    destroy() {
        clearInterval( this.intervalId );
    }

    init() {
        this._defineSchema();
        this._defineConverters();
        this._updateWidgetData();

        this.editor.commands.add( 'external', new ExternalDataWidgetCommand( this.editor ) );
    }

    _intervalFetch() {
        return setInterval( () => this._updateWidgetData(), 10000 ); // set time interval to 10s
    }

    async _updateWidgetData( externalUrl = RESOURCE_URL ) {
        try {
            const response = await fetch( externalUrl );
            const data = await response.json();
            const updateTime = new Date( data.closeTime );
            const parsedData = '$' + Number( data.lastPrice ).toFixed( 2 ) + ' - ' + updateTime.toLocaleString();

            this.externalDataValue = parsedData;

            const rootElement = this.editor.model.document.getRoot();

            for ( const { item } of this.editor.model.createRangeIn( rootElement ) ) {
                if ( item.is( 'element', 'externalElement' ) ) {
                    this.editor.editing.reconvertItem( item );
                }
            }
        } catch ( error ) {
            console.error( error );
        }
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register( 'externalElement', {
            inheritAllFrom: '$inlineObject',
            allowAttributes: [ 'data-resource-url' ]
        } );
    }

    _defineConverters() {
        const editor = this.editor;

        editor.conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'span',
                attributes: [ 'data-resource-url' ]
            },
            model: ( viewElement, { writer } ) => {
                const externalUrl = viewElement.getAttribute( 'data-resource-url' );

                return writer.createElement( 'externalElement', {
                    'data-resource-url': externalUrl
                } );
            }
        } );

        editor.conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'externalElement',
            view: ( modelElement, { writer } ) => {
                return writer.createEmptyElement( 'span', {
                    'data-resource-url': modelElement.getAttribute( 'data-resource-url' )
                } );
            }
        } );

        editor.conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'externalElement',
            view: ( modelElement, { writer } ) => {
                const externalValueToShow = this.externalDataValue;

                const externalDataPreviewElement = writer.createRawElement( 'span', null, function( domElement ) {
                    domElement.classList.add( 'external-data-widget' );
                    domElement.textContent = externalValueToShow || 'Fetching data...';

                    if ( externalValueToShow ) {
                        domElement.classList.add( 'external-data-widget-bounce' );
                        setTimeout( () => domElement.classList.remove( 'external-data-widget-bounce' ), 1100 );
                    }
                } );

                const externalWidgetContainer = writer.createContainerElement( 'span', null, externalDataPreviewElement );

                return toWidget( externalWidgetContainer, writer, {
                    label: 'External widget'
                } );
            }
        } );
    }
}

// The React application class. It renders the editor and the product list.
function App () {
    const [editorData, setEditorData] = useState('<h2 class="start-prev-content">Check our last minute deals!</h2><p>The capital city of <a href="https://en.wikipedia.org/wiki/Malta">Malta</a> is the top destination this summer. It’s home to a cutting-edge contemporary architecture, baroque masterpieces, delicious local cuisine and at least 8 months of sun.</p><section class="product" data-id="2"></section><p>You’ll definitely love exploring <a href="https://en.wikipedia.org/wiki/Warsaw">Warsaw</a>! Best time to visit the city is July and August, when it’s cool enough to not break a sweat and hot enough to enjoy summer. The city which has quite a combination of both old and modern textures is located by the river Vistula.</p><section class="product" data-id="1"></section><h3>Other destinations</h3><figure class="table"><table><thead><tr><th>Destination</th><th>Trip details</th></tr></thead><tbody><tr><td><section class="product" data-id="3"></section><p>&nbsp;</p></td><td>Getting used to an entirely different culture can be challenging. While it’s also nice to learn about cultures online or from books, nothing comes close to experiencing cultural diversity in person. You learn to appreciate each and every single one of the differences while you become more culturally fluid. <a href="http://ckeditor.com">Find out more...</a></td></tr><tr><td><section class="product" data-id="4"></section><p>&nbsp;</p></td><td>Tourists frequently admit that Taj Mahal "simply cannot be described with words". And that’s probably true. The more you try the more speechless you become. Words give only a semblance of truth. <a href="http://ckeditor.com">Find out more...</a></td></tr></tbody></table></figure>');
    const theme = useTheme();
    const [personName, setPersonName] = React.useState([]);
    const initialEditorConfig = {
        plugins: [
            // A set of editor features to be enabled and made available to the user.
            Essentials, Heading, Bold, Italic, Underline,
            Link, Paragraph, Table, TableToolbar, Alignment, Clipboard,

            // Your custom plugin implementing the widget is loaded here.
            GridEditing
        ],
        toolbar: [
            'heading',
            '|',
            'bold', 'italic', 'underline',
            '|',
            'link', 'insertTable',
            '|',
            'undo', 'redo', 'alignment'
        ],
        table: {
            contentToolbar: [
                'tableColumn',
                'tableRow',
                'mergeTableCells'
            ]
        },

        gridSell: {
            gridRenderer: ( id, domElement) => {
                ReactDOM.render(
                    <ProductTableEditor />,
                    domElement
                )
            }
        }
    };
    const [editor, setEditor] = useState(null);
    const editorConfig = initialEditorConfig;
    const [open, setOpen] = React.useState(false);
    const [fontColor, setFontColor] = useState(localStorage.getItem('fontColor') || '#000000');

    const handleChange = (event) => {
        const {
            target: { value },
        } = event;
        setPersonName(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };
    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleSave = (id) => {
        setOpen(false);
        localStorage.setItem('fontColor', fontColor);
        localStorage.setItem('columnsToShow', personName.toString());
        editor.execute( 'insertGrid', id );
        editor.editing.view.focus();
    }
    const handleFontColorChange = (event) => {
        setFontColor(event.target.value);
    }
    // constructor( props ) {
    //     super( props );
    //
    //     // A place to store the reference to the editor instance created by the <CKEditor> component.
    //     // The editor instance is created asynchronously and is only available when the editor is ready.
    //     this.editor = null;
    //
    //     this.state = {
    //         // The initial editor data. It is bound to the editor instance and will change as
    //         // the user types and modifies the content of the editor.
    //         editorData: '<h2 class="start-prev-content">Check our last minute deals!</h2><p>The capital city of <a href="https://en.wikipedia.org/wiki/Malta">Malta</a> is the top destination this summer. It’s home to a cutting-edge contemporary architecture, baroque masterpieces, delicious local cuisine and at least 8 months of sun.</p><section class="product" data-id="2"></section><p>You’ll definitely love exploring <a href="https://en.wikipedia.org/wiki/Warsaw">Warsaw</a>! Best time to visit the city is July and August, when it’s cool enough to not break a sweat and hot enough to enjoy summer. The city which has quite a combination of both old and modern textures is located by the river Vistula.</p><section class="product" data-id="1"></section><h3>Other destinations</h3><figure class="table"><table><thead><tr><th>Destination</th><th>Trip details</th></tr></thead><tbody><tr><td><section class="product" data-id="3"></section><p>&nbsp;</p></td><td>Getting used to an entirely different culture can be challenging. While it’s also nice to learn about cultures online or from books, nothing comes close to experiencing cultural diversity in person. You learn to appreciate each and every single one of the differences while you become more culturally fluid. <a href="http://ckeditor.com">Find out more...</a></td></tr><tr><td><section class="product" data-id="4"></section><p>&nbsp;</p></td><td>Tourists frequently admit that Taj Mahal "simply cannot be described with words". And that’s probably true. The more you try the more speechless you become. Words give only a semblance of truth. <a href="http://ckeditor.com">Find out more...</a></td></tr></tbody></table></figure>'
    //     };
    //
    //     // The configuration of the <CKEditor> instance.
    //     this.editorConfig = {
    //         plugins: [
    //             // A set of editor features to be enabled and made available to the user.
    //             Essentials, Heading, Bold, Italic, Underline,
    //             Link, Paragraph, Table, TableToolbar, Alignment, Clipboard,
    //
    //             // Your custom plugin implementing the widget is loaded here.
    //             ProductPreviewEditing,
    //             GridEditing
    //         ],
    //         toolbar: [
    //             'heading',
    //             '|',
    //             'bold', 'italic', 'underline',
    //             '|',
    //             'link', 'insertTable',
    //             '|',
    //             'undo', 'redo', 'alignment'
    //         ],
    //         table: {
    //             contentToolbar: [
    //                 'tableColumn',
    //                 'tableRow',
    //                 'mergeTableCells'
    //             ]
    //         },
    //         // The configuration of the Products plugin. It specifies a function that will allow
    //         // the editor to render a React <ProductPreview> component inside a product widget.
    //         products: {
    //             productRenderer: ( id, domElement ) => {
    //                 const product = this.props.products.find( product => product.id === id );
    //
    //                 ReactDOM.render(
    //                     <ProductPreview id={id} {...product} />,
    //                     domElement
    //                 );
    //             }
    //         },
    //
    //         gridSell: {
    //             gridRenderer: ( id, domElement) => {
    //                 ReactDOM.render(
    //                     <ProductTable/>,
    //                     domElement
    //                 )
    //             }
    //         }
    //     };
    //
    //     this.handleEditorDataChange = this.handleEditorDataChange.bind( this );
    //     this.handleEditorReady = this.handleEditorReady.bind( this );
    // }

    // A handler executed when the user types or modifies the editor content.
    // It updates the state of the application.
    const handleEditorDataChange = ( evt, editor ) => {
        setEditorData(editor.getData());
    }

    // A handler executed when the editor has been initialized and is ready.
    // It synchronizes the initial data state and saves the reference to the editor instance.
    const handleEditorReady = ( editor ) => {
        setEditor(editor);

        console.warn('EDITOR ---->', editor)
        setEditorData(editor.getData());

        // CKEditor 5 inspector allows you to take a peek into the editor's model and view
        // data layers. Use it to debug the application and learn more about the editor.
        CKEditorInspector.attach( editor );
    }

    const names = [
        'Id',
        'Product',
        'Image',
        'Description',
        'Price',
        'Price Modifier',
        'Quantity',
        'Extended price',
        'Total'
    ];
    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    };

    function getStyles(name, personName, theme) {
        return {
            fontWeight:
                personName.indexOf(name) === -1
                    ? theme.typography.fontWeightRegular
                    : theme.typography.fontWeightMedium,
        };
    }


        return (
            // The application renders two columns:
            // * in the left one, the <CKEditor> and the textarea displaying live
            //   editor data are rendered.
            // * in the right column, a <ProductList> is rendered with available <ProductPreviews>
            //   to choose from.
            <div style={{display: 'flex', width: '100%'}}>
                <div className='left-side'>
                    <h3>LEFT SIDE</h3>
                    <ProductTable />
                    {/*<button onClick={( id ) => {*/}
                    {/*    editor.execute( 'insertGrid', id );*/}
                    {/*    editor.editing.view.focus();*/}
                    {/*}} >Insert Grid</button>*/}
                    <Button variant="outlined" onClick={handleClickOpen}>
                        Configure Grid
                    </Button>
                </div>
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Configure the grid</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            To configure the grid before inserting it to editor, please specify the parameters below
                        </DialogContentText>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <FormControl sx={{ mt: 2, minWidth: 120 }}>
                                <InputLabel htmlFor="fontColor">Font color</InputLabel>
                                <Select
                                    autoFocus
                                    value={fontColor}
                                    onChange={handleFontColorChange}
                                    label="fontColor"
                                    inputProps={{
                                        name: 'font-color',
                                        id: 'font-color',
                                    }}
                                >
                                    <MenuItem value={false}>false</MenuItem>
                                    <MenuItem value="red">red</MenuItem>
                                    <MenuItem value="green">green</MenuItem>
                                    <MenuItem value="blue">blue</MenuItem>
                                    <MenuItem value="yellow">yellow</MenuItem>
                                    <MenuItem value="black">black</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl sx={{ mt: 3, minWidth: 220 }}>
                                <InputLabel htmlFor="demo-multiple-name-label">Columns to show</InputLabel>
                                <Select
                                    labelId="demo-multiple-name-label"
                                    id="demo-multiple-name"
                                    multiple
                                    value={personName}
                                    onChange={handleChange}
                                    input={<OutlinedInput label="Name" />}
                                    MenuProps={MenuProps}
                                >
                                    {names.map((name) => (
                                        <MenuItem
                                            key={name}
                                            value={name}
                                            style={getStyles(name, personName, theme)}
                                        >
                                            {name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSave}>Insert</Button>
                    </DialogActions>
                </Dialog>
                <div className="app__offer-editor right-side" key="offer-editor">
                    <h3>RIGHT SIDE</h3>
                    <CKEditor
                        editor={ClassicEditor}
                        data={editorData}
                        config={editorConfig}
                        onChange={handleEditorDataChange}
                        onReady={handleEditorReady}
                    />

                    <h3>Editor data</h3>
                    <textarea value={editorData} readOnly={true}></textarea>
                </div>
            </div>
        );
}


// Render the <App> in the <div class="app"></div> element found in the DOM.
ReactDOM.render(
    <App
        // Feeding the application with predefined products.
        // In a real-life application, this sort of data would be loaded
        // from a database. To keep this tutorial simple, a few
        //  hard–coded product definitions will be used.
        products={[
            {
                id: 1,
                name: 'Colors of summer in Poland',
                price: '$1500',
                image: 'product1.jpg'
            },
            {
                id: 2,
                name: 'Mediterranean sun on Malta',
                price: '$1899',
                image: 'product2.jpg'
            },
            {
                id: 3,
                name: 'Tastes of Asia',
                price: '$2599',
                image: 'product3.jpg'
            },
            {
                id: 4,
                name: 'Exotic India',
                price: '$2200',
                image: 'product4.jpg'
            }
        ]}
    />,
    document.querySelector( '.app' )
);