// ckeditor/insertproductpreviewcommand.js

import Command from '@ckeditor/ckeditor5-core/src/command';

export default class GridCommand extends Command {
    execute( id ) {
        this.editor.model.change( writer => {
            // Insert <productPreview id="...">*</productPreview> at the current selection position
            // in a way which will result in creating a valid model structure.
            this.editor.model.insertContent( writer.createElement( 'grid-schema', { id } ) );
        } );
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), 'grid-schema' );

        this.isEnabled = allowedIn !== null;
    }
}
