import React, { useEffect, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
    randomCreatedDate,
    randomTraderName,
    randomUpdatedDate,
} from '@mui/x-data-grid-generator';
export const ProductTable = () => {

    const ref = useRef();
    const [inputVal, setInputVal] = React.useState(localStorage.getItem('inputVal') || '');
    useEffect(() => {
        const gridElement = ref.current;
        
        gridElement.addEventListener( 'dragstart', event => {
            const target = event.target.nodeType === 1 ? event.target : event.target.parentElement;
            const draggable = target.closest( '[draggable]' );
            console.warn('Grid element ---- >', gridElement);
            event.dataTransfer.setData( 'text/plain', draggable.innerText );
            event.dataTransfer.setData( 'text/html', draggable.innerText );
            // event.dataTransfer.setData( 'contact', JSON.stringify( contacts[ draggable.dataset.contact ] ) );
    
            event.dataTransfer.setDragImage( draggable, 0, 0 );          
            
            } );
    });

    return [
        // <div className="product-grid" id='1' ref={ref} draggable style={{ height: 300, width: '100%' }}>
        //     <DataGrid rows={rows} columns={columns} />
        // </div>
        <table className="product-grid" id='1' ref={ref} draggable>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Product</th>
                    <th>Image</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Price Modifier</th>
                    <th>Quantity</th>
                    <th>Extended price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td><input style={{border: 'none'}} type="text" value={inputVal} onChange={(event) => {
                        setInputVal(event.target.value);
                        localStorage.setItem('inputVal', event.target.value);
                    }}/></td>
                    <td><img src='./assets/product1.jpg' /></td>
                    <td>Some description</td>
                    <td>$1,000</td>
                    <td>TAB</td>
                    <td>10</td>
                    <td>$1,000</td>
                    <td>$10,000</td>
                </tr>
            </tbody>
        </table>
        // <button
        //     className="product-preview__add"
        //     onClick={() => props.onClick( props.id )}
        //     title="Add to the offer"
        // >Insert Grid</button>
    ];
};

const columns = [
    { field: 'name', headerName: 'Name', width: 180, editable: true },
    { field: 'age', headerName: 'Age', type: 'number', editable: true },
    {
        field: 'dateCreated',
        headerName: 'Date Created',
        type: 'date',
        width: 180,
        editable: true,
    },
    {
        field: 'lastLogin',
        headerName: 'Last Login',
        type: 'dateTime',
        width: 220,
        editable: true,
    },
];

const rows = [
    {
        id: 1,
        name: randomTraderName(),
        age: 25,
        dateCreated: randomCreatedDate(),
        lastLogin: randomUpdatedDate(),
    },
    {
        id: 2,
        name: randomTraderName(),
        age: 36,
        dateCreated: randomCreatedDate(),
        lastLogin: randomUpdatedDate(),
    },
    {
        id: 3,
        name: randomTraderName(),
        age: 19,
        dateCreated: randomCreatedDate(),
        lastLogin: randomUpdatedDate(),
    },
    {
        id: 4,
        name: randomTraderName(),
        age: 28,
        dateCreated: randomCreatedDate(),
        lastLogin: randomUpdatedDate(),
    },
    {
        id: 5,
        name: randomTraderName(),
        age: 23,
        dateCreated: randomCreatedDate(),
        lastLogin: randomUpdatedDate(),
    },
];
