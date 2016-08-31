import saveForm from 'lib/save-form';
import noop from 'lodash/noop';
import fill from 'lodash/fill';
import flatten from 'lodash/flatten';
import omit from 'lodash/omit';
import printDocument from 'lib/utils/print-document';
import * as NoticeActions from 'state/notices/actions';

export const OPEN_PRINTING_FLOW = 'OPEN_PRINTING_FLOW';
export const EXIT_PRINTING_FLOW = 'EXIT_PRINTING_FLOW';
export const UPDATE_ADDRESS_VALUE = 'UPDATE_ADDRESS_VALUE';
export const UPDATE_PACKAGE_WEIGHT = 'UPDATE_PACKAGE_WEIGHT';
export const UPDATE_RATE = 'UPDATE_RATE';
export const PURCHASE_LABEL_REQUEST = 'PURCHASE_LABEL_REQUEST';
export const PURCHASE_LABEL_RESPONSE = 'PURCHASE_LABEL_RESPONSE';

export const openPrintingFlow = () => {
	return { type: OPEN_PRINTING_FLOW };
};

export const exitPrintingFlow = () => {
	return { type: EXIT_PRINTING_FLOW };
};

export const updateAddressValue = ( group, name, value ) => {
	return {
		type: UPDATE_ADDRESS_VALUE,
		group,
		name,
		value,
	};
};

export const updatePackageWeight = ( packageIndex, value ) => {
	return {
		type: UPDATE_PACKAGE_WEIGHT,
		packageIndex,
		value,
	};
};

export const updateRate = ( packageIndex, value ) => {
	return {
		type: UPDATE_RATE,
		packageIndex,
		value,
	};
};

export const purchaseLabel = () => ( dispatch, getState, { callbackURL, nonce, submitMethod } ) => {
	let error = null;
	let response = null;
	const setError = ( err ) => error = err;
	const setSuccess = ( success, json ) => {
		if ( success ) {
			response = json;
		}
	};
	const setIsSaving = ( saving ) => {
		if ( saving ) {
			dispatch( { type: PURCHASE_LABEL_REQUEST } );
		} else {
			dispatch( { type: PURCHASE_LABEL_RESPONSE, response, error } );
			if ( error ) {
				dispatch( NoticeActions.errorNotice( error.toString() ) );
			} else {
				printDocument( 'data:application/pdf;base64,' + response[ 0 ].image ); // TODO: Figure out how to print multiple PDFs
				dispatch( exitPrintingFlow() );
			}
		}
	};

	const form = getState().shippingLabel.form;
	const formData = {
		origin: form.origin.values,
		destination: form.destination.values,
		packages: form.packages.values.map( ( pckg, index ) => ( {
			...omit( pckg, [ 'items', 'id' ] ),
			service_id: form.rates.values[ index ],
			products: flatten( pckg.items.map( ( item ) => fill( new Array( item.quantity ), item.product_id ) ) ),
		} ) ),
	};

	saveForm( setIsSaving, setSuccess, noop, setError, callbackURL, nonce, submitMethod, formData );
};